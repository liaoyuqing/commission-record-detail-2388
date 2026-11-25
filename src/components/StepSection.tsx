import { Tag, Timeline } from 'tdesign-react';
import type { CalcStep, CommissionRecord } from '../types';
import SectionCard from './SectionCard';

function dotColor(step: CalcStep): string {
  if (step.highlight === 'rounding') return 'warning';
  if (step.highlight === 'tail') return 'error';
  if (step.highlight === 'final') return 'success';
  return 'primary';
}

function StepBody({ step, isDiff }: { step: CalcStep; isDiff: boolean }) {
  const base =
    step.highlight === 'rounding'
      ? 'calc-step calc-step--rounding'
      : step.highlight === 'tail'
        ? 'calc-step calc-step--tail'
        : step.highlight === 'final'
          ? 'calc-step calc-step--final'
          : 'calc-step';
  const highlightClass = isDiff ? base + ' calc-step--diff' : base;

  return (
    <div className={highlightClass} data-highlight={step.highlight} data-diff={isDiff ? 'true' : 'false'} data-testid={'step-' + step.no}>
      <div className="calc-step__head">
        <span className="calc-step__no">第 {step.no} 步</span>
        <span className="calc-step__title">{step.title}</span>
        {step.highlight === 'rounding' && (
          <Tag theme="warning" variant="dark" className="calc-step__badge">
            取整
          </Tag>
        )}
        {step.highlight === 'tail' && (
          <Tag theme="danger" variant="dark" className="calc-step__badge">
            尾差
          </Tag>
        )}
        {isDiff && (
          <Tag theme="danger" variant="dark" className="calc-step__diff-badge">
            重放差异
          </Tag>
        )}
      </div>
      <code className="calc-step__formula">{step.formula}</code>
      <dl className="calc-step__io">
        {step.inputs.map((input) => (
          <div key={input.label}>
            <dt>{input.label}</dt>
            <dd>{input.value}</dd>
          </div>
        ))}
        <div className="calc-step__output">
          <dt>输出</dt>
          <dd data-testid={'step-output-' + step.no}>{step.output}</dd>
        </div>
      </dl>
      {step.note && <p className="calc-step__note">{step.note}</p>}
    </div>
  );
}

interface StepSectionProps {
  record: CommissionRecord;
  diffStepNo?: number;
}

export default function StepSection({ record, diffStepNo }: StepSectionProps) {
  const highlighted = record.steps.filter(
    (step) => step.highlight === 'rounding' || step.highlight === 'tail',
  );
  return (
    <SectionCard
      index="④"
      title="计算步骤"
      extra={<span className="muted">共 {record.steps.length} 步</span>}
    >
      <p className="step-hint">
        共 <strong>{highlighted.length}</strong> 个取整 / 尾差步骤以底色与标签单独高亮，
        请重点核对：{highlighted.map((step) => '第 ' + step.no + ' 步「' + step.title + '」').join('、')}
      </p>
      <Timeline mode="same" labelAlign="left" className="calc-timeline">
        {record.steps.map((step) => (
          <Timeline.Item key={step.no} dotColor={step.no === diffStepNo ? 'error' : dotColor(step)}>
            <StepBody step={step} isDiff={step.no === diffStepNo} />
          </Timeline.Item>
        ))}
      </Timeline>
    </SectionCard>
  );
}
