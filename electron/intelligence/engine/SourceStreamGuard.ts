import { onSourceChange } from '../../personalKnowledge/SourceChangeEpoch';
/** One stream, with immediate revocation/STOP rejection even if a provider is parked. */
export async function* guardSourceStream(stream:AsyncGenerator<string,void,unknown>,verify:()=>void,
 options:{signal?:AbortSignal;abort?:()=>void}={}):AsyncGenerator<string,void,unknown>{
 let failure:Error|undefined;
 let invalidate!:(error:Error)=>void;
 const invalidated=new Promise<{error:Error}>(resolve=>{invalidate=error=>{failure=error;resolve({error});};});
 const check=()=>{try{verify();}catch(error){invalidate(error instanceof Error?error:new Error('Source changed.'));options.abort?.();}};
 const off=onSourceChange(check);
 const stop=()=>invalidate(new Error('Request cancelled.'));
 options.signal?.addEventListener('abort',stop,{once:true});
 try{
  verify();if(options.signal?.aborted)return;
  while(true){
   const next=await Promise.race([stream.next(),invalidated]);
   if(failure)throw failure;
   if('error' in next)throw next.error;
   if(next.done)break;
   yield next.value;
  }
  verify();
 }finally{off();options.signal?.removeEventListener('abort',stop);void stream.return(undefined).catch(()=>{});}
}
