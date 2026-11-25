import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Loading, Tag } from 'tdesign-react';
import { fetchRecord, replayRecord, resolveReplayMode } from '../api/commission';
import type { CommissionRecord, ReplayResult } from '../types';
import SummarySection from '../components/SummarySection';
import InputSection from '../components/InputSection';
import RuleSection from '../components/RuleSection';
import StepSection from '../components/StepSection';
import RelationSection from '../components/RelationSection';

const TYPE_LABEL: Record<CommissionRecord['type'], string> = {
  accrual: '计提',
  clawback: '扣回',
  adjustment: '调整',
};

export default function CommissionRecordDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const replayMode = useMemo(() => resolveReplayMode(location.search), [location.search]);

  const [record, setRecord] = useState<CommissionRecord | undefined>();
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<ReplayResult | undefined>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setReplayResult(undefined);
    fetchRecord(id)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onReplay = useCallback(async () => {
    if (!record) return;
    setReplaying(true);
    try {
      const result = await replayRecord(record, replayMode);
      setReplayResult(result);
    } finally {
      setReplaying(false);
    }
  }, [record, replayMode]);

  if (loading) {
    return (
      <div className="page page--loading">
        <Loading loading text="加载记录中" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page page--loading">
        <Alert theme="error" title="记录不存在" message={'未找到编号为 ' + id + ' 的提成记录。'} />
        <Button variant="outline" onClick={() => navigate('/commission/records/1')}>
          返回计提记录
        </Button>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="面包屑">
        <a href="/commission/records/1">工作台</a>
        <span className="breadcrumb__sep">/</span>
        <span>提成记录</span>
        <span className="breadcrumb__sep">/</span>
        <span className="breadcrumb__current">{record.code}</span>
      </nav>

      <header className="page-head">
        <div>
          <h1 className="page-head__title">
            提成计算过程详情
            <Tag
              theme={record.type === 'clawback' ? 'danger' : 'primary'}
              variant="light"
              className="page-head__type"
            >
              {TYPE_LABEL[record.type]}
            </Tag>
          </h1>
          <p className="page-head__meta">
            记录编号 {record.code} · 所属月份 {record.month} · 数据来源：mock（S6-COMM-020 接口桩）
          </p>
        </div>
        <div className="page-head__actions">
          <span className="replay-mode" data-testid="replay-mode">
            重放模式：{replayMode === 'diff' ? '有差异（?replay=diff）' : '一致（默认）'}
          </span>
          <Button
            theme="primary"
            loading={replaying}
            onClick={onReplay}
            data-testid="replay-button"
          >
            重放校验
          </Button>
        </div>
      </header>

      {replayResult && (
        <div className="replay-result" data-testid="replay-result">
          {replayResult.consistent ? (
            <Alert
              theme="success"
              title="重放校验：一致"
              message={
                '按规则 ' +
                replayResult.ruleVersion +
                ' 重放，逐步比对的 ' +
                replayResult.comparedSteps +
                ' 个计算步骤输出与落库值完全一致。校验时间 ' +
                replayResult.checkedAt +
                '。'
              }
            />
          ) : (
            <Alert
              theme="warning"
              title="重放校验：发现差异"
              message={
                '规则版本 ' +
                replayResult.ruleVersion +
                '，在第 ' +
                (replayResult.firstDiff?.no ?? 0) +
                ' 步「' +
                (replayResult.firstDiff?.title ?? '') +
                '」发现第一处差异：落库值 ' +
                (replayResult.firstDiff?.recorded ?? '') +
                '，重放值 ' +
                (replayResult.firstDiff?.replayed ?? '') +
                '。请核对规则快照是否被当日生效版本覆盖。'
              }
            />
          )}
        </div>
      )}

      <div className={'record-layout' + (replayResult && !replayResult.consistent ? ' record-layout--diff' : '')}>
        <SummarySection record={record} />
        <InputSection record={record} />
        <RuleSection record={record} />
        <StepSection
          record={record}
          diffStepNo={replayResult && !replayResult.consistent ? replayResult.firstDiff?.no : undefined}
        />
        <RelationSection record={record} />
      </div>
    </div>
  );
}
