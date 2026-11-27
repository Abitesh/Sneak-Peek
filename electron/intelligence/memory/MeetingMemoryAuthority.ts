import { createHash } from 'crypto';
import type { RecalledMemory, RetainItem } from './MemoryProvider';

export interface MemorySourcePolicy {
  prepareRetain(item: RetainItem): RetainItem | undefined;
  allowRecall(memory: RecalledMemory): boolean;
}
interface MeetingSource {
  summary_json: string;
  summary_status?: string;
  start_time: number;
}
const PREFIX = 'sneak-peek:meeting:';
export const meetingMemoryDocumentId = (id: string): string => PREFIX + encodeURIComponent(id);
export const memorySourceRevision = (summary: string): string => createHash('sha256').update(summary).digest('hex');

/** Current local source existence/revision/retention, not remote fact confidence,
 * authorizes a remembered meeting. Old untraceable memories fail closed. */
export function meetingMemorySourcePolicy(
  read: (id: string) => MeetingSource | undefined,
  retention: () => 'forever' | '7d' | '30d' | 'never',
  now: () => number = Date.now,
): MemorySourcePolicy {
  const current = (id: string): MeetingSource | undefined => {
    const policy = retention();
    if (policy === 'never') return undefined;
    const row = read(id);
    if (!row || row.summary_status !== 'completed') return undefined;
    if (policy !== 'forever') {
      const days = policy === '7d' ? 7 : 30;
      if (!Number.isFinite(row.start_time) || row.start_time < now() - days * 86400000) return undefined;
    }
    return row;
  };
  return {
    prepareRetain(item) {
      if (item.source !== 'meeting_summary' || !item.scope.meetingId) return undefined;
      const row = current(item.scope.meetingId);
      if (!row) return undefined;
      return { ...item, documentId: meetingMemoryDocumentId(item.scope.meetingId),
        metadata: { source_revision: memorySourceRevision(row.summary_json) },
        timestamp: row.start_time };
    },
    allowRecall(memory) {
      if (!memory.documentId?.startsWith(PREFIX) || !memory.sourceRevision) return false;
      try {
        const id = decodeURIComponent(memory.documentId.slice(PREFIX.length));
        const row = current(id);
        return Boolean(row && memory.sourceRevision === memorySourceRevision(row.summary_json));
      } catch { return false; }
    },
  };
}

/** Lazily access the existing app database; no second store or hidden enrollment. */
export function currentMeetingMemoryPolicy(): MemorySourcePolicy {
  return meetingMemorySourcePolicy(id => {
    const { DatabaseManager } = require('../../db/DatabaseManager') as typeof import('../../db/DatabaseManager');
    return DatabaseManager.getInstance().getDb()?.prepare(
      'SELECT summary_json, summary_status, start_time FROM meetings WHERE id = ?',
    ).get(id) as MeetingSource | undefined;
  }, () => {
    const { SettingsManager } = require('../../services/SettingsManager') as typeof import('../../services/SettingsManager');
    return SettingsManager.getInstance().get('meetingRetention') ?? 'forever';
  });
}
