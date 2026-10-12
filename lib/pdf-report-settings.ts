/** PDF letterhead settings (same pattern as accounting-web-app). */

export const PDF_REPORT_SETTINGS_KEY = "bisons:pdf_report_settings";

export type PdfReportSettings = {
  companyName: string;
  companyAddress: string;
  logo: string;
  signature: string;
  showLogo: boolean;
  showSignature: boolean;
  showCompanyName: boolean;
  showAddress: boolean;
  showPageNumbers: boolean;
  layout: "classic" | "modern" | "minimal" | string;
  logoPosition: "left" | "center" | "right" | string;
  headerSubtitle: string;
  footerText: string;
  accentColor: string;
  signatureLabel: string;
  updatedAt?: string;
};

export const DEFAULT_PDF_REPORT_SETTINGS: PdfReportSettings = {
  companyName: "",
  companyAddress: "",
  logo: "",
  signature: "",
  showLogo: true,
  showSignature: true,
  showCompanyName: true,
  showAddress: true,
  showPageNumbers: true,
  layout: "classic",
  logoPosition: "left",
  headerSubtitle: "",
  footerText: "Computer-generated report · BisonsEduCore360",
  accentColor: "#1e3a8a",
  signatureLabel: "Authorized Signature",
};

export function loadPdfReportSettingsLocal(): PdfReportSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PDF_REPORT_SETTINGS_KEY);
    if (!raw) return null;
    return { ...DEFAULT_PDF_REPORT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function savePdfReportSettingsLocal(settings: PdfReportSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PDF_REPORT_SETTINGS_KEY,
    JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }),
  );
}
