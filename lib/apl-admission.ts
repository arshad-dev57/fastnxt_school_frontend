/** A Plus Institute — admission form defaults & helpers. */

export const APL_QUAL_LEVELS = [
  "Matric / SSC",
  "Intermediate / HSSC",
  "Bachelor's Degree",
  "LAT (Law Admission Test)",
] as const;

export type AplAdmissionCategory = "law" | "it" | "nursing";

export type AplCategoryPreset = {
  id: AplAdmissionCategory;
  title: string;
  description: string;
  formTitle: string;
  programs: string[];
  documents: string[];
  qualificationLevels: string[];
  requireLatForLlb: boolean;
};

/** Category 1 is the law admission form. */
export const APL_CATEGORIES: AplCategoryPreset[] = [
  {
    id: "law",
    title: "Law",
    description: "LLB admission. Five years after Intermediate, or four years after a bachelor's degree.",
    formTitle: "LAW ADMISSION FORM",
    programs: ["LLB (5 Years)", "LLB (4 Years)"],
    documents: [
      "CNIC / B-Form Copy",
      "Matric Result Card",
      "Intermediate Result Card",
      "Bachelor Degree / Transcript",
      "LAT Result Card",
      "Domicile",
      "Passport Size Photos",
      "Other",
    ],
    qualificationLevels: [...APL_QUAL_LEVELS],
    requireLatForLlb: true,
  },
  {
    id: "it",
    title: "IT Courses",
    description: "Web design, marketplaces, programming and computer courses.",
    formTitle: "IT COURSES ADMISSION FORM",
    programs: [
      "Web Design",
      "Digital Marketing",
      "YouTube Learning",
      "Google AdSense",
      "Shopify",
      "Amazon",
      "eBay",
      "Etsy",
      "Walmart",
      "OnBuy",
      "SMC",
      "C and C++",
      "TikTok Seller",
      "Graphic Design",
      "Front Desk Operator",
      "Computer Hardware",
    ],
    documents: [
      "CNIC / B-Form Copy",
      "Matric Result Card",
      "Intermediate Result Card",
      "Passport Size Photos",
      "Other",
    ],
    qualificationLevels: ["Matric / SSC", "Intermediate / HSSC"],
    requireLatForLlb: false,
  },
  {
    id: "nursing",
    title: "Nursing",
    description: "BS Nursing (3 years) or B Category (2 years).",
    formTitle: "NURSING ADMISSION FORM",
    programs: ["BS Nursing (3 years)", "B Category (2 years)"],
    documents: [
      "CNIC / B-Form Copy",
      "Matric Result Card",
      "Intermediate / FSc Result Card",
      "Passport Size Photos",
      "Medical Fitness Certificate",
      "Other",
    ],
    qualificationLevels: ["Matric / SSC", "Intermediate / FSc"],
    requireLatForLlb: false,
  },
];

export const NURSING_TRACKS = [
  {
    id: "bs-nursing",
    title: "BS Nursing",
    duration: "3 years",
    courseName: "BS Nursing (3 years)",
    description: "Three-year BS Nursing admission.",
  },
  {
    id: "b-category",
    title: "B Category",
    duration: "2 years",
    courseName: "B Category (2 years)",
    description: "Two-year B Category nursing admission.",
  },
] as const;

export type NursingTrackId = (typeof NURSING_TRACKS)[number]["id"];

export function isNursingTrack(value?: string | null): value is NursingTrackId {
  return NURSING_TRACKS.some((track) => track.id === value);
}

export function nursingTrack(value?: string | null) {
  return NURSING_TRACKS.find((track) => track.id === value) || null;
}

export const LAW_TRACKS = [
  {
    id: "llb-5",
    title: "LLB (5 Years)",
    duration: "5 years",
    courseName: "LLB (5 Years)",
    description: "After Intermediate / HSSC. LAT is required.",
  },
  {
    id: "llb-4",
    title: "LLB (4 Years)",
    duration: "4 years",
    courseName: "LLB (4 Years)",
    description: "After a bachelor's degree. LAT is required.",
  },
] as const;

/** Older records used "general" for this same law form. */
export function asAplCategory(value?: string | null): AplAdmissionCategory | null {
  if (value === "law" || value === "general") return "law";
  if (value === "it" || value === "nursing") return value;
  return null;
}

export function isAplCategory(value?: string | null): value is AplAdmissionCategory {
  return asAplCategory(value) !== null;
}

export function aplCategoryPreset(category?: string | null): AplCategoryPreset {
  return APL_CATEGORIES.find((item) => item.id === category) || APL_CATEGORIES[0];
}

/** True when this school should see the A Plus Institute admission flow. */
export function looksLikeAplSchool(name?: string | null, shortName?: string | null): boolean {
  const hay = `${name || ""} ${shortName || ""}`.toUpperCase();
  const compact = hay.replace(/[^A-Z0-9]/g, "");
  if (compact.includes("APLUSINSTITUT")) return true;
  if (hay.includes("A+") && hay.includes("INSTITUT")) return true;
  if (hay.includes("IT & LAW") || hay.includes("IT AND LAW")) return true;
  if (hay.includes("APL-LEGAL") || hay.includes("APL LEGAL")) return true;
  return false;
}

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

export function blankQualifications(levels: readonly string[] = APL_QUAL_LEVELS): AplQualificationRow[] {
  return levels.map((level) => ({
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
