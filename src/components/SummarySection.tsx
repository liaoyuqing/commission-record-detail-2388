import { Tag } from 'tdesign-react';
import type { CommissionRecord, RecordStatus, RecordType } from '../types';
import { formatMoney, isNegative } from '../lib/money';
import SectionCard from './SectionCard';

const TYPE_LABEL: Record<RecordType, string> = {
  accrual: '计提',
  clawback: '扣回',
  adjustment: '调整',
};

const STATUS_LABEL: Record<RecordStatus, string> = {
  confirmed: '已确认',
  pending_review: '待复核',
  reversed: '已冲销',
};

const STATUS_THEME: Record<RecordStatus, 'success' | 'warning' | 'danger'> = {
  confirmed: 'success',
  pending_review: 'warning',
  reversed: 'danger',
};

export default function SummarySection({ record }: { record: CommissionRecord }) {
  const negative = isNegative(record.amountCents);
  return (
    <SectionCard index="①" title="概要">
      <dl className="summary-grid">
        <div className="summary-item">
          <dt>业务员</dt>
          <dd>
            {record.salesperson.name}
            <span className="muted">（{record.salesperson.employeeNo}）</span>
          </dd>
        </div>
        <div className="summary-item">
          <dt>角色</dt>
          <dd>{record.salesperson.role}</dd>
        </div>
        <div className="summary-item">
          <dt>金额</dt>
          <dd
            className={negative ? 'amount amount--negative' : 'amount'}
            data-testid="summary-amount"
          >
            {formatMoney(record.amountCents)}
          </dd>
        </div>
        <div className="summary-item">
          <dt>类型</dt>
          <dd>
            <Tag
              theme={record.type === 'clawback' ? 'danger' : 'primary'}
              variant="light-outline"
            >
              {TYPE_LABEL[record.type]}
            </Tag>
          </dd>
        </div>
        <div className="summary-item">
          <dt>状态</dt>
          <dd>
            <Tag theme={STATUS_THEME[record.status]} variant="light">
              {STATUS_LABEL[record.status]}
            </Tag>
          </dd>
        </div>
        <div className="summary-item">
          <dt>所属月份</dt>
          <dd>{record.month}</dd>
        </div>
      </dl>
    </SectionCard>
  );
}
