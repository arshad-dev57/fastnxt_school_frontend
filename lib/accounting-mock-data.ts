/* ============================================================================
   FastNxt — Accounting module mock data (UI only, no backend)
   ---------------------------------------------------------------------------
   ⚠️  Every figure is clearly FICTIONAL demo data for the prototype.
       Grouped + typed so the pages can later be wired to real APIs without
       touching the UI components. Amounts are PKR (Rs.).
   ========================================================================== */

export type AccStatus = "Active" | "Inactive";
export type AccType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

/* --------------------------------------------------------- Chart of accounts */
export type LedgerAccount = { id: string; name: string; code: string; type: AccType; parent: string; status: AccStatus };

export const ACC_GROUPS: { key: AccType; label: string; color: string }[] = [
  { key: "Asset", label: "Assets", color: "var(--theme-primary)" },
  { key: "Liability", label: "Liabilities", color: "var(--theme-warning)" },
  { key: "Equity", label: "Equity / Fund", color: "var(--theme-accent)" },
  { key: "Income", label: "Income", color: "var(--theme-success)" },
  { key: "Expense", label: "Expenses", color: "var(--theme-danger)" },
];

export const ACCOUNTS: LedgerAccount[] = [
  { id: "A-1001", name: "Cash", code: "1001", type: "Asset", parent: "Current Assets", status: "Active" },
  { id: "A-1002", name: "Bank Account", code: "1002", type: "Asset", parent: "Current Assets", status: "Active" },
  { id: "A-1100", name: "Accounts Receivable", code: "1100", type: "Asset", parent: "Current Assets", status: "Active" },
  { id: "A-1200", name: "Fixed Assets", code: "1200", type: "Asset", parent: "Non-current Assets", status: "Active" },
  { id: "A-2001", name: "Accounts Payable", code: "2001", type: "Liability", parent: "Current Liabilities", status: "Active" },
  { id: "A-2002", name: "Salaries Payable", code: "2002", type: "Liability", parent: "Current Liabilities", status: "Active" },
  { id: "A-3001", name: "Opening Fund", code: "3001", type: "Equity", parent: "School Fund", status: "Active" },
  { id: "A-3002", name: "Retained Surplus", code: "3002", type: "Equity", parent: "School Fund", status: "Active" },
  { id: "A-4001", name: "Tuition Fees", code: "4001", type: "Income", parent: "Fee Income", status: "Active" },
  { id: "A-4002", name: "Admission Fees", code: "4002", type: "Income", parent: "Fee Income", status: "Active" },
  { id: "A-4003", name: "Transport Fees", code: "4003", type: "Income", parent: "Fee Income", status: "Active" },
  { id: "A-4004", name: "Other Income", code: "4004", type: "Income", parent: "Other Income", status: "Inactive" },
  { id: "A-5001", name: "Salaries", code: "5001", type: "Expense", parent: "Operating Expenses", status: "Active" },
  { id: "A-5002", name: "Rent", code: "5002", type: "Expense", parent: "Operating Expenses", status: "Active" },
  { id: "A-5003", name: "Utilities", code: "5003", type: "Expense", parent: "Operating Expenses", status: "Active" },
  { id: "A-5004", name: "Stationery", code: "5004", type: "Expense", parent: "Operating Expenses", status: "Active" },
  { id: "A-5005", name: "Maintenance", code: "5005", type: "Expense", parent: "Operating Expenses", status: "Active" },
];

/* ---------------------------------------------------------- Journal entries */
export type JournalStatus = "Draft" | "Posted" | "Cancelled";
export type JournalEntry = {
  id: string; no: string; date: string; description: string; reference: string;
  debit: number; credit: number; status: JournalStatus; by: string;
};

export const JOURNAL_ENTRIES: JournalEntry[] = [
  { id: "JE-0001", no: "JE-0001", date: "2026-10-01", description: "Monthly Rent", reference: "EXP-102", debit: 100000, credit: 100000, status: "Posted", by: "Maria Fernandes" },
  { id: "JE-0002", no: "JE-0002", date: "2026-10-02", description: "Fee Collection", reference: "FEE-231", debit: 250000, credit: 250000, status: "Posted", by: "Maria Fernandes" },
  { id: "JE-0003", no: "JE-0003", date: "2026-10-04", description: "Utility Bill — Electricity", reference: "UTL-014", debit: 45000, credit: 45000, status: "Posted", by: "Hassan Sheikh" },
  { id: "JE-0004", no: "JE-0004", date: "2026-10-06", description: "Salary Payable Adjustment", reference: "SAL-010", debit: 500000, credit: 500000, status: "Draft", by: "Maria Fernandes" },
  { id: "JE-0005", no: "JE-0005", date: "2026-10-08", description: "Stationery Purchase", reference: "STN-006", debit: 18000, credit: 18000, status: "Posted", by: "Aisha Malik" },
  { id: "JE-0006", no: "JE-0006", date: "2026-10-09", description: "Transport Fuel", reference: "TRN-021", debit: 62000, credit: 62000, status: "Cancelled", by: "Bilal Raza" },
  { id: "JE-0007", no: "JE-0007", date: "2026-10-11", description: "Admission Fee — New Batch", reference: "ADM-118", debit: 186000, credit: 186000, status: "Posted", by: "Hassan Sheikh" },
];

/** Draft journal lines used by the "New Journal Entry" form. */
export type JournalLine = { id: string; account: string; description: string; debit: number; credit: number };
export const JOURNAL_LINE_SEED: JournalLine[] = [
  { id: "L1", account: "Cash", description: "Fee Collection", debit: 250000, credit: 0 },
  { id: "L2", account: "Tuition Fees", description: "Fee Collection", debit: 0, credit: 250000 },
];

/* ------------------------------------------------------------------ Vouchers */
export type VoucherStatus = "Draft" | "Posted" | "Cancelled";
export type PayMethod = "Cash" | "Bank" | "Cheque" | "Online";
export type Voucher = {
  id: string; no: string; date: string; party: string; account: string;
  amount: number; method: PayMethod; reference: string; status: VoucherStatus;
};
export const PAY_METHODS: PayMethod[] = ["Cash", "Bank", "Cheque", "Online"];

export const RECEIPT_VOUCHERS: Voucher[] = [
  { id: "RV-0001", no: "RV-0001", date: "2026-10-01", party: "Ahmed Khan", account: "Tuition Fees", amount: 25000, method: "Cash", reference: "FEE-101", status: "Posted" },
  { id: "RV-0002", no: "RV-0002", date: "2026-10-02", party: "Sara Ali", account: "Tuition Fees", amount: 32000, method: "Bank", reference: "FEE-102", status: "Posted" },
  { id: "RV-0003", no: "RV-0003", date: "2026-10-03", party: "Hassan Raza", account: "Admission Fees", amount: 15000, method: "Cash", reference: "ADM-118", status: "Posted" },
  { id: "RV-0004", no: "RV-0004", date: "2026-10-05", party: "Fatima Noor", account: "Transport Fees", amount: 8500, method: "Online", reference: "TRN-055", status: "Draft" },
  { id: "RV-0005", no: "RV-0005", date: "2026-10-07", party: "Bilal Ahmed", account: "Tuition Fees", amount: 27500, method: "Cheque", reference: "FEE-103", status: "Posted" },
];

export const PAYMENT_VOUCHERS: Voucher[] = [
  { id: "PV-0001", no: "PV-0001", date: "2026-10-01", party: "Staff Payroll", account: "Salaries", amount: 500000, method: "Bank", reference: "SAL-010", status: "Posted" },
  { id: "PV-0002", no: "PV-0002", date: "2026-10-03", party: "K-Electric", account: "Utilities", amount: 45000, method: "Bank", reference: "UTL-014", status: "Posted" },
  { id: "PV-0003", no: "PV-0003", date: "2026-10-05", party: "Landlord — Campus", account: "Rent", amount: 100000, method: "Cheque", reference: "EXP-102", status: "Posted" },
  { id: "PV-0004", no: "PV-0004", date: "2026-10-08", party: "Stationery Mart", account: "Stationery", amount: 18000, method: "Cash", reference: "STN-006", status: "Posted" },
  { id: "PV-0005", no: "PV-0005", date: "2026-10-10", party: "FixIt Maintenance", account: "Maintenance", amount: 26000, method: "Cash", reference: "MNT-009", status: "Draft" },
];

/* ------------------------------------------------------------- General ledger */
export type LedgerLine = { date: string; reference: string; description: string; debit?: number; credit?: number; balance: number };
export const LEDGER: Record<string, { account: string; opening: number; lines: LedgerLine[] }> = {
  Cash: {
    account: "Cash", opening: 500000,
    lines: [
      { date: "2026-10-02", reference: "RV-0001", description: "Fee Collection", debit: 25000, balance: 525000 },
      { date: "2026-10-03", reference: "PV-0002", description: "Utility payment", credit: 10000, balance: 515000 },
      { date: "2026-10-05", reference: "PV-0004", description: "Stationery purchase", credit: 18000, balance: 497000 },
      { date: "2026-10-08", reference: "RV-0003", description: "Admission fee", debit: 15000, balance: 512000 },
    ],
  },
  Bank: {
    account: "Bank", opening: 1200000,
    lines: [
      { date: "2026-10-01", reference: "PV-0001", description: "Staff payroll", credit: 500000, balance: 700000 },
      { date: "2026-10-04", reference: "RV-0002", description: "Fee collection (bank)", debit: 32000, balance: 732000 },
      { date: "2026-10-09", reference: "RV-0005", description: "Cheque clearance", debit: 27500, balance: 759500 },
    ],
  },
};

/* ----------------------------------------------------------- Fee receivables */
export type RecvStatus = "Paid" | "Partial" | "Pending" | "Overdue";
export type Receivable = {
  id: string; student: string; sid: string; cls: string; section: string; invoice: string;
  dueDate: string; total: number; paid: number; outstanding: number; status: RecvStatus;
};

export const RECEIVABLES: Receivable[] = [
  { id: "R-1", student: "Ahmed Khan", sid: "ST-001", cls: "Grade 5", section: "A", invoice: "INV-1001", dueDate: "2026-10-10", total: 25000, paid: 15000, outstanding: 10000, status: "Partial" },
  { id: "R-2", student: "Sara Ali", sid: "ST-002", cls: "Grade 5", section: "B", invoice: "INV-1002", dueDate: "2026-10-10", total: 32000, paid: 32000, outstanding: 0, status: "Paid" },
  { id: "R-3", student: "Hassan Raza", sid: "ST-003", cls: "Grade 6", section: "A", invoice: "INV-1003", dueDate: "2026-10-05", total: 27500, paid: 0, outstanding: 27500, status: "Overdue" },
  { id: "R-4", student: "Fatima Noor", sid: "ST-004", cls: "Grade 6", section: "B", invoice: "INV-1004", dueDate: "2026-10-15", total: 27500, paid: 0, outstanding: 27500, status: "Pending" },
  { id: "R-5", student: "Bilal Ahmed", sid: "ST-005", cls: "Grade 7", section: "A", invoice: "INV-1005", dueDate: "2026-10-12", total: 30000, paid: 20000, outstanding: 10000, status: "Partial" },
  { id: "R-6", student: "Ayesha Malik", sid: "ST-006", cls: "Grade 7", section: "B", invoice: "INV-1006", dueDate: "2026-09-28", total: 30000, paid: 0, outstanding: 30000, status: "Overdue" },
  { id: "R-7", student: "Usman Tariq", sid: "ST-007", cls: "Grade 8", section: "A", invoice: "INV-1007", dueDate: "2026-10-18", total: 31000, paid: 31000, outstanding: 0, status: "Paid" },
  { id: "R-8", student: "Zainab Fatima", sid: "ST-008", cls: "Grade 8", section: "B", invoice: "INV-1008", dueDate: "2026-10-20", total: 31000, paid: 0, outstanding: 31000, status: "Pending" },
];

/* ------------------------------------------------------------------ Reports */
export type ReportLine = { name: string; amount: number };
export type TbRow = { code: string; name: string; debit: number; credit: number };

export const TRIAL_BALANCE: TbRow[] = [
  { code: "1001", name: "Cash", debit: 500000, credit: 0 },
  { code: "1002", name: "Bank", debit: 1000000, credit: 0 },
  { code: "1100", name: "Accounts Receivable", debit: 128000, credit: 0 },
  { code: "1200", name: "Fixed Assets", debit: 400000, credit: 0 },
  { code: "2001", name: "Accounts Payable", debit: 0, credit: 108500 },
  { code: "2002", name: "Salaries Payable", debit: 0, credit: 50000 },
  { code: "3001", name: "Opening Fund", debit: 0, credit: 500000 },
  { code: "3002", name: "Retained Surplus", debit: 0, credit: 664000 },
  { code: "4001", name: "Tuition Fees", debit: 0, credit: 1500000 },
  { code: "4002", name: "Admission Fees", debit: 0, credit: 186000 },
  { code: "4003", name: "Transport Fees", debit: 0, credit: 8500 },
  { code: "5001", name: "Salaries", debit: 700000, credit: 0 },
  { code: "5002", name: "Rent", debit: 100000, credit: 0 },
  { code: "5003", name: "Utilities", debit: 45000, credit: 0 },
  { code: "5004", name: "Stationery", debit: 18000, credit: 0 },
  { code: "5005", name: "Maintenance", debit: 26000, credit: 0 },
];

export const PROFIT_LOSS: { income: ReportLine[]; expenses: ReportLine[] } = {
  income: [
    { name: "Tuition Fees", amount: 1500000 },
    { name: "Admission Fees", amount: 186000 },
    { name: "Transport Fees", amount: 8500 },
    { name: "Other Income", amount: 12000 },
  ],
  expenses: [
    { name: "Salaries", amount: 700000 },
    { name: "Rent", amount: 100000 },
    { name: "Utilities", amount: 45000 },
    { name: "Stationery", amount: 18000 },
    { name: "Maintenance", amount: 26000 },
    { name: "Other Expenses", amount: 35000 },
  ],
};

export const BALANCE_SHEET: { assets: ReportLine[]; liabilities: ReportLine[]; equity: ReportLine[] } = {
  assets: [
    { name: "Cash", amount: 512000 },
    { name: "Bank", amount: 759500 },
    { name: "Accounts Receivable", amount: 128000 },
    { name: "Fixed Assets", amount: 400000 },
  ],
  liabilities: [
    { name: "Accounts Payable", amount: 108500 },
    { name: "Salaries Payable", amount: 50000 },
  ],
  equity: [
    { name: "Opening Fund", amount: 500000 },
    { name: "Current Year Surplus", amount: 1141000 },
  ],
};

export const CASH_FLOW: { opening: number; sections: { title: string; lines: ReportLine[] }[] } = {
  opening: 1200000,
  sections: [
    {
      title: "Operating Activities",
      lines: [
        { name: "Fee collection", amount: 1706500 },
        { name: "Salaries paid", amount: -700000 },
        { name: "Rent paid", amount: -100000 },
        { name: "Utilities paid", amount: -45000 },
        { name: "Stationery & maintenance", amount: -44000 },
        { name: "Transport & fuel", amount: -62000 },
      ],
    },
    {
      title: "Investing Activities",
      lines: [
        { name: "Laboratory equipment", amount: -400000 },
        { name: "Sale of old furniture", amount: 35000 },
      ],
    },
    {
      title: "Financing Activities",
      lines: [
        { name: "School fund contribution", amount: 500000 },
        { name: "Bank loan repayment", amount: -120000 },
      ],
    },
  ],
};

/* -------------------------------------------------------------- Cash & Bank */
export type CashAccount = { id: string; name: string; number: string; kind: "Cash" | "Bank"; balance: number; lastTxn: string };
export const CASH_BANK: CashAccount[] = [
  { id: "CB-1", name: "Cash", number: "—", kind: "Cash", balance: 512000, lastTxn: "2026-10-08" },
  { id: "CB-2", name: "Main Bank", number: "PK36-SCB-0001-2233", kind: "Bank", balance: 759500, lastTxn: "2026-10-09" },
  { id: "CB-3", name: "School Account", number: "PK36-HBL-0045-8811", kind: "Bank", balance: 240000, lastTxn: "2026-10-06" },
  { id: "CB-4", name: "Other Bank", number: "PK36-MBL-0088-4402", kind: "Bank", balance: 96000, lastTxn: "2026-09-30" },
];

export type BankTxn = { id: string; date: string; reference: string; description: string; book: number; bank: number; status: "Matched" | "Unmatched" };
export const BANK_TXNS: BankTxn[] = [
  { id: "BT-1", date: "2026-10-01", reference: "PV-0001", description: "Staff payroll", book: 500000, bank: 500000, status: "Matched" },
  { id: "BT-2", date: "2026-10-04", reference: "RV-0002", description: "Fee collection (bank)", book: 32000, bank: 32000, status: "Matched" },
  { id: "BT-3", date: "2026-10-05", reference: "PV-0003", description: "Cheque — campus rent", book: 100000, bank: 100000, status: "Matched" },
  { id: "BT-4", date: "2026-10-09", reference: "RV-0005", description: "Cheque clearance", book: 27500, bank: 0, status: "Unmatched" },
  { id: "BT-5", date: "2026-10-11", reference: "BNK-FEE", description: "Bank service charges", book: 0, bank: 1250, status: "Unmatched" },
];

/* ------------------------------------------------------------------ Budgets */
export type BudgetStatus = "Active" | "Inactive" | "Completed" | "Over Budget";
export type BudgetRow = {
  id: string; name: string; year: string; department: string;
  budget: number; actual: number; remaining: number; status: BudgetStatus;
};
export const BUDGETS: BudgetRow[] = [
  { id: "B-1", name: "Academic Year Budget", year: "2026-2027", department: "School Operations", budget: 5000000, actual: 3250000, remaining: 1750000, status: "Active" },
  { id: "B-2", name: "Sports & Events", year: "2026-2027", department: "Activities", budget: 800000, actual: 320000, remaining: 480000, status: "Active" },
  { id: "B-3", name: "Lab & IT Upgrade", year: "2026-2027", department: "Technology", budget: 1500000, actual: 1420000, remaining: 80000, status: "Active" },
  { id: "B-4", name: "Transport Fleet", year: "2026-2027", department: "Transport", budget: 2200000, actual: 900000, remaining: 1300000, status: "Active" },
  { id: "B-5", name: "Library Expansion", year: "2025-2026", department: "Library", budget: 600000, actual: 600000, remaining: 0, status: "Completed" },
  { id: "B-6", name: "Campus Maintenance", year: "2025-2026", department: "Operations", budget: 900000, actual: 960000, remaining: -60000, status: "Over Budget" },
];

/* ------------------------------------------------------------ Reports index */
export type AccountReport = { title: string; desc: string; href: string; icon: string; group: string };
export const ACCOUNT_REPORTS: AccountReport[] = [
  { title: "General Ledger", desc: "Account-wise ledger with running balance", href: "/accounts/general-ledger", icon: "ledger", group: "Core" },
  { title: "Account Statement", desc: "Complete income & expense statement", href: "/accounts/statement", icon: "statement", group: "Core" },
  { title: "Trial Balance", desc: "Debit / credit balance verification", href: "/accounts/trial-balance", icon: "scale", group: "Financial" },
  { title: "Profit & Loss", desc: "Income, expenses and net surplus", href: "/accounts/profit-loss", icon: "trend", group: "Financial" },
  { title: "Balance Sheet", desc: "Assets, liabilities and school fund", href: "/accounts/balance-sheet", icon: "building", group: "Financial" },
  { title: "Cash Flow", desc: "Operating, investing & financing flows", href: "/accounts/cash-flow", icon: "flow", group: "Financial" },
  { title: "Fee Collection Report", desc: "Collected fees by period and class", href: "/accounts/fee-receivables", icon: "receipt", group: "Fees" },
  { title: "Fee Outstanding Report", desc: "Outstanding balances and overdue dues", href: "/accounts/fee-receivables", icon: "alert", group: "Fees" },
  { title: "Income Report", desc: "Income breakdown by category", href: "/accounts/income", icon: "trend", group: "Income & Expense" },
  { title: "Expense Report", desc: "Expense breakdown by category", href: "/accounts/expense", icon: "trend", group: "Income & Expense" },
  { title: "Payroll Expense Report", desc: "Salary and payroll expenditure", href: "/accounts/payment-vouchers", icon: "wallet", group: "Income & Expense" },
];
