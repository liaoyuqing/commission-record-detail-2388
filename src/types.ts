export type RecordType = 'accrual' | 'clawback' | 'adjustment';

export type RecordStatus = 'confirmed' | 'pending_review' | 'reversed';

export type StepHighlight = 'none' | 'rounding' | 'tail' | 'final';

export interface StepInput {
  label: string;
  value: string;
}

export interface CalcStep {
  no: number;
  title: string;
  formula: string;
  inputs: StepInput[];
  output: string;
  note?: string;
  highlight: StepHighlight;
}

export interface RuleCondition {
  field: string;
  operator: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface RuleRow {
  code: string;
  name: string;
  rateBps: number;
  hit: boolean;
  missReason?: string;
  conditions: RuleCondition[];
}

export interface RuleVersion {
  version: string;
  effectiveFrom: string;
  effectiveTo: string;
  publishedBy: string;
  publishedAt: string;
  rows: RuleRow[];
}

export interface PaymentInfo {
  installment: string;
  settledOn: string;
  receivedCents: number;
  exclusions: Array<{ name: string; cents: number }>;
}

export interface ContractInfo {
  code: string;
  signedOn: string;
  dealType: string;
  membershipTier: string;
  spaceType: string;
  leaseTerm: string;
  discountRate: string;
  leadSource: string;
}

export interface RecordChainNode {
  code: string;
  type: RecordType;
  amountCents: number;
  status: string;
  happenedAt: string;
  relation: string;
  recordId?: string;
}

export interface ApprovalNode {
  role: string;
  operator: string;
  decidedAt: string;
  decision: string;
  comment: string;
}

export interface CommissionRecord {
  id: string;
  code: string;
  type: RecordType;
  status: RecordStatus;
  salesperson: { name: string; employeeNo: string; role: string; team: string };
  amountCents: number;
  month: string;
  monthToDateAccruedCents: number;
  contractAccruedCents: number;
  payment: PaymentInfo;
  contract: ContractInfo;
  rule: RuleVersion;
  params: LedgerParams;
  steps: CalcStep[];
  relations: {
    replacedChain: RecordChainNode[];
    originalAccrual?: RecordChainNode;
    approvalChain: ApprovalNode[];
  };
}

export interface LedgerParams {
  baseCents: number;
  rateBps: number;
  shareBp: number;
}

export interface FirstDiff {
  no: number;
  title: string;
  recorded: string;
  replayed: string;
}

export interface ReplayResult {
  consistent: boolean;
  checkedAt: string;
  comparedSteps: number;
  ruleVersion: string;
  firstDiff?: FirstDiff;
}
