// Bundled Electron entries share one process-local invalidation bus. No source data is retained.
const key=Symbol.for('sneak-peek.source-change.v1');
const root=globalThis as typeof globalThis & {[key]?:{epoch:number;listeners:Set<()=>void>}};
const state=root[key] ??= {epoch:0,listeners:new Set()};
export const sourceChangeEpoch=()=>state.epoch;
export function onSourceChange(listener:()=>void){state.listeners.add(listener);return()=>{state.listeners.delete(listener);};}
export function noteSourceChange():void{state.epoch++;for(const listener of [...state.listeners])listener();}
