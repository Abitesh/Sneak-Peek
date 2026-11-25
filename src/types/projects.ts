export interface ProjectRecord {
 id: string; indexState?:string; name: string; aliases: string[]; repositoryUrl: string; description: string;
 stack: string; contribution: string; readme: string; enabled: boolean; revision: number;
 images?:Array<{id:string;name:string}>; updatedAt: string; knowledge?: { [key:string]:unknown }; sources: Array<{id:string;name:string;kind:string;status:string;owned:boolean}>;
}
export interface ProjectInput { id?:string; name:string; aliases?:string[]; repositoryUrl?:string;
 refreshRepository?:boolean; uploadTokens?:string[]; description?:string; stack?:string; contribution?:string; readme?:string; enabled?:boolean }
