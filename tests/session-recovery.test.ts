import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../data/questions';
import { scoreAssessment } from '../lib/assessment/scoring';
import {
  answeredQuestionCount,
  firstUnansweredQuestionIndex,
  isCompletedAssessmentSession,
  normalizeAssessmentSession,
} from '../lib/assessment/session-recovery';
import {
  ASSESSMENT_STORAGE_KEY,
  assessmentStorage,
  createSession,
  type AssessmentSession,
} from '../lib/storage/assessment-storage';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  keys() { return [...this.values.keys()]; }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage });

const answersFor = (count: number) => Object.fromEntries(questions.slice(0, count).map((question) => [question.id, question.options[0].id]));
const makeSession = (sessionId: string, answerCount: number): AssessmentSession => ({
  ...createSession(new Date('2026-09-14T10:00:00.000Z')),
  sessionId,
  answers: answersFor(answerCount),
});

test('a new visitor receives a locally generated sessionId', () => {
  memoryStorage.clear();
  assert.equal(assessmentStorage.load(), null);
  const fresh = createSession();
  assert.ok(fresh.sessionId);
  assert.equal(answeredQuestionCount(fresh, questions), 0);
});

test('three saved answers restore the evaluation on question four', () => {
  memoryStorage.clear();
  assessmentStorage.save(makeSession('visitor-session', 3));
  const recovered = normalizeAssessmentSession(assessmentStorage.load());
  assert.ok(recovered);
  assert.equal(recovered.sessionId, 'visitor-session');
  assert.equal(answeredQuestionCount(recovered, questions), 3);
  assert.equal(firstUnansweredQuestionIndex(recovered, questions), 3);
});

test('closing and reopening the same browser preserves the local session', () => {
  memoryStorage.clear();
  const partial = makeSession('same-browser-session', 7);
  assessmentStorage.save(partial);
  const reopened = assessmentStorage.load();
  assert.equal(reopened?.sessionId, partial.sessionId);
  assert.deepEqual(reopened?.answers, partial.answers);
  assert.deepEqual(memoryStorage.keys(), [ASSESSMENT_STORAGE_KEY]);
});

test('a completed evaluation reloads as completed with the same result', () => {
  memoryStorage.clear();
  const answers = answersFor(questions.length);
  const result = scoreAssessment(questions, answers);
  const completed: AssessmentSession = {
    ...makeSession('completed-session', questions.length),
    answers,
    completedAt: '2026-09-14T10:15:00.000Z',
    updatedAt: '2026-09-14T10:15:00.000Z',
    scores: result.scores,
    primaryPattern: result.primaryPattern,
    secondaryPattern: result.secondaryPattern,
  };
  assessmentStorage.save(completed);
  const recovered = normalizeAssessmentSession(assessmentStorage.load());
  assert.ok(recovered && isCompletedAssessmentSession(recovered, questions));
  assert.equal(recovered.primaryPattern, result.primaryPattern);
});

test('invalid local data is rejected instead of mixing it into a new session', () => {
  assert.equal(normalizeAssessmentSession({ answers: answersFor(4) }), null);
});

test('starting over creates a different sessionId without mutating the previous object', () => {
  const previous = makeSession('previous-session', questions.length);
  const fresh = createSession();
  assert.notEqual(fresh.sessionId, previous.sessionId);
  assert.equal(previous.sessionId, 'previous-session');
  assert.equal(answeredQuestionCount(fresh, questions), 0);
});
