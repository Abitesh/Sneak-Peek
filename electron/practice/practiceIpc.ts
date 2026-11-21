import { reviewMeeting } from './MeetingReview';
import { DatabaseManager } from '../db/DatabaseManager';
import { getProjectKnowledgeManager } from '../projects/ProjectKnowledgeManager';
import { PracticeService } from './PracticeService';
export function registerPracticeIpc(register:(channel:string,handler:(event:any,...args:any[])=>any)=>void){
 const service=()=>new PracticeService(DatabaseManager.getInstance().getDb()!,getProjectKnowledgeManager());
 const handle=(fn:(...args:any[])=>any)=>async (_event:any,...args:any[])=>{try{return {success:true,value:await fn(...args)};}catch(e){return {success:false,error:e instanceof Error?e.message:'Practice operation failed.'};}};
 register('practice:list',handle(()=>service().list()));
 register('practice:create',handle((category:string,projectIds:string[])=>service().create(category,projectIds)));
 register('practice:answer',handle((id:string,question:string,answer:string,feedback?:string)=>service().answer(id,question,answer,feedback)));
 register('practice:review',handle((id:string)=>service().review(id)));
 register('practice:delete',handle((id:string)=>service().remove(id)));
 register('practice:meetings',handle(()=>DatabaseManager.getInstance().getRecentMeetings(100).map(m=>({id:m.id,title:m.title,date:m.date}))));
 register('practice:meeting-review',handle((id:string)=>{
  const meeting=DatabaseManager.getInstance().getMeetingDetails(id);if(!meeting)throw new Error('Meeting not found.');
  return reviewMeeting(meeting);
 }));
}
