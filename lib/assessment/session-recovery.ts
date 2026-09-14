import { patternKeys, type PatternKey, type Question } from '@/data/questions';
import type { Answers, ScoreMap } from './scoring';
import type { AssessmentSession, AudioPlayEvent } from '@/lib/storage/assessment-storage';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isPattern = (value: unknown): value is PatternKey => typeof value === 'string' && patternKeys.includes(value as PatternKey);

const toIso = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
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

export const normalizeAssessmentSession = (value: unknown): AssessmentSession | null => {
  if (!isRecord(value) || typeof value.sessionId !== 'string' || !value.sessionId) return null;
  const createdAt = toIso(value.createdAt);
  if (!createdAt) return null;
  const completedAt = value.completedAt == null ? null : toIso(value.completedAt);
  return {
    sessionId: value.sessionId,
    createdAt,
    updatedAt: toIso(value.updatedAt) ?? completedAt ?? createdAt,
    completedAt,
    answers: readAnswers(value.answers),
    audioPlayEvents: readAudioPlayEvents(value.audioPlayEvents),
    scores: readScores(value.scores),
    primaryPattern: isPattern(value.primaryPattern) ? value.primaryPattern : null,
    secondaryPattern: isPattern(value.secondaryPattern) ? value.secondaryPattern : null,
    resultVersion: typeof value.resultVersion === 'string' ? value.resultVersion : 'provisional-v1',
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

export const touchAssessmentSession = (session: AssessmentSession, now = new Date()): AssessmentSession => ({
  ...session,
  updatedAt: now.toISOString(),
});
