import type { ScoreMap, Answers } from '@/lib/assessment/scoring';
import type { PatternKey } from '@/data/questions';
export type AudioPlayEvent={questionId:string;optionId:string;playedAt:string;order:number};
export type AssessmentSession={sessionId:string;createdAt:string;completedAt:string|null;answers:Answers;audioPlayEvents:AudioPlayEvent[];scores:ScoreMap|null;primaryPattern:PatternKey|null;secondaryPattern:PatternKey|null;resultVersion:string};
export interface AssessmentStorage {
 load(): AssessmentSession | null;
 save(session: AssessmentSession): void;
 clear(): void;
}
const KEY='german-preparacion:assessment:v1';
export const createSession=():AssessmentSession=>({sessionId:crypto.randomUUID(),createdAt:new Date().toISOString(),completedAt:null,answers:{},audioPlayEvents:[],scores:null,primaryPattern:null,secondaryPattern:null,resultVersion:'provisional-v1'});
export const assessmentStorage: AssessmentStorage={load:():AssessmentSession|null=>{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null}catch{return null}},save:(session:AssessmentSession)=>localStorage.setItem(KEY,JSON.stringify(session)),clear:()=>localStorage.removeItem(KEY)};
