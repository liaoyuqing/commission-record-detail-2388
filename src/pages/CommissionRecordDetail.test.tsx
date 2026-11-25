import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CommissionRecordDetail from './CommissionRecordDetail';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/commission/records/:id" element={<CommissionRecordDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('提成记录详情页', () => {
  it('路由 /commission/records/1 渲染计提记录概要', async () => {
    renderAt('/commission/records/1');
    expect(await screen.findByText('提成计算过程详情')).toBeInTheDocument();
    const amount = await screen.findByTestId('summary-amount');
    expect(amount).toHaveTextContent('¥5,703.26');
    expect(amount.className).not.toContain('amount--negative');
  });

  it('扣回记录金额显示为红色负数', async () => {
    renderAt('/commission/records/2');
    const amount = await screen.findByTestId('summary-amount');
    expect(amount).toHaveTextContent('-¥5,703.26');
    expect(amount.className).toContain('amount--negative');
    expect(within(await screen.findByLabelText('概要')).getByText('扣回')).toBeInTheDocument();
  });

  it('调整记录展示审批链三级节点', async () => {
    renderAt('/commission/records/3');
    const chain = await screen.findByTestId('approval-chain');
    expect(within(chain).getAllByText(/审批通过|复核通过|提交调整申请/)).toHaveLength(3);
  });

  it('取整与尾差步骤带高亮标记', async () => {
    renderAt('/commission/records/1');
    const rounding = await screen.findByTestId('step-3');
    expect(rounding.getAttribute('data-highlight')).toBe('rounding');
    const tail = screen.getByTestId('step-7');
    expect(tail.getAttribute('data-highlight')).toBe('tail');
    expect(screen.getByTestId('step-1').getAttribute('data-highlight')).toBe('none');
  });

  it('未命中规则行给出原因', async () => {
    renderAt('/commission/records/1');
    const reasons = await screen.findAllByTestId('miss-reason');
    expect(reasons.length).toBeGreaterThanOrEqual(1);
  });

  it('点击重放校验在默认模式下显示一致', async () => {
    const user = userEvent.setup();
    renderAt('/commission/records/1');
    await user.click(await screen.findByTestId('replay-button'));
    const panel = await screen.findByTestId('replay-result');
    await waitFor(() => expect(panel).toHaveTextContent('一致'));
  });

  it('?replay=diff 模式下显示第一处差异步骤', async () => {
    const user = userEvent.setup();
    renderAt('/commission/records/1?replay=diff');
    expect(await screen.findByTestId('replay-mode')).toHaveTextContent('有差异');
    await user.click(await screen.findByTestId('replay-button'));
    const panel = await screen.findByTestId('replay-result');
    await waitFor(() => expect(panel).toHaveTextContent('发现差异'));
    expect(panel).toHaveTextContent('第 2 步');
    expect(panel).toHaveTextContent('计算提成总额（未取整）');
  });
});
