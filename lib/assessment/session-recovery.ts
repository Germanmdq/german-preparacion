import { patternKeys, type PatternKey, type Question } from '@/data/questions';
import type { Answers, ScoreMap } from './scoring';
import type { AssessmentSession, AudioPlayEvent } from '@/lib/storage/assessment-storage';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isPattern = (value: unknown): value is PatternKey => typeof value === 'string' && patternKeys.includes(value as PatternKey);

const toIso = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
  }
  if (!isRecord(value)) return null;
  if (typeof value.toDate === 'function') {
    try {
      const date = (value.toDate as () => unknown)();
      return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
    } catch {
      return null;
    }
  }
  if (typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  return null;
};

const readAnswers = (value: unknown): Answers => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
};

const readAudioPlayEvents = (value: unknown): AudioPlayEvent[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((event) => {
    if (!isRecord(event) || typeof event.questionId !== 'string' || typeof event.optionId !== 'string') return [];
    const playedAt = toIso(event.playedAt);
    if (!playedAt) return [];
    return [{
      questionId: event.questionId,
      optionId: event.optionId,
      playedAt,
      order: typeof event.order === 'number' ? event.order : 0,
    }];
  });
};

const readScores = (value: unknown): ScoreMap | null => {
  if (!isRecord(value) || !patternKeys.every((pattern) => typeof value[pattern] === 'number' && Number.isFinite(value[pattern]))) return null;
  return Object.fromEntries(patternKeys.map((pattern) => [pattern, value[pattern]])) as ScoreMap;
};

export const normalizeAssessmentSession = (value: unknown, fallbackSessionId?: string): AssessmentSession | null => {
  if (!isRecord(value)) return null;
  const sessionId = fallbackSessionId ?? (typeof value.sessionId === 'string' && value.sessionId ? value.sessionId : undefined);
  if (!sessionId) return null;
  const createdAt = toIso(value.createdAt) ?? toIso(value.updatedAt);
  if (!createdAt) return null;
  const completedAt = value.completedAt == null ? null : toIso(value.completedAt);
  const updatedAt = toIso(value.updatedAt) ?? completedAt ?? createdAt;
  return {
    sessionId,
    createdAt,
    updatedAt,
    completedAt,
    answers: readAnswers(value.answers),
    audioPlayEvents: readAudioPlayEvents(value.audioPlayEvents),
    scores: readScores(value.scores),
    primaryPattern: isPattern(value.primaryPattern) ? value.primaryPattern : null,
    secondaryPattern: isPattern(value.secondaryPattern) ? value.secondaryPattern : null,
    resultVersion: typeof value.resultVersion === 'string' ? value.resultVersion : 'provisional-v1',
    ...(typeof value.restartOf === 'string' && value.restartOf ? { restartOf: value.restartOf } : {}),
  };
};

export const answeredQuestionCount = (session: AssessmentSession, questionList: Question[]) => questionList.reduce((total, question) => {
  const answer = session.answers[question.id];
  return total + (question.options.some((option) => option.id === answer) ? 1 : 0);
}, 0);

export const firstUnansweredQuestionIndex = (session: AssessmentSession, questionList: Question[]) => questionList.findIndex((question) => {
  const answer = session.answers[question.id];
  return !question.options.some((option) => option.id === answer);
});

export const isCompletedAssessmentSession = (session: AssessmentSession, questionList: Question[]) => (
  Boolean(session.completedAt && session.scores && session.primaryPattern && session.secondaryPattern)
  && answeredQuestionCount(session, questionList) === questionList.length
);

const timestamp = (value: string) => Date.parse(value) || 0;

const compareVersions = (left: AssessmentSession, right: AssessmentSession, questionList: Question[]) => {
  const completedDifference = Number(isCompletedAssessmentSession(left, questionList)) - Number(isCompletedAssessmentSession(right, questionList));
  if (completedDifference) return completedDifference;
  const progressDifference = answeredQuestionCount(left, questionList) - answeredQuestionCount(right, questionList);
  if (progressDifference) return progressDifference;
  const audioDifference = left.audioPlayEvents.length - right.audioPlayEvents.length;
  if (audioDifference) return audioDifference;
  return timestamp(left.updatedAt) - timestamp(right.updatedAt);
};

export const chooseRestorableSession = (
  localValue: unknown,
  remoteValues: Array<{ data: unknown; id?: string }>,
  questionList: Question[],
): AssessmentSession | null => {
  const local = normalizeAssessmentSession(localValue);
  const candidates = [
    ...(local ? [local] : []),
    ...remoteValues.flatMap(({ data, id }) => {
      const session = normalizeAssessmentSession(data, id);
      return session ? [session] : [];
    }),
  ];
  if (!candidates.length) return null;

  const bestBySession = new Map<string, AssessmentSession>();
  for (const candidate of candidates) {
    const current = bestBySession.get(candidate.sessionId);
    if (!current || compareVersions(candidate, current, questionList) > 0) bestBySession.set(candidate.sessionId, candidate);
  }

  const sessions = [...bestBySession.values()];
  const hasProgress = sessions.some((session) => answeredQuestionCount(session, questionList) > 0);
  const eligible = hasProgress
    ? sessions.filter((session) => answeredQuestionCount(session, questionList) > 0 || Boolean(session.restartOf))
    : sessions;

  return eligible.reduce((best, candidate) => {
    const createdDifference = timestamp(candidate.createdAt) - timestamp(best.createdAt);
    if (createdDifference) return createdDifference > 0 ? candidate : best;
    const updatedDifference = timestamp(candidate.updatedAt) - timestamp(best.updatedAt);
    if (updatedDifference) return updatedDifference > 0 ? candidate : best;
    return compareVersions(candidate, best, questionList) > 0 ? candidate : best;
  });
};

export const hydrateRestorableSession = async (
  localValue: unknown,
  loadRemote: () => Promise<Array<{ data: unknown; id?: string }>>,
  questionList: Question[],
  createNew: () => AssessmentSession,
) => {
  const remoteValues = await loadRemote();
  return chooseRestorableSession(localValue, remoteValues, questionList) ?? createNew();
};

export const touchAssessmentSession = (session: AssessmentSession, now = new Date()): AssessmentSession => ({
  ...session,
  updatedAt: now.toISOString(),
});
