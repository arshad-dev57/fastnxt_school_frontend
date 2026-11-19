/** A+ INSTITUTE IT & LAW — admission form defaults & helpers. */

export const APL_QUAL_LEVELS = ["Matric / SSC", "Intermediate / HSSC", "LAT (for LLB)"] as const;

export type AplQualificationRow = {
  level: string;
  board: string;
  year: string;
  totalMarks: string;
  obtainedMarks: string;
  percentage: string;
};

export type AplFeeState = {
  admissionFee: string;
  courseFee: string;
  monthlyFee: string;
  discount: string;
  receiptNo: string;
  paymentDate: string;
  remarks: string;
};

export function blankQualifications(): AplQualificationRow[] {
  return APL_QUAL_LEVELS.map((level) => ({
    level,
    board: "",
    year: "",
    totalMarks: "",
    obtainedMarks: "",
    percentage: "",
  }));
}

export function blankFees(): AplFeeState {
  return {
    admissionFee: "",
    courseFee: "",
    monthlyFee: "",
    discount: "",
    receiptNo: "",
    paymentDate: "",
    remarks: "",
  };
}

export function calcPercentage(total: string, obtained: string): string {
  const t = Number(total);
  const o = Number(obtained);
  if (!Number.isFinite(t) || !Number.isFinite(o) || t <= 0) return "";
  return ((o / t) * 100).toFixed(2);
}

export function isAplVariant(variant?: string | null): boolean {
  return String(variant || "").trim() === "apl-legal-it";
}
