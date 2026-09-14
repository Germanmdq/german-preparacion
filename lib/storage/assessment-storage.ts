import type { ScoreMap, Answers } from '@/lib/assessment/scoring';
import type { PatternKey } from '@/data/questions';

export type AudioPlayEvent = { questionId: string; optionId: string; playedAt: string; order: number };
export type AssessmentSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  answers: Answers;
  audioPlayEvents: AudioPlayEvent[];
  scores: ScoreMap | null;
  primaryPattern: PatternKey | null;
  secondaryPattern: PatternKey | null;
  resultVersion: string;
};

export interface AssessmentStorage {
  load(): AssessmentSession | null;
  save(session: AssessmentSession): void;
  clear(): void;
}

export const ASSESSMENT_STORAGE_KEY = 'german-preparacion:assessment:v2';

export const createSession = (now = new Date()): AssessmentSession => {
  const timestamp = now.toISOString();
  return {
    sessionId: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    answers: {},
    audioPlayEvents: [],
    scores: null,
    primaryPattern: null,
    secondaryPattern: null,
    resultVersion: 'provisional-v1',
  };
};

export const assessmentStorage: AssessmentStorage = {
  load: () => {
    try {
      const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
      return raw ? JSON.parse(raw) as AssessmentSession : null;
    } catch {
      return null;
    }
  },
  save: (session) => {
    try {
      localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // The evaluation still works for the current tab if storage is unavailable.
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    } catch {
      // Starting over can still continue in memory if storage is unavailable.
    }
  },
};
