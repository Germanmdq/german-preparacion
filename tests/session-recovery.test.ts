import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../data/questions';
import { scoreAssessment } from '../lib/assessment/scoring';
import {
  answeredQuestionCount,
  chooseRestorableSession,
  firstUnansweredQuestionIndex,
  hydrateRestorableSession,
  isCompletedAssessmentSession,
} from '../lib/assessment/session-recovery';
import {
  assessmentStorage,
  assessmentStorageKey,
  createSession,
  type AssessmentSession,
} from '../lib/storage/assessment-storage';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage });

const answersFor = (count: number) => Object.fromEntries(questions.slice(0, count).map((question) => [question.id, question.options[0].id]));
const makeSession = (sessionId: string, answerCount: number, createdAt: string, updatedAt = createdAt): AssessmentSession => ({
  ...createSession(new Date(createdAt)),
  sessionId,
  createdAt,
  updatedAt,
  answers: answersFor(answerCount),
});

test('case A: a new user has no restorable session, so creation happens only after recovery finishes', () => {
  assert.equal(chooseRestorableSession(null, [], questions), null);
  const fresh = createSession(new Date('2026-09-14T12:00:00.000Z'));
  assert.equal(answeredQuestionCount(fresh, questions), 0);
});

test('case A: Firestore is checked before creating the first session', async () => {
  const events: string[] = [];
  const fresh = await hydrateRestorableSession(
    null,
    async () => {
      events.push('firestore:start');
      await Promise.resolve();
      events.push('firestore:finish');
      return [];
    },
    questions,
    () => {
      events.push('create');
      return createSession(new Date('2026-09-14T12:00:00.000Z'));
    },
  );
  assert.deepEqual(events, ['firestore:start', 'firestore:finish', 'create']);
  assert.equal(answeredQuestionCount(fresh, questions), 0);
});

test('case B: three answers resume on question four', () => {
  const partial = makeSession('partial', 3, '2026-09-14T10:00:00.000Z');
  const recovered = chooseRestorableSession(partial, [], questions);
  assert.ok(recovered);
  assert.equal(answeredQuestionCount(recovered, questions), 3);
  assert.equal(firstUnansweredQuestionIndex(recovered, questions), 3);
});

test('case C: signing out can clear the UID cache and the same account recovers remotely', () => {
  memoryStorage.clear();
  const partial = makeSession('remote-after-logout', 6, '2026-09-14T10:00:00.000Z');
  assessmentStorage.save('user-a', partial);
  assessmentStorage.clear('user-a');
  assert.equal(assessmentStorage.load('user-a'), null);
  assert.equal(chooseRestorableSession(null, [{ id: partial.sessionId, data: partial }], questions)?.sessionId, partial.sessionId);
});

test('case D: Firestore restores progress when localStorage is empty', () => {
  const remote = makeSession('remote-only', 8, '2026-09-14T10:00:00.000Z');
  const recovered = chooseRestorableSession(null, [{ id: remote.sessionId, data: remote }], questions);
  assert.equal(recovered?.sessionId, remote.sessionId);
  assert.equal(firstUnansweredQuestionIndex(recovered!, questions), 8);
});

test('case E: a completed remote evaluation remains completed and restores its result', () => {
  const answers = answersFor(questions.length);
  const result = scoreAssessment(questions, answers);
  const completed: AssessmentSession = {
    ...makeSession('completed', questions.length, '2026-09-14T10:00:00.000Z'),
    answers,
    completedAt: '2026-09-14T10:15:00.000Z',
    updatedAt: '2026-09-14T10:15:00.000Z',
    scores: result.scores,
    primaryPattern: result.primaryPattern,
    secondaryPattern: result.secondaryPattern,
  };
  const recovered = chooseRestorableSession(null, [{ id: completed.sessionId, data: completed }], questions);
  assert.ok(recovered && isCompletedAssessmentSession(recovered, questions));
  assert.equal(recovered.primaryPattern, result.primaryPattern);
});

test('case F: localStorage is strictly separated by UID', () => {
  memoryStorage.clear();
  const sessionA = makeSession('session-a', 4, '2026-09-14T10:00:00.000Z');
  const sessionB = makeSession('session-b', 2, '2026-09-14T11:00:00.000Z');
  assessmentStorage.save('user-a', sessionA);
  assessmentStorage.save('user-b', sessionB);
  assert.notEqual(assessmentStorageKey('user-a'), assessmentStorageKey('user-b'));
  assert.equal(assessmentStorage.load('user-a')?.sessionId, 'session-a');
  assert.equal(assessmentStorage.load('user-b')?.sessionId, 'session-b');
  assessmentStorage.clear('user-a');
  assert.equal(assessmentStorage.load('user-a'), null);
  assert.equal(assessmentStorage.load('user-b')?.sessionId, 'session-b');
});

test('case G: an empty local session cannot replace Firestore progress', () => {
  const remote = makeSession('remote-progress', 8, '2026-09-14T10:00:00.000Z');
  const accidentalEmpty = makeSession('accidental-empty', 0, '2026-09-14T11:00:00.000Z');
  const recovered = chooseRestorableSession(accidentalEmpty, [{ id: remote.sessionId, data: remote }], questions);
  assert.equal(recovered?.sessionId, remote.sessionId);
  assert.equal(answeredQuestionCount(recovered!, questions), 8);
});

test('case G: a new session is never created before the Firestore read finishes', async () => {
  const events: string[] = [];
  const remote = makeSession('remote-before-create', 5, '2026-09-14T10:00:00.000Z');
  const recovered = await hydrateRestorableSession(
    null,
    async () => {
      events.push('firestore:start');
      await Promise.resolve();
      events.push('firestore:finish');
      return [{ id: remote.sessionId, data: remote }];
    },
    questions,
    () => {
      events.push('create');
      return createSession();
    },
  );
  assert.deepEqual(events, ['firestore:start', 'firestore:finish']);
  assert.equal(recovered.sessionId, remote.sessionId);
});

test('the stronger remote version wins over stale local data for the same session', () => {
  const local = makeSession('shared', 3, '2026-09-14T10:00:00.000Z', '2026-09-14T10:10:00.000Z');
  const remote = makeSession('shared', 8, '2026-09-14T10:00:00.000Z', '2026-09-14T10:05:00.000Z');
  const recovered = chooseRestorableSession(local, [{ id: remote.sessionId, data: remote }], questions);
  assert.equal(answeredQuestionCount(recovered!, questions), 8);
});

test('Firestore Timestamp-like values are normalized correctly', () => {
  const remote = {
    ...makeSession('timestamped', 2, '2026-09-14T10:00:00.000Z'),
    updatedAt: { toDate: () => new Date('2026-09-14T11:00:00.000Z') },
  };
  const recovered = chooseRestorableSession(null, [{ id: 'timestamped', data: remote }], questions);
  assert.equal(recovered?.updatedAt, '2026-09-14T11:00:00.000Z');
});
