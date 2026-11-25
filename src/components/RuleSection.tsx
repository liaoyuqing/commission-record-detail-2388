import { Collapse, Tag } from 'tdesign-react';
import type { CommissionRecord } from '../types';
import { formatBps } from '../lib/money';
import SectionCard from './SectionCard';

export default function RuleSection({ record }: { record: CommissionRecord }) {
  const hitRows = record.rule.rows.filter((row) => row.hit);
  const missRows = record.rule.rows.filter((row) => !row.hit);
  return (
    <SectionCard
      index="③"
      title="规则"
      extra={<span className="muted">规则版本 {record.rule.version}</span>}
    >
      <table className="kv-table">
        <tbody>
          <tr>
            <th>版本号</th>
            <td data-testid="rule-version">{record.rule.version}</td>
            <th>生效区间</th>
            <td>
              {record.rule.effectiveFrom} 至 {record.rule.effectiveTo}
            </td>
          </tr>
          <tr>
            <th>发布人</th>
            <td>{record.rule.publishedBy}</td>
            <th>发布时间</th>
            <td>{record.rule.publishedAt}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="sub-title">命中规则行</h3>
      {hitRows.map((row) => (
        <div className="rule-hit" key={row.code} data-testid="rule-hit-row">
          <div className="rule-hit__head">
            <Tag theme="success" variant="light">
              命中
            </Tag>
            <span className="rule-hit__code">{row.code}</span>
            <span className="rule-hit__name">{row.name}</span>
            <span className="rule-hit__rate">{formatBps(row.rateBps)}</span>
          </div>
          <Collapse
            className="rule-hit__collapse"
            expandIconPlacement="right"
            borderless
          >
            <Collapse.Panel
              value={'cond-' + row.code}
              header={'查看全部条件（' + row.conditions.length + ' 条）'}
            >
              <ul className="condition-list">
                {row.conditions.map((cond) => (
                  <li key={cond.field}>
                    <span className="condition-list__field">{cond.field}</span>
                    <span className="condition-list__op">{cond.operator}</span>
                    <span className="condition-list__expect">{cond.expected}</span>
                    <span className="condition-list__actual">实际：{cond.actual}</span>
                  </li>
                ))}
              </ul>
            </Collapse.Panel>
          </Collapse>
        </div>
      ))}

      <h3 className="sub-title">未命中规则行</h3>
      <Collapse className="rule-miss" borderless>
        <Collapse.Panel
          value="miss-rows"
          header={'未命中 ' + missRows.length + ' 行，展开查看原因'}
        >
          <ul className="miss-list">
            {missRows.map((row) => (
              <li key={row.code}>
                <div className="miss-list__head">
                  <span className="rule-hit__code">{row.code}</span>
                  <span className="rule-hit__name">{row.name}</span>
                  <span className="rule-hit__rate">{formatBps(row.rateBps)}</span>
                </div>
                <p className="miss-list__reason" data-testid="miss-reason">
                  {row.missReason}
                </p>
                <ul className="condition-list condition-list--compact">
                  {row.conditions.map((cond) => (
                    <li key={cond.field} className={cond.passed ? '' : 'is-failed'}>
                      <span className="condition-list__field">{cond.field}</span>
                      <span className="condition-list__op">{cond.operator}</span>
                      <span className="condition-list__expect">{cond.expected}</span>
                      <span className="condition-list__actual">实际：{cond.actual}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Collapse.Panel>
      </Collapse>
    </SectionCard>
  );
}
