import { resultCopy } from '@/data/results';
import type { Question } from '@/data/questions';
import { scoreAssessment, type Answers } from './scoring';
export function buildResult(questions:Question[],answers:Answers){ const scored=scoreAssessment(questions,answers); const strongest=scored.contributions.filter(c=>c.pattern===scored.primaryPattern).slice(0,2); return {...scored,copy:resultCopy[scored.primaryPattern],evidence:strongest.map(c=>c.optionText)}; }
