import { Tag } from 'tdesign-react';
import type { CommissionRecord, RecordType } from '../types';
import { formatMoney } from '../lib/money';
import SectionCard from './SectionCard';

const TYPE_LABEL: Record<RecordType, string> = {
  accrual: '计提',
  clawback: '扣回',
  adjustment: '调整',
};

export default function RelationSection({ record }: { record: CommissionRecord }) {
  return (
    <SectionCard index="⑤" title="关联">
      <h3 className="sub-title">记录链</h3>
      <ul className="chain-list" data-testid="record-chain">
        {record.relations.replacedChain.map((node) => (
          <li key={node.code + node.relation} className="chain-list__item">
            <span className="chain-list__dot" aria-hidden="true" />
            <div className="chain-list__body">
              <div className="chain-list__head">
                <span className="chain-list__code">{node.code}</span>
                <Tag theme={node.type === 'clawback' ? 'danger' : 'primary'} variant="light">
                  {TYPE_LABEL[node.type]}
                </Tag>
                <span className="amount">{formatMoney(node.amountCents)}</span>
                <Tag variant="outline">{node.status}</Tag>
              </div>
              <p className="chain-list__meta">
                {node.happenedAt} · {node.relation}
                {node.recordId && (
                  <a className="chain-list__link" href={'/commission/records/' + node.recordId}>
                    查看该记录
                  </a>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {record.type === 'clawback' && record.relations.originalAccrual && (
        <>
          <h3 className="sub-title">对应的原计提记录</h3>
          <table className="kv-table">
            <tbody>
              <tr>
                <th>记录编号</th>
                <td>{record.relations.originalAccrual.code}</td>
                <th>原计提金额</th>
                <td className="amount">{formatMoney(record.relations.originalAccrual.amountCents)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {record.type === 'adjustment' && (
        <>
          <h3 className="sub-title">审批链</h3>
          <ol className="approval-list" data-testid="approval-chain">
            {record.relations.approvalChain.map((node) => (
              <li key={node.role} className="approval-list__item">
                <div className="approval-list__head">
                  <span className="approval-list__role">{node.role}</span>
                  <span className="approval-list__operator">{node.operator}</span>
                  <span className="muted">{node.decidedAt}</span>
                </div>
                <p className="approval-list__decision">{node.decision}</p>
                <p className="approval-list__comment">{node.comment}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </SectionCard>
  );
}
