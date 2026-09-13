import { patternKeys, type PatternKey, type Question } from '@/data/questions';
export type Answers = Record<string,string>;
export type ScoreMap = Record<PatternKey,number>;
export type Contribution = { questionId:string; optionId:string; pattern:PatternKey; weight:number; optionText:string };
export function scoreAssessment(questions:Question[], answers:Answers){
 const scores = Object.fromEntries(patternKeys.map(k=>[k,0])) as ScoreMap;
 const contributions:Contribution[]=[];
 for(const question of questions){ const option=question.options.find(o=>o.id===answers[question.id]); if(!option) continue; for(const [pattern,weight] of Object.entries(option.scores) as [PatternKey,number][]) { scores[pattern]+=weight; if(weight>0) contributions.push({questionId:question.id,optionId:option.id,pattern,weight,optionText:option.text}); } }
 const ranked=[...patternKeys].sort((a,b)=>scores[b]-scores[a] || patternKeys.indexOf(a)-patternKeys.indexOf(b));
 return {scores,primaryPattern:ranked[0],secondaryPattern:ranked[1],contributions:contributions.sort((a,b)=>b.weight-a.weight)};
}
