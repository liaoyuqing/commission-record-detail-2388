import type { CommissionRecord } from '../types';
import { formatMoney } from '../lib/money';
import SectionCard from './SectionCard';

export default function InputSection({ record }: { record: CommissionRecord }) {
  const exclusionTotal = record.payment.exclusions.reduce((sum, item) => sum + item.cents, 0);
  return (
    <SectionCard index="②" title="输入">
      <h3 className="sub-title">回款信息</h3>
      <table className="kv-table">
        <tbody>
          <tr>
            <th>期次</th>
            <td>{record.payment.installment}</td>
            <th>到账日</th>
            <td>{record.payment.settledOn}</td>
          </tr>
          <tr>
            <th>实收金额</th>
            <td data-testid="received-amount">{formatMoney(record.payment.receivedCents)}</td>
            <th>排除款项合计</th>
            <td data-testid="exclusion-total">{formatMoney(exclusionTotal)}</td>
          </tr>
        </tbody>
      </table>
      <h4 className="sub-title sub-title--minor">排除款项明细</h4>
      <ul className="exclusion-list">
        {record.payment.exclusions.map((item) => (
          <li key={item.name}>
            <span>{item.name}</span>
            <span className="amount">{formatMoney(item.cents)}</span>
          </li>
        ))}
        {record.payment.exclusions.length === 0 && <li className="muted">本期无排除款项</li>}
      </ul>

      <h3 className="sub-title">合同信息</h3>
      <table className="kv-table">
        <tbody>
          <tr>
            <th>合同编号</th>
            <td>{record.contract.code}</td>
            <th>签约日</th>
            <td>{record.contract.signedOn}</td>
          </tr>
          <tr>
            <th>交易类型</th>
            <td>{record.contract.dealType}</td>
            <th>会籍档位</th>
            <td>{record.contract.membershipTier}</td>
          </tr>
          <tr>
            <th>空间类型</th>
            <td>{record.contract.spaceType}</td>
            <th>租期</th>
            <td>{record.contract.leaseTerm}</td>
          </tr>
          <tr>
            <th>折扣率</th>
            <td>{record.contract.discountRate}</td>
            <th>线索来源</th>
            <td>{record.contract.leadSource}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="sub-title">累计口径</h3>
      <table className="kv-table">
        <tbody>
          <tr>
            <th>当月此前累计</th>
            <td data-testid="month-to-date">{formatMoney(record.monthToDateAccruedCents)}</td>
            <th>合同已计提</th>
            <td data-testid="contract-accrued">{formatMoney(record.contractAccruedCents)}</td>
          </tr>
        </tbody>
      </table>
    </SectionCard>
  );
}
