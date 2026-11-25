import type { CommissionRecord, ReplayResult } from '../types';
import { findRecord, records } from '../mock/records';
import { replay } from '../lib/calc';

/** 模拟真实接口的往返延迟，便于观察按钮 loading 态。 */
const LATENCY_MS = 320;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

/**
 * 对接点（S6-COMM-020 依赖的上游接口，当前全部为 mock）：
 *   GET /api/v1/commission/records/{id}        单笔提成计算记录详情
 *   GET /api/v1/commission/rules/{version}     规则版本快照（含命中行与未命中原因）
 *   POST /api/v1/commission/records/{id}/replay 重放校验
 * 真实接入时把下面三个函数体替换为 fetch 调用即可，页面组件不感知数据来源。
 */
export async function fetchRecord(id: string): Promise<CommissionRecord | undefined> {
  return delay(findRecord(id));
}

export async function fetchRecordList(): Promise<CommissionRecord[]> {
  return delay(records);
}

export type ReplayMode = 'consistent' | 'diff';

/** 从 URL 读取重放模式开关：?replay=diff 走「有差异」返回，其余走「一致」。 */
export function resolveReplayMode(search: string): ReplayMode {
  const params = new URLSearchParams(search);
  return params.get('replay') === 'diff' ? 'diff' : 'consistent';
}

/**
 * 重放校验接口。
 * consistent：按记录落库时的规则快照重放，逐步比对全部一致。
 * diff：模拟「规则快照被当日生效版本覆盖」的线上故障，重放出第一处差异步骤。
 */
export async function replayRecord(
  record: CommissionRecord,
  mode: ReplayMode,
): Promise<ReplayResult> {
  if (mode === 'diff') {
    const stale = {
      ...record.rule,
      version: 'R-2026.10-v3',
      effectiveFrom: '2026-10-01',
      effectiveTo: '2027-03-31',
      rows: record.rule.rows.map((row, index) =>
        index === 0 ? { ...row, rateBps: 838 } : row,
      ),
    };
    return delay(replay(record, stale));
  }
  return delay(replay(record));
}
