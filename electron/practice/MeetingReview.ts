import type { Meeting } from '../db/DatabaseManager';
const isQuestion=(text:string)=>/\?|^(?:what|why|how|when|where|which|explain|describe|tell me|please elaborate)\b/i.test(text.trim());
const normalized=(text:string)=>text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
/** Deterministic observations from one exact saved meeting; no generation. */
export function reviewMeeting(meeting:Meeting){
 const transcript=meeting.transcript ?? [];
 const questions=transcript.flatMap((turn,index)=>{
  if(!['user','interviewer'].includes(turn.speaker)||!isQuestion(turn.text))return [];
  const following=transcript.slice(index+1).find(next=>next.speaker==='assistant'||(['user','interviewer'].includes(next.speaker)&&isQuestion(next.text)));
  const recorded=meeting.usage?.filter(item=>item.question&&normalized(item.question)===normalized(turn.text)&&item.answer?.trim())??[];
  // A repeated question with multiple generated answers has no safe unique
  // association without matching request IDs. Leave it explicitly unpaired.
  const uniqueUsage=recorded.length===1?recorded[0].answer:undefined;
  return [{speaker:turn.speaker,question:turn.text,timestamp:turn.timestamp,recordedAnswer:following?.speaker==='assistant'?following.text:uniqueUsage}];
 });
 const summary=meeting.detailedSummary?.overview?.trim()||meeting.summary?.trim()||'';
 return {id:meeting.id,title:meeting.title,questions,summary,summaryAvailable:Boolean(summary),topics:meeting.detailedSummary?.topics??[],
  recordedAnswerCount:questions.filter(q=>q.recordedAnswer).length,
  suggestions:questions.some(q=>!q.recordedAnswer)?['Practice the listed questions with no saved generated answer; this does not establish what you said aloud.']:[],
  note:'Transcript and saved-generation observations only. A missing generated answer is not proof that the interviewer received no answer. Saved summaries and topics are AI-generated; verify them against the transcript.'};
}
