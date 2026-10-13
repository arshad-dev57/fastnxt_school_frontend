
import type { ApiResult, AuthResponse, MeResponse, RegisterSchoolInput } from "./types";

/**
 * Browser calls use this same-origin path. `app/backend-api/[...path]` forwards
 * them to the real API, so a new host (localhost, a LAN IP, production) never
 * needs a CORS allow-list entry.
 */
export const API_PROXY_PATH = "/backend-api";

function upstreamBase(): string {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
    /\/+$/,
    ""
  );
}

/** Absolute upstream URL. Server-side calls skip the proxy; the browser never uses this. */
export function resolveApiUrl(path: string): string {
  if (typeof window !== "undefined") return `${API_PROXY_PATH}${path}`;
  return `${upstreamBase()}${path}`;
}

type Envelope<T> = {
  success: boolean;
  message?: string;
  data?: T | null;
  errors?: string[] | null;
  code?: string | null;
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly errors: string[];

  constructor(message: string, code: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

/** Perform one API call and unwrap the envelope. Throws `ApiError`. */
async function request<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  let response: Response;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    response = await fetch(resolveApiUrl(path), {
      method,
      // Send the session cookie and accept the one the API may set back.
      credentials: "include",
      // FormData must not set Content-Type — the browser adds the multipart boundary.
      headers: body === undefined || isFormData ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (err) {
    // Let AbortController cancellations bubble so callers can ignore them.
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (signal?.aborted) throw err;
    // The proxy or the API never answered.
    throw new ApiError(
      "Cannot reach the API. Please make sure the backend is running.",
      "NETWORK_ERROR",
      0
    );
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const code = payload?.code || "REQUEST_FAILED";
    // Platform deactivation — tell AuthProvider to drop the local session.
    if (code === "SCHOOL_DEACTIVATED" && typeof window !== "undefined") {
      window.dispatchEvent(new Event("bisons:school-deactivated"));
    }
    throw new ApiError(
      payload?.message || `The request failed (HTTP ${response.status}).`,
      code,
      response.status,
      Array.isArray(payload?.errors) ? payload.errors : []
    );
  }

  return (payload.data ?? null) as T;
}
export function describeApiError(error: unknown): { message: string; code: string; errors: string[] } {
  if (error instanceof ApiError) {
    return { message: error.message, code: error.code, errors: error.errors };
  }
  return {
    message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
    code: "UNKNOWN",
    errors: [],
  };
}

/** Run a client call and turn it into the discriminated result the UI uses. */
export async function asResult<T>(run: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, ...describeApiError(error) };
  }
}

/** `data` payload of GET /api/health. */
export type HealthResponse = {
  status: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
};

/** School profile shape from the API. */
export type SchoolProfile = {
  id: string;
  name: string;
  shortName: string;
  ownerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address?: string;
  website?: string;
  instituteNo?: string;
  principal?: string;
  academicSession?: string;
  motto?: string;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Response from GET /api/school/profile */
export type SchoolProfileResponse = {
  school: SchoolProfile;
};

/** The four auth endpoints the frontend consumes. */
export const authApi = {
  /** POST /api/auth/register — creates the school, its admin and the 5-day trial. */
  register: (input: RegisterSchoolInput) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: input }),

  /** POST /api/auth/login — sets the httpOnly session cookie. */
  login: (input: { email: string; password: string; remember?: boolean }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: input }),

  /** GET /api/auth/me — used to restore the session after a refresh. */
  me: (signal?: AbortSignal) => request<MeResponse>("/auth/me", { signal }),

  /** POST /api/auth/logout — clears the session cookie. */
  logout: () => request<{ loggedOut: boolean }>("/auth/logout", { method: "POST" }),

  /** GET /api/health — lets the UI tell "wrong password" from "API is down". */
  health: (signal?: AbortSignal) => request<HealthResponse>("/health", { signal }),
};

/** School profile endpoints. */
export const schoolApi = {
  /** GET /api/school/profile — fetch the signed-in school's profile. */
  getProfile: (signal?: AbortSignal) =>
    request<SchoolProfileResponse>("/school/profile", { signal }),

  /** PATCH /api/school/profile — update the school's profile (partial). */
  updateProfile: (updates: Partial<SchoolProfile>) =>
    request<SchoolProfileResponse>("/school/profile", { method: "PATCH", body: updates }),

  /** POST /api/school/logo — upload institute logo to Cloudinary. */
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<SchoolProfileResponse & { upload?: { url: string; publicId: string } }>(
      "/school/logo",
      { method: "POST", body: form },
    );
  },
};

export type CloudUploadResult = {
  url: string;
  publicId: string;
  name: string;
  type: string;
  size: number;
  bytes?: number;
  format?: string;
  purpose?: string;
  fileId?: string;
};

export type SchoolStorageUsage = {
  schoolId: string;
  totalBytes: number;
  totalFiles: number;
  totalMb: number;
  byPurpose: { purpose: string; bytes: number; files: number; mb: number }[];
  recent: {
    id: string;
    purpose: string;
    originalName: string | null;
    url: string;
    publicId: string;
    bytes: number;
    format: string | null;
    resourceType: string;
    createdAt: string;
  }[];
};

export type AppNotification = {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  icon: string;
  tone: string;
  href?: string | null;
  read: boolean;
  readAt?: string | null;
  floatedAt?: string | null;
  createdAt: string;
  time: string;
};

/** In-app notifications. */
export const notificationsApi = {
  list: (params?: { limit?: number; unreadOnly?: boolean }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.unreadOnly) query.set("unreadOnly", "true");
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ notifications: AppNotification[]; unread: number }>(`/notifications${qs}`, { signal });
  },
  unreadCount: (signal?: AbortSignal) =>
    request<{ unread: number }>("/notifications/unread-count", { signal }),
  markRead: (id: string) =>
    request<{ notification: AppNotification }>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    request<{ updated: number }>("/notifications/read-all", { method: "POST" }),
  pendingFloat: (signal?: AbortSignal) =>
    request<{ notifications: AppNotification[] }>("/notifications/float", { signal }),
  ackFloat: (ids: string[]) =>
    request<{ updated: number }>("/notifications/float/ack", { method: "POST", body: { ids } }),
};

/**
 * Mail usage API (Resend ledger) — ready for later quotas.
 * Do not call from UI yet for usage; sendEmail is available.
 */
export const mailApi = {
  usage: (signal?: AbortSignal) =>
    request<{
      usage: {
        schoolId: string;
        totalEmails: number;
        sent: number;
        failed: number;
        skipped: number;
        byStatus: { status: string; count: number }[];
        byTemplate: { template: string; count: number }[];
        recent: unknown[];
      };
    }>("/mail/usage", { signal }),
};

export type LetterTemplate = {
  title: string;
  salutation: string;
  bodyIntro: string;
  bodyClosing: string;
  signOff: string;
  signerTitle: string;
  footerNote: string;
  showLogo: boolean;
  showRef: boolean;
  accentColor: string;
};

export const DEFAULT_ADMISSION_LETTER_TEMPLATE: LetterTemplate = {
  title: "ADMISSION LETTER",
  salutation: "Dear Parent / Guardian,",
  bodyIntro:
    "We are pleased to inform you that your child {studentName} has been granted admission to {schoolName} in {classSection}. Please find the admission details below.",
  bodyClosing:
    "Kindly report to the school office on or before the first day of the academic session to complete the remaining formalities and documentation. We look forward to welcoming your child to our school community.",
  signOff: "Yours sincerely,",
  signerTitle: "Principal / Administration",
  footerNote: "This is a computer-generated document.",
  showLogo: true,
  showRef: true,
  accentColor: "#0f4c81",
};

export const DEFAULT_JOB_LETTER_TEMPLATE: LetterTemplate = {
  title: "APPOINTMENT LETTER",
  salutation: "Dear {employeeName},",
  bodyIntro:
    "We are pleased to offer you the position of {designation} in the {department} department at {schoolName}, effective from the date of joining.",
  bodyClosing:
    "Please report to the administration office with original documents. We look forward to your valuable contribution to our institution.",
  signOff: "Yours sincerely,",
  signerTitle: "Principal / HR Administration",
  footerNote: "This is a computer-generated employment letter.",
  showLogo: true,
  showRef: true,
  accentColor: "#0f4c81",
};

export type LetterSchoolInfo = {
  id: string;
  name: string;
  shortName?: string | null;
  address?: string | null;
  phone: string;
  email: string;
  website?: string | null;
  principal?: string | null;
  logoUrl?: string | null;
  academicSession?: string | null;
};

/** Letter templates + school-branded email send. */
export const lettersApi = {
  getAdmissionTemplate: (signal?: AbortSignal) =>
    request<{ template: LetterTemplate; school: LetterSchoolInfo }>("/letters/admission-template", { signal }),
  updateAdmissionTemplate: (data: Partial<LetterTemplate>) =>
    request<{ template: LetterTemplate; school: LetterSchoolInfo }>("/letters/admission-template", {
      method: "PATCH",
      body: data,
    }),
  getJobTemplate: (signal?: AbortSignal) =>
    request<{ template: LetterTemplate; school: LetterSchoolInfo }>("/letters/job-template", { signal }),
  updateJobTemplate: (data: Partial<LetterTemplate>) =>
    request<{ template: LetterTemplate; school: LetterSchoolInfo }>("/letters/job-template", {
      method: "PATCH",
      body: data,
    }),
  sendEmail: (data: {
    to: string;
    title: string;
    messageHtml: string;
    subject?: string;
    template?: string;
    ctaLabel?: string;
    ctaHref?: string;
  }) =>
    request<{ delivered: boolean; reason?: string | null; id?: string | null }>("/letters/send-email", {
      method: "POST",
      body: data,
    }),
};

/** Cloudinary uploads + per-school storage usage. */
export const uploadsApi = {
  status: (signal?: AbortSignal) =>
    request<{ configured: boolean }>("/uploads/status", { signal }),

  usage: (signal?: AbortSignal) =>
    request<{ usage: SchoolStorageUsage }>("/uploads/usage", { signal }),

  /**
   * Same-origin authenticated download URL (forces browser download).
   * Prefer this over opening Cloudinary URLs directly (ACL deny on PDFs).
   */
  downloadHref: (opts: { url?: string; publicId?: string; filename?: string; resourceType?: string }) => {
    const query = new URLSearchParams();
    if (opts.publicId) query.set("publicId", opts.publicId);
    if (opts.url) query.set("url", opts.url);
    if (opts.filename) query.set("filename", opts.filename);
    if (opts.resourceType) query.set("resourceType", opts.resourceType);
    return `${API_PROXY_PATH}/uploads/download?${query.toString()}`;
  },

  /**
   * Upload one file to Cloudinary.
   * @param purpose logo | homework | exam-paper | employee-photo | employee-doc | student-photo | student-doc | other
   * @param folder optional subfolder under the school root
   */
  upload: (file: File, opts?: { purpose?: string; folder?: string }) => {
    const form = new FormData();
    form.append("file", file);
    if (opts?.purpose) form.append("purpose", opts.purpose);
    if (opts?.folder) form.append("folder", opts.folder);
    return request<{ upload: CloudUploadResult }>("/uploads", { method: "POST", body: form });
  },
};

/** Main Admin Dashboard — single payload, optional campus scope. */
export type DashboardStats = {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalClasses: number;
  totalEmployees: number;
  activeEmployees: number;
  pendingFees: number;
  collectedFees: number;
  income: number;
  expenses: number;
  /** Income − Expenses from posted ledger P&L (same as Accounts → Profit & Loss). */
  net?: number;
  paidInvoices: number;
  overdueInvoices: number;
};

export type DashboardPnl = {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  income: { name: string; amount: number }[];
  expenses: { name: string; amount: number }[];
};

export type DashboardOverview = {
  scope: string;
  stats: DashboardStats;
  /** Live Profit & Loss snapshot from the accounting ledger. */
  pnl?: DashboardPnl;
  gender: { Male: number; Female: number; Other: number };
  feeStatus: Record<string, number>;
  recentAdmissions: {
    id: string;
    studentId: string;
    name: string;
    cls: string;
    section: string;
    guardian: string;
    status: string;
    admissionDate: string;
    branchId: string | null;
  }[];
  upcomingEvents: {
    id: string;
    title: string;
    type: string;
    date: string;
    venue: string;
    status: string;
    branchId: string | null;
  }[];
  branchPerformance: {
    branchId: string;
    branchName: string;
    branchCode: string;
    students: number;
    employees: number;
    feeCollection: number;
    outstanding: number;
  }[];
};

export const dashboardApi = {
  getOverview: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<DashboardOverview>(`/dashboard${qs}`, { signal });
  },
};

/** User profile update endpoint. */
export const userApi = {
  /** PATCH /api/auth/me — update the current user's profile (partial). */
  updateProfile: (updates: { name?: string }) =>
    request<MeResponse>("/auth/me", { method: "PATCH", body: updates }),
};

/** Branch shape from the API. */
export type Branch = {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  phone?: string;
  status: "ACTIVE" | "INACTIVE";
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Response from GET /api/branches */
export type BranchesResponse = {
  branches: Branch[];
};

/** Response from single branch operations */
export type BranchResponse = {
  branch: Branch;
};

/** Branch endpoints. */
export const branchApi = {
  /** GET /api/branches — list all branches for the current school. */
  list: (signal?: AbortSignal) =>
    request<BranchesResponse>("/branches", { signal }),

  /** POST /api/branches — create a new branch. */
  create: (data: { name: string; code: string; address?: string; city?: string; phone?: string; status?: "ACTIVE" | "INACTIVE" }) =>
    request<BranchResponse>("/branches", { method: "POST", body: data }),

  /** GET /api/branches/:id — get a single branch. */
  get: (id: string, signal?: AbortSignal) =>
    request<BranchResponse>(`/branches/${id}`, { signal }),

  /** PATCH /api/branches/:id — update a branch (partial). */
  update: (id: string, data: Partial<Branch>) =>
    request<BranchResponse>(`/branches/${id}`, { method: "PATCH", body: data }),

  /** DELETE /api/branches/:id — delete a branch. */
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/branches/${id}`, { method: "DELETE" }),

  /** PATCH /api/branches/:id/status — activate/deactivate a branch. */
  updateStatus: (id: string, status: "ACTIVE" | "INACTIVE") =>
    request<BranchResponse>(`/branches/${id}/status`, { method: "PATCH", body: { status } }),
};

/** User Account Item from API */
export type UserAccount = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  panel: string;
  branchId?: string | null;
  status: "Active" | "Inactive";
  isActive: boolean;
  lastLogin: string;
  lastLoginAt?: string;
  createdAt: string;
};

export type UserUpsertPayload = {
  name: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  password?: string;
  branchId?: string | null;
};

export const usersApi = {
  list: (params?: { q?: string; role?: string; status?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ users: UserAccount[] }>(`/users${qs}`, { signal });
  },
  create: (data: UserUpsertPayload) =>
    request<{ user: UserAccount }>("/users", { method: "POST", body: data }),
  update: (id: string, data: Partial<UserUpsertPayload & { isActive: boolean }>) =>
    request<{ user: UserAccount }>(`/users/${id}`, { method: "PATCH", body: data }),
  resetPassword: (id: string, password?: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}/reset-password`, { method: "POST", body: { password } }),
  toggleStatus: (id: string, status: "Active" | "Inactive") =>
    request<{ user: UserAccount }>(`/users/${id}/status`, { method: "PATCH", body: { status } }),
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/users/${id}`, { method: "DELETE" }),
};

/** Roles & Permissions API */
export const rolesApi = {
  getPermissions: (role: string, signal?: AbortSignal) =>
    request<{ permissions: Record<string, boolean> | null }>(`/roles/${encodeURIComponent(role)}/permissions`, { signal }),
  savePermissions: (role: string, permissions: Record<string, boolean>) =>
    request<{ role: string; permissions: Record<string, boolean> }>(`/roles/${encodeURIComponent(role)}/permissions`, { method: "PUT", body: { permissions } }),
};

/** Ticket / Complaint item from API */
export type TicketItem = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  raisedBy: string;
  assignedTo: string;
  due: string;
  description: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
};

export const ticketsApi = {
  list: (params?: { q?: string; category?: string; priority?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.category) query.set("category", params.category);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ tickets: TicketItem[] }>(`/complaints${qs}`, { signal });
  },
  create: (data: { title: string; category?: string; priority?: string; status?: string; raisedBy?: string; assignedTo?: string; due?: string; description?: string; branchId?: string }) =>
    request<{ ticket: TicketItem }>("/complaints", { method: "POST", body: data }),
  update: (id: string, data: Partial<TicketItem>) =>
    request<{ ticket: TicketItem }>(`/complaints/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/complaints/${id}`, { method: "DELETE" }),
};

/** Employee document item */
export type EmployeeDocItem = {
  id: string;
  name: string;
  type: string;
  url?: string;
  uploadDate: string;
};

/** Employee Item from API */
export type EmployeeItem = {
  id: string;
  employeeId: string;
  name: string;
  gender: string;
  dob?: string;
  cnic?: string;
  phone?: string;
  email?: string;
  password?: string;
  address?: string;
  photo?: string;
  designation: string;
  department: string;
  joining: string;
  type: string;
  status: string;
  documents: EmployeeDocItem[];
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const employeesApi = {
  list: (params?: { q?: string; dept?: string; designation?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.dept) query.set("dept", params.dept);
    if (params?.designation) query.set("designation", params.designation);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ employees: EmployeeItem[] }>(`/employees${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) =>
    request<{ employee: EmployeeItem }>(`/employees/${id}`, { signal }),
  create: (data: Partial<EmployeeItem>) =>
    request<{ employee: EmployeeItem }>("/employees", { method: "POST", body: data }),
  update: (id: string, data: Partial<EmployeeItem>) =>
    request<{ employee: EmployeeItem }>(`/employees/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/employees/${id}`, { method: "DELETE" }),
  addDocument: (id: string, doc: { name: string; type: string; url?: string }) =>
    request<{ employee: EmployeeItem }>(`/employees/${id}/documents`, { method: "POST", body: doc }),
};

/** Job letter item from API */
export type JobLetterItem = {
  id: string;
  employeeId?: string;
  employee: string;
  designation: string;
  department: string;
  date: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export const jobLettersApi = {
  list: (params?: { q?: string; status?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ jobLetters: JobLetterItem[] }>(`/job-letters${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) =>
    request<{ jobLetter: JobLetterItem }>(`/job-letters/${id}`, { signal }),
  create: (data: { employee: string; designation: string; department: string; date?: string; status?: string; employeeId?: string }) =>
    request<{ jobLetter: JobLetterItem }>("/job-letters", { method: "POST", body: data }),
  updateStatus: (id: string, status: string) =>
    request<{ jobLetter: JobLetterItem }>(`/job-letters/${id}/status`, { method: "PATCH", body: { status } }),
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/job-letters/${id}`, { method: "DELETE" }),
};

/** Teacher option returned from GET /api/classes/teachers */
export type TeacherOption = {
  id: string;
  name: string;
  designation: string;
  department: string;
  employeeId: string;
};

/** Class item from the API */
export type ClassItem = {
  id: string;
  name: string;
  code: string;
  session: string;
  sections: string[];
  teacher: string;
  teacherId: string | null;
  students: number;
  description: string;
  status: "Active" | "Inactive";
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateClassInput = {
  name: string;
  code?: string;
  session?: string;
  sections?: string[];
  teacher?: string;
  teacherId?: string | null;
  students?: number;
  description?: string;
  status?: string;
  branchId?: string | null;
};

export const classesApi = {
  list: (params?: { q?: string; section?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.section) query.set("section", params.section);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ classes: ClassItem[] }>(`/classes${qs}`, { signal });
  },

  listTeachers: (branchId?: string, signal?: AbortSignal) => {
    const qs = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
    return request<{ teachers: TeacherOption[] }>(`/classes/teachers${qs}`, { signal });
  },

  get: (id: string, signal?: AbortSignal) =>
    request<{ class: ClassItem }>(`/classes/${id}`, { signal }),

  create: (data: CreateClassInput) =>
    request<{ class: ClassItem }>("/classes", { method: "POST", body: data }),

  update: (id: string, data: Partial<CreateClassInput>) =>
    request<{ class: ClassItem }>(`/classes/${id}`, { method: "PATCH", body: data }),

  /** PATCH /api/classes/:id/status — quick status toggle. */
  updateStatus: (id: string, status: "Active" | "Inactive") =>
    request<{ class: ClassItem }>(`/classes/${id}`, { method: "PATCH", body: { status } }),

  /** DELETE /api/classes/:id — permanently remove a class. */
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/classes/${id}`, { method: "DELETE" }),
};

export type SubjectItem = {
  id: string;
  name: string;
  code: string;
  type: "Core" | "Elective" | "Activity";
  description?: string;
  classes: number;
  status: "Active" | "Inactive";
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubjectInput = {
  name: string;
  code?: string;
  type?: "Core" | "Elective" | "Activity";
  description?: string;
  status?: "Active" | "Inactive";
  branchId?: string | null;
};

export type SubjectAssignmentItem = {
  id: string;
  cls: string;
  section: string;
  subject: string;
  teacher: string;
  date: string;
  classId?: string | null;
  subjectId?: string | null;
  teacherId?: string | null;
  status?: string;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAssignmentInput = {
  cls: string;
  section: string;
  subject: string;
  teacher: string;
  date?: string;
  classId?: string | null;
  subjectId?: string | null;
  teacherId?: string | null;
  branchId?: string | null;
};

export type ClassWithSubjectsItem = {
  id: string;
  name: string;
  code: string;
  session: string;
  sections: string[];
  teacher: string;
  students: number;
  status: "Active" | "Inactive";
  subjects: string[];
  createdAt: string;
};

export const subjectsApi = {
  /** GET /api/subjects — list all subjects */
  list: (params?: { q?: string; type?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.type) query.set("type", params.type);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ subjects: SubjectItem[] }>(`/subjects${qs}`, { signal });
  },

  /** GET /api/subjects/:id — get a single subject */
  get: (id: string, signal?: AbortSignal) =>
    request<{ subject: SubjectItem }>(`/subjects/${id}`, { signal }),

  /** POST /api/subjects — create a subject */
  create: (data: CreateSubjectInput) =>
    request<{ subject: SubjectItem }>("/subjects", { method: "POST", body: data }),

  /** PATCH /api/subjects/:id — update a subject */
  update: (id: string, data: Partial<CreateSubjectInput>) =>
    request<{ subject: SubjectItem }>(`/subjects/${id}`, { method: "PATCH", body: data }),

  /** PATCH /api/subjects/:id status toggle */
  updateStatus: (id: string, status: "Active" | "Inactive") =>
    request<{ subject: SubjectItem }>(`/subjects/${id}`, { method: "PATCH", body: { status } }),

  /** DELETE /api/subjects/:id — delete a subject */
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/subjects/${id}`, { method: "DELETE" }),

  /** GET /api/subjects/assignments — list subject assignments */
  listAssignments: (params?: { q?: string; cls?: string; section?: string; status?: string; branchId?: string; teacher?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    if (params?.teacher) query.set("teacher", params.teacher);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ assignments: SubjectAssignmentItem[] }>(`/subjects/assignments${qs}`, { signal });
  },

  /** POST /api/subjects/assignments — create or update subject assignment */
  createAssignment: (data: CreateAssignmentInput) =>
    request<{ assignment: SubjectAssignmentItem }>("/subjects/assignments", { method: "POST", body: data }),

  /** DELETE /api/subjects/assignments/:id — delete subject assignment */
  deleteAssignment: (id: string) =>
    request<{ deleted: boolean }>(`/subjects/assignments/${id}`, { method: "DELETE" }),

  /** GET /api/subjects/classes — list classes with assigned subjects overview */
  listClassesWithSubjects: (params?: { q?: string; section?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.section) query.set("section", params.section);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ classes: ClassWithSubjectsItem[] }>(`/subjects/classes${qs}`, { signal });
  },
};

export type StudentDocItem = {
  id: string;
  name: string;
  type: string;
  url: string;
  publicId?: string;
  size?: number;
  uploadDate: string;
};

export type StudentDocumentRow = StudentDocItem & {
  studentDbId: string;
  studentId: string;
  studentName: string;
  cls: string;
  section: string;
  photo?: string;
  status?: string;
  branchId?: string | null;
};

export type StudentItem = {
  id: string;
  studentId: string;
  name: string;
  gender: string;
  dob?: string;
  blood?: string;
  photo?: string;
  admissionNo: string;
  admissionDate: string;
  session: string;
  cls: string;
  classId?: string | null;
  section: string;
  father?: string;
  mother?: string;
  guardian?: string;
  phone?: string;
  contact?: string;
  email?: string;
  address?: string;
  prevSchool?: string;
  medical?: string;
  notes?: string;
  documents?: StudentDocItem[];
  status: "Active" | "Inactive";
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateStudentInput = {
  name?: string;
  first?: string;
  last?: string;
  gender?: string;
  dob?: string;
  blood?: string;
  photo?: string;
  studentId?: string;
  admissionNo?: string;
  admissionDate?: string;
  session?: string;
  cls: string;
  classId?: string | null;
  section?: string;
  father?: string;
  mother?: string;
  guardian?: string;
  phone?: string;
  contact?: string;
  email?: string;
  password?: string;
  address?: string;
  prevSchool?: string;
  medical?: string;
  notes?: string;
  documents?: StudentDocItem[];
  status?: string;
  branchId?: string | null;
};

export type AdmissionLetterItem = {
  id: string;
  studentId?: string | null;
  student: string;
  admissionNo: string;
  cls: string;
  section: string;
  date: string;
  status: "Generated" | "Pending" | "Printed";
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdmissionLetterInput = {
  student: string;
  studentId?: string | null;
  admissionNo?: string;
  cls?: string;
  section?: string;
  date?: string;
  branchId?: string | null;
};

export const studentsApi = {
  /** GET /api/students/me — linked student profile for the signed-in student user */
  me: (signal?: AbortSignal) =>
    request<{ student: StudentItem }>("/students/me", { signal }),

  /** PATCH /api/students/me — student portal self-update (contact fields) */
  updateMe: (data: Partial<Pick<CreateStudentInput, "father" | "mother" | "guardian" | "phone" | "email" | "address" | "prevSchool" | "medical" | "notes">>) =>
    request<{ student: StudentItem }>("/students/me", { method: "PATCH", body: data }),

  /** GET /api/students — list all students */
  list: (params?: { q?: string; cls?: string; section?: string; status?: string; gender?: string; session?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.status) query.set("status", params.status);
    if (params?.gender) query.set("gender", params.gender);
    if (params?.session) query.set("session", params.session);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ students: StudentItem[] }>(`/students${qs}`, { signal });
  },

  /** GET /api/students/documents — all uploaded student docs (flattened) */
  listDocuments: (
    params?: { q?: string; cls?: string; section?: string; type?: string; branchId?: string },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.type) query.set("type", params.type);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ documents: StudentDocumentRow[] }>(`/students/documents${qs}`, { signal });
  },

  /** GET /api/students/:id — get single student */
  get: (id: string, signal?: AbortSignal) =>
    request<{ student: StudentItem }>(`/students/${id}`, { signal }),

  /** POST /api/students — create student */
  create: (data: CreateStudentInput) =>
    request<{ student: StudentItem }>("/students", { method: "POST", body: data }),

  /** PATCH /api/students/:id — update student */
  update: (id: string, data: Partial<CreateStudentInput>) =>
    request<{ student: StudentItem }>(`/students/${id}`, { method: "PATCH", body: data }),

  /** DELETE /api/students/:id — delete student */
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/students/${id}`, { method: "DELETE" }),

  /** POST /api/students/promote — batch promote students */
  promote: (data: { studentIds: string[]; newSession: string; newClass: string; newSection: string }) =>
    request<{ count: number; promoted: boolean }>("/students/promote", { method: "POST", body: data }),

  listAdmissionLetters: (params?: { q?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ letters: AdmissionLetterItem[] }>(`/students/admission-letters${qs}`, { signal });
  },

  /** POST /api/students/admission-letters — generate admission letter */
  generateAdmissionLetter: (data: CreateAdmissionLetterInput) =>
    request<{ letter: AdmissionLetterItem }>("/students/admission-letters", { method: "POST", body: data }),

  /** PATCH /api/students/admission-letters/:id/status */
  updateAdmissionLetterStatus: (id: string, status: string) =>
    request<{ letter: AdmissionLetterItem }>(`/students/admission-letters/${id}/status`, { method: "PATCH", body: { status } }),

  /** DELETE /api/students/admission-letters/:id */
  deleteAdmissionLetter: (id: string) =>
    request<{ deleted: boolean }>(`/students/admission-letters/${id}`, { method: "DELETE" }),
};

// ─── FAMILIES ──────────────────────────────────────────────────────────────

export type FamilyItem = {
  id: string;
  familyCode: string;
  guardian: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: "Active" | "Inactive";
  branchId: string | null;
  students: number;
  studentNames: string[];
  classList: string[];
  studentIds: string[];
  billed: number;
  paid: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateFamilyInput = {
  guardian: string;
  familyCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status?: string;
  branchId?: string | null;
};

export const familiesApi = {
  /** GET /api/families */
  list: (params?: { q?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ families: FamilyItem[] }>(`/families${qs}`, { signal });
  },

  /** GET /api/families/:id */
  get: (id: string, signal?: AbortSignal) =>
    request<{ family: FamilyItem }>(`/families/${id}`, { signal }),

  /** POST /api/families */
  create: (data: CreateFamilyInput) =>
    request<{ family: FamilyItem }>("/families", { method: "POST", body: data }),

  /** PATCH /api/families/:id */
  update: (id: string, data: Partial<CreateFamilyInput>) =>
    request<{ family: FamilyItem }>(`/families/${id}`, { method: "PATCH", body: data }),

  /** DELETE /api/families/:id */
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/families/${id}`, { method: "DELETE" }),
};

// ─── ADMISSIONS ────────────────────────────────────────────────────────────

export type AdmissionEnquiryItem = {
  id: string;
  applicant: string;
  guardian: string;
  phone: string;
  cls: string;
  source: string;
  followUp: string;
  counselor: string;
  stage: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateEnquiryInput = Partial<AdmissionEnquiryItem> & { applicant: string; branchId?: string | null };

export const admissionsApi = {
  list: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ enquiries: AdmissionEnquiryItem[] }>(`/admissions${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ enquiry: AdmissionEnquiryItem }>(`/admissions/${id}`, { signal }),
  create: (data: CreateEnquiryInput) => request<{ enquiry: AdmissionEnquiryItem }>("/admissions", { method: "POST", body: data }),
  update: (id: string, data: Partial<CreateEnquiryInput>) => request<{ enquiry: AdmissionEnquiryItem }>(`/admissions/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/admissions/${id}`, { method: "DELETE" }),
};

export type VisitorItem = {
  id: string;
  visitor: string;
  phone: string;
  purpose: string;
  host: string;
  badge: string;
  date: string;
  inTime: string;
  outTime: string;
  status: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateVisitorInput = Partial<VisitorItem> & { visitor: string; branchId?: string | null };

export const visitorsApi = {
  list: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ visitors: VisitorItem[] }>(`/visitors${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ visitor: VisitorItem }>(`/visitors/${id}`, { signal }),
  create: (data: CreateVisitorInput) => request<{ visitor: VisitorItem }>("/visitors", { method: "POST", body: data }),
  update: (id: string, data: Partial<CreateVisitorInput>) => request<{ visitor: VisitorItem }>(`/visitors/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/visitors/${id}`, { method: "DELETE" }),
};


export type NoticeItem = {
  id: string;
  title: string;
  content?: string | null;
  audience: string;
  channel: string;
  type: string;
  date: string;
  reach: number;
  status: string;
  author?: string | null;
  authorId?: string | null;
  cls?: string | null;
  section?: string | null;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const noticesApi = {
  list: (params?: { branchId?: string; author?: string; audience?: string; cls?: string; section?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.author) query.set("author", params.author);
    if (params?.audience) query.set("audience", params.audience);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ notices: NoticeItem[] }>(`/notices${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ notice: NoticeItem }>(`/notices/${id}`, { signal }),
  create: (data: Partial<NoticeItem> & { title: string }) => request<{ notice: NoticeItem }>("/notices", { method: "POST", body: data }),
  update: (id: string, data: Partial<NoticeItem>) => request<{ notice: NoticeItem }>(`/notices/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/notices/${id}`, { method: "DELETE" }),
};

// ─── EVENTS ────────────────────────────────────────────────────────────────

export type EventItem = {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  venue: string;
  audience: string;
  status: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const eventsApi = {
  list: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ events: EventItem[] }>(`/events${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ event: EventItem }>(`/events/${id}`, { signal }),
  create: (data: Partial<EventItem> & { title: string }) => request<{ event: EventItem }>("/events", { method: "POST", body: data }),
  update: (id: string, data: Partial<EventItem>) => request<{ event: EventItem }>(`/events/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/events/${id}`, { method: "DELETE" }),
};

// ─── MEETINGS ──────────────────────────────────────────────────────────────

export type MeetingItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  status: string;
  description: string;
  participants: string[];
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const meetingsApi = {
  list: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ meetings: MeetingItem[] }>(`/meetings${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ meeting: MeetingItem }>(`/meetings/${id}`, { signal }),
  create: (data: Partial<MeetingItem> & { title: string }) => request<{ meeting: MeetingItem }>("/meetings", { method: "POST", body: data }),
  update: (id: string, data: Partial<MeetingItem>) => request<{ meeting: MeetingItem }>(`/meetings/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/meetings/${id}`, { method: "DELETE" }),
};

/** Homework item attachment */
export type HomeworkAttachment = {
  name: string;
  type?: string;
  size?: number;
  /** Cloudinary secure URL (preferred). */
  url?: string;
  publicId?: string;
  /** @deprecated Legacy base64 — no longer accepted by the API. */
  data?: string;
};

/** Homework / Assignment item from API */
export type HomeworkItem = {
  id: string;
  title: string;
  subject: string;
  cls: string;
  section: string;
  teacher: string;
  teacherId?: string | null;
  assigned: string;
  due: string;
  instructions?: string | null;
  status: string;
  submitted: number;
  total: number;
  attachments?: HomeworkAttachment[];
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const homeworkApi = {
  list: (params?: { branchId?: string; teacher?: string; cls?: string; section?: string; status?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.teacher) query.set("teacher", params.teacher);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ homework: HomeworkItem[] }>(`/homework${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ homework: HomeworkItem }>(`/homework/${id}`, { signal }),
  create: (data: Omit<Partial<HomeworkItem>, "id"> & { title: string; subject: string; cls: string; section: string; due: string }) =>
    request<{ homework: HomeworkItem }>("/homework", { method: "POST", body: data }),
  update: (id: string, data: Partial<HomeworkItem>) =>
    request<{ homework: HomeworkItem }>(`/homework/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean; id: string }>(`/homework/${id}`, { method: "DELETE" }),
};

/** Vehicle item from API */
export type VehicleItem = {
  id: string;
  number: string;
  type: string;
  capacity: number;
  driver: string;
  driverPhone?: string | null;
  route?: string | null;
  fitness?: string | null;
  status: string;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const vehiclesApi = {
  list: (params?: { q?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ vehicles: VehicleItem[] }>(`/transport/vehicles${qs}`, { signal });
  },
  listForSelect: (branchId?: string, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (branchId && branchId !== "all") query.set("branchId", branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ vehicles: Pick<VehicleItem, "id" | "number" | "type" | "driver" | "capacity">[] }>(`/transport/vehicles/select${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ vehicle: VehicleItem }>(`/transport/vehicles/${id}`, { signal }),
  create: (data: Partial<VehicleItem> & { number: string; driver: string }) => request<{ vehicle: VehicleItem }>("/transport/vehicles", { method: "POST", body: data }),
  update: (id: string, data: Partial<VehicleItem>) => request<{ vehicle: VehicleItem }>(`/transport/vehicles/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/transport/vehicles/${id}`, { method: "DELETE" }),
};

/** Transport route item from API */
export type TransportRouteItem = {
  id: string;
  name: string;
  stops: number;
  distance?: string | null;
  students: number;
  monthlyFee: number;
  vehicleId?: string | null;
  status: string;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const transportRoutesApi = {
  list: (params?: { q?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ routes: TransportRouteItem[] }>(`/transport/routes${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ route: TransportRouteItem }>(`/transport/routes/${id}`, { signal }),
  create: (data: Partial<TransportRouteItem> & { name: string }) => request<{ route: TransportRouteItem }>("/transport/routes", { method: "POST", body: data }),
  update: (id: string, data: Partial<TransportRouteItem>) => request<{ route: TransportRouteItem }>(`/transport/routes/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/transport/routes/${id}`, { method: "DELETE" }),
};

/** Hostel room item from API */
export type HostelRoomItem = {
  id: string;
  hostel: string;
  room: string;
  type: string;
  beds: number;
  occupied: number;
  warden?: string | null;
  monthlyFee: number;
  status: string;
  residents?: string[];
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const hostelRoomsApi = {
  list: (params?: { q?: string; status?: string; hostel?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.hostel) query.set("hostel", params.hostel);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ rooms: HostelRoomItem[] }>(`/hostel/rooms${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ room: HostelRoomItem }>(`/hostel/rooms/${id}`, { signal }),
  create: (data: Partial<HostelRoomItem> & { hostel: string; room: string }) => request<{ room: HostelRoomItem }>("/hostel/rooms", { method: "POST", body: data }),
  update: (id: string, data: Partial<HostelRoomItem>) => request<{ room: HostelRoomItem }>(`/hostel/rooms/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/hostel/rooms/${id}`, { method: "DELETE" }),
};

/** Timetable slot item from API */
export type TimetableSlotItem = {
  id: string;
  branchId?: string | null;
  cls: string;
  section: string;
  day: string;
  period: number;
  startTime?: string | null;
  endTime?: string | null;
  subject: string;
  teacher: string;
  teacherId?: string | null;
  room?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const timetableApi = {
  list: (params?: { q?: string; branchId?: string; cls?: string; section?: string; teacher?: string; day?: string; period?: number }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.branchId) query.set("branchId", params.branchId);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.teacher) query.set("teacher", params.teacher);
    if (params?.day) query.set("day", params.day);
    if (params?.period) query.set("period", String(params.period));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ slots: TimetableSlotItem[] }>(`/timetable/slots${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ slot: TimetableSlotItem }>(`/timetable/slots/${id}`, { signal }),
  create: (data: Partial<TimetableSlotItem> & { cls: string; section: string; day: string; period: number; subject: string; teacher: string }) =>
    request<{ slot: TimetableSlotItem }>("/timetable/slots", { method: "POST", body: data }),
  update: (id: string, data: Partial<TimetableSlotItem>) => request<{ slot: TimetableSlotItem }>(`/timetable/slots/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/timetable/slots/${id}`, { method: "DELETE" }),
};

/** Attendance status values shared by student + staff registers. */
export type AttendanceStatusValue = "Present" | "Absent" | "Late" | "Leave";

export type StudentAttendanceItem = {
  id: string;
  branchId?: string | null;
  studentId: string;
  student: string;
  studentCode?: string | null;
  cls: string;
  section: string;
  date: string;
  status: AttendanceStatusValue | string;
  remark?: string;
  markedById?: string | null;
  markedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StaffAttendanceItem = {
  id: string;
  branchId?: string | null;
  employeeId: string;
  employee: string;
  employeeCode?: string | null;
  designation?: string;
  department?: string;
  date: string;
  status: AttendanceStatusValue | string;
  inTime?: string;
  outTime?: string;
  remark?: string;
  markedById?: string | null;
  markedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StudentAttendanceRosterRow = {
  studentId: string;
  student: string;
  studentCode?: string | null;
  cls: string;
  section: string;
  branchId?: string | null;
  date: string;
  status: AttendanceStatusValue | string;
  remark?: string;
  attendanceId?: string | null;
  marked: boolean;
};

export type StaffAttendanceRosterRow = {
  employeeId: string;
  employee: string;
  employeeCode?: string | null;
  designation?: string;
  department?: string;
  branchId?: string | null;
  date: string;
  status: AttendanceStatusValue | string;
  inTime?: string;
  outTime?: string;
  remark?: string;
  attendanceId?: string | null;
  marked: boolean;
};

export type ClassSectionOption = {
  label: string;
  cls: string;
  section: string;
  classId: string;
  branchId?: string | null;
  teacherId?: string | null;
  teacher?: string | null;
};

export const attendanceApi = {
  listStudents: (
    params?: {
      branchId?: string;
      date?: string;
      from?: string;
      to?: string;
      cls?: string;
      section?: string;
      studentId?: string;
      status?: string;
    },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.date) query.set("date", params.date);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.studentId) query.set("studentId", params.studentId);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ attendance: StudentAttendanceItem[] }>(`/attendance/students${qs}`, { signal });
  },

  studentRoster: (
    params: { cls: string; section: string; date?: string; branchId?: string },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    query.set("cls", params.cls);
    query.set("section", params.section);
    if (params.date) query.set("date", params.date);
    if (params.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    return request<{
      date: string;
      cls: string;
      section: string;
      roster: StudentAttendanceRosterRow[];
      markedCount: number;
    }>(`/attendance/students/roster?${query.toString()}`, { signal });
  },

  markStudents: (data: {
    date?: string;
    cls: string;
    section: string;
    branchId?: string | null;
    records: Array<{ studentId: string; status: string; remark?: string }>;
  }) =>
    request<{
      date: string;
      cls: string;
      section: string;
      attendance: StudentAttendanceItem[];
    }>("/attendance/students/mark", { method: "POST", body: data }),

  mySections: (signal?: AbortSignal) =>
    request<{ sections: ClassSectionOption[] }>("/attendance/my-sections", { signal }),

  myAttendance: (params?: { from?: string; to?: string; date?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.date) query.set("date", params.date);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ attendance: StudentAttendanceItem[] }>(`/attendance/me${qs}`, { signal });
  },

  listStaff: (
    params?: {
      branchId?: string;
      date?: string;
      from?: string;
      to?: string;
      employeeId?: string;
      status?: string;
    },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.date) query.set("date", params.date);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.employeeId) query.set("employeeId", params.employeeId);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ attendance: StaffAttendanceItem[] }>(`/attendance/staff${qs}`, { signal });
  },

  staffRoster: (params?: { date?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{
      date: string;
      roster: StaffAttendanceRosterRow[];
      markedCount: number;
    }>(`/attendance/staff/roster${qs}`, { signal });
  },

  markStaff: (data: {
    date?: string;
    branchId?: string | null;
    records: Array<{
      employeeId: string;
      status: string;
      inTime?: string;
      outTime?: string;
      remark?: string;
    }>;
  }) =>
    request<{ date: string; attendance: StaffAttendanceItem[] }>("/attendance/staff/mark", {
      method: "POST",
      body: data,
    }),
};

export type LeaveStatusValue = "Pending" | "Approved" | "Rejected";
export type LeaveTypeValue = "Medical" | "Casual" | "Annual" | "Sick";

export type LeaveRequestItem = {
  id: string;
  branchId?: string | null;
  applicantType: "Student" | "Teacher" | string;
  applicantId: string;
  person: string;
  role: string;
  cls?: string | null;
  section?: string | null;
  studentId?: string | null;
  employeeId?: string | null;
  type: LeaveTypeValue | string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatusValue | string;
  reviewedById?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const leaveApi = {
  list: (
    params?: {
      branchId?: string;
      status?: string;
      applicantType?: "Student" | "Teacher";
    },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.status) query.set("status", params.status);
    if (params?.applicantType) query.set("applicantType", params.applicantType);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ leave: LeaveRequestItem[] }>(`/leave${qs}`, { signal });
  },

  mine: (signal?: AbortSignal) =>
    request<{ leave: LeaveRequestItem[] }>("/leave/me", { signal }),

  classStudents: (
    params?: { branchId?: string; status?: string },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ leave: LeaveRequestItem[] }>(`/leave/class-students${qs}`, { signal });
  },

  apply: (data: {
    type: string;
    from: string;
    to: string;
    reason: string;
    branchId?: string | null;
  }) => request<{ leave: LeaveRequestItem }>("/leave", { method: "POST", body: data }),

  review: (id: string, data: { status: "Approved" | "Rejected"; reviewNote?: string }) =>
    request<{ leave: LeaveRequestItem }>(`/leave/${id}/status`, { method: "PATCH", body: data }),
};

export type FeeFrequency = "Monthly" | "Quarterly" | "Annually" | "One-time";
export type FeeInvoiceStatus = "Paid" | "Partially Paid" | "Pending" | "Overdue";

export type FeeParticularItem = {
  id: string;
  branchId?: string | null;
  particular: string;
  description?: string;
  amount: number;
  frequency: FeeFrequency | string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FeeStructureItem = {
  id: string;
  branchId?: string | null;
  session: string;
  cls: string;
  section: string;
  particularId?: string | null;
  particular: string;
  amount: number;
  frequency: FeeFrequency | string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DiscountTypeItem = {
  id: string;
  branchId?: string | null;
  name: string;
  basis: "Percentage" | "Fixed Amount" | string;
  value: number;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FeeInvoiceLine = {
  particularId?: string | null;
  particular: string;
  amount: number;
  frequency?: string;
};

export type FeeInvoiceItem = {
  id: string;
  invoiceNo: string;
  branchId?: string | null;
  studentId?: string | null;
  student: string;
  studentCode?: string | null;
  cls: string;
  section: string;
  period: string;
  issue: string;
  due: string;
  total: number;
  discount: number;
  paid: number;
  balance: number;
  status: FeeInvoiceStatus | string;
  discountTypeId?: string | null;
  discountName?: string | null;
  lines?: FeeInvoiceLine[];
  createdAt?: string;
  updatedAt?: string;
};

export const feesApi = {
  listParticulars: (params?: { q?: string; status?: string; frequency?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.frequency) query.set("frequency", params.frequency);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ particulars: FeeParticularItem[] }>(`/fees/particulars${qs}`, { signal });
  },
  createParticular: (data: Partial<FeeParticularItem> & { particular: string }) =>
    request<{ particular: FeeParticularItem }>("/fees/particulars", { method: "POST", body: data }),
  updateParticular: (id: string, data: Partial<FeeParticularItem>) =>
    request<{ particular: FeeParticularItem }>(`/fees/particulars/${id}`, { method: "PATCH", body: data }),
  deleteParticular: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/fees/particulars/${id}`, { method: "DELETE" }),

  listStructure: (params?: { session?: string; cls?: string; section?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.session) query.set("session", params.session);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ structure: FeeStructureItem[] }>(`/fees/structure${qs}`, { signal });
  },
  createStructureLine: (data: {
    session: string;
    cls: string;
    section: string;
    particular?: string;
    particularId?: string;
    amount?: number;
    frequency?: string;
    dueDate?: string;
    branchId?: string | null;
  }) => request<{ line: FeeStructureItem }>("/fees/structure", { method: "POST", body: data }),
  copyStructure: (data: { session: string; cls: string; fromSection: string; toSection: string }) =>
    request<{ structure: FeeStructureItem[] }>("/fees/structure/copy", { method: "POST", body: data }),
  deleteStructureLine: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/fees/structure/${id}`, { method: "DELETE" }),

  listDiscounts: (params?: { q?: string; basis?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.basis) query.set("basis", params.basis);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ discounts: DiscountTypeItem[] }>(`/fees/discounts${qs}`, { signal });
  },
  createDiscount: (data: Partial<DiscountTypeItem> & { name: string }) =>
    request<{ discount: DiscountTypeItem }>("/fees/discounts", { method: "POST", body: data }),
  updateDiscount: (id: string, data: Partial<DiscountTypeItem>) =>
    request<{ discount: DiscountTypeItem }>(`/fees/discounts/${id}`, { method: "PATCH", body: data }),
  deleteDiscount: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/fees/discounts/${id}`, { method: "DELETE" }),

  listInvoices: (params?: { q?: string; cls?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ invoices: FeeInvoiceItem[] }>(`/fees/invoices${qs}`, { signal });
  },
  createInvoice: (data: {
    studentId?: string;
    student?: string;
    cls?: string;
    section?: string;
    period: string;
    issue?: string;
    due?: string;
    discount?: number;
    discountTypeId?: string;
    particularIds?: string[];
    lines?: FeeInvoiceLine[];
    useStructure?: boolean;
    session?: string;
    branchId?: string | null;
  }) => request<{ invoice: FeeInvoiceItem }>("/fees/invoices", { method: "POST", body: data }),
  updateInvoice: (id: string, data: Partial<FeeInvoiceItem>) =>
    request<{ invoice: FeeInvoiceItem }>(`/fees/invoices/${id}`, { method: "PATCH", body: data }),
  recordPayment: (id: string, data?: { amount?: number }) =>
    request<{ invoice: FeeInvoiceItem }>(`/fees/invoices/${id}/pay`, { method: "POST", body: data || {} }),
  deleteInvoice: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/fees/invoices/${id}`, { method: "DELETE" }),

  getVoucherTemplate: (signal?: AbortSignal) =>
    request<{ template: FeeVoucherTemplate; school: FeeVoucherSchoolInfo }>("/fees/voucher-template", { signal }),

  updateVoucherTemplate: (template: Partial<FeeVoucherTemplate>) =>
    request<{ template: FeeVoucherTemplate; school: FeeVoucherSchoolInfo }>("/fees/voucher-template", {
      method: "PATCH",
      body: template,
    }),
};

export type FeeVoucherTemplate = {
  title: string;
  headerNote: string;
  footerNote: string;
  instructions: string;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNo: string;
  bankBranch: string;
  signatureLeft: string;
  signatureCenter: string;
  signatureRight: string;
  copyBank: string;
  copyStudent: string;
  copySchool: string;
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  showDiscount: boolean;
  showPaidBalance: boolean;
  accentColor: string;
};

export type FeeVoucherSchoolInfo = {
  name: string;
  shortName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  principal?: string | null;
};

export const DEFAULT_FEE_VOUCHER_TEMPLATE: FeeVoucherTemplate = {
  title: "FEE VOUCHER",
  headerNote: "",
  footerNote: "This is a computer-generated fee voucher. Please retain for your records.",
  instructions: "Deposit the amount in the designated bank and submit the school copy at the accounts office.",
  bankName: "",
  bankAccountTitle: "",
  bankAccountNo: "",
  bankBranch: "",
  signatureLeft: "Received By",
  signatureCenter: "Cashier",
  signatureRight: "Authorized Signatory",
  copyBank: "BANK COPY",
  copyStudent: "STUDENT COPY",
  copySchool: "SCHOOL COPY",
  showLogo: true,
  showAddress: true,
  showPhone: true,
  showEmail: true,
  showWebsite: true,
  showDiscount: true,
  showPaidBalance: true,
  accentColor: "#1e3a8a",
};

/** Exam / question-paper module */

export type ExamPaperFile = {
  name: string;
  type?: string;
  size?: number;
  /** Cloudinary secure URL (preferred). */
  url?: string;
  publicId?: string;
  /** @deprecated Legacy base64 — no longer accepted by the API. */
  data?: string;
};

export type ExamItem = {
  id: string;
  branchId?: string | null;
  name: string;
  type: string;
  session: string;
  startDate: string;
  endDate: string;
  paperSubmitFrom?: string;
  paperSubmitTo?: string;
  classes?: string[];
  classesCount?: number;
  status: string;
  notifyNote?: string;
  notifiedAt?: string | null;
  resultAnnounceDate?: string | null;
  publishedAt?: string | null;
  slotsCount?: number;
  submissionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ExamMarkRosterRow = {
  studentId: string;
  student: string;
  studentCode?: string | null;
  cls: string;
  section: string;
  subject: string;
  slotId?: string | null;
  obtained: number | null;
  total: number;
  percentage?: number | null;
  grade?: string | null;
  remark?: string;
  marked: boolean;
  markId?: string | null;
};

export type ExamResultItem = {
  /** Composite key `${examId}-${studentId}` — set by API or client normalize. */
  id: string;
  examId: string;
  exam: string;
  studentId: string;
  student: string;
  studentCode?: string | null;
  cls: string;
  section: string;
  branchId?: string | null;
  subjects: Array<{ subject: string; obtained: number; total: number; grade: string }>;
  obtained: number;
  total: number;
  percentage: number;
  grade: string;
  position: number;
  status: string;
  publishedAt?: string | null;
  resultAnnounceDate?: string | null;
};

export type ExamMarkSubjectOption = {
  slotId: string;
  cls: string;
  section: string;
  subject: string;
  date: string;
  teacherId?: string | null;
  teacherName?: string;
};

export type ExamSlotItem = {
  id: string;
  examId: string;
  exam?: string;
  branchId?: string | null;
  cls: string;
  section?: string;
  subject: string;
  subjectId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  invigilator?: string;
  teacherId?: string | null;
  teacherName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type QuestionPaperSubmissionItem = {
  id: string;
  examId: string;
  exam?: string;
  slotId?: string | null;
  branchId?: string | null;
  cls: string;
  section?: string;
  subject: string;
  teacherId?: string | null;
  teacherName: string;
  employeeId?: string | null;
  status: string;
  note?: string;
  files?: ExamPaperFile[];
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ExamPaperTaskItem = {
  id: string;
  slotId: string;
  examId: string;
  exam: string;
  examType: string;
  examStatus: string;
  session: string;
  cls: string;
  section?: string;
  subject: string;
  paperDate: string;
  startTime: string;
  endTime: string;
  room?: string;
  invigilator?: string;
  paperSubmitFrom?: string;
  paperSubmitTo?: string;
  paperStatus: string;
  submission?: QuestionPaperSubmissionItem | null;
};

export const examsApi = {
  list: (params?: { branchId?: string; status?: string; session?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.status) query.set("status", params.status);
    if (params?.session) query.set("session", params.session);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ exams: ExamItem[] }>(`/exams${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) =>
    request<{
      exam: ExamItem;
      slots: ExamSlotItem[];
      submissions: QuestionPaperSubmissionItem[];
    }>(`/exams/${id}`, { signal }),
  create: (data: {
    name: string;
    type: string;
    session: string;
    startDate: string;
    endDate: string;
    paperSubmitFrom?: string;
    paperSubmitTo?: string;
    classes?: string[] | string;
    notifyNote?: string;
    notify?: boolean;
    notifyTeachers?: boolean;
    status?: string;
    branchId?: string | null;
  }) => request<{ exam: ExamItem }>("/exams", { method: "POST", body: data }),
  update: (id: string, data: Partial<ExamItem>) =>
    request<{ exam: ExamItem }>(`/exams/${id}`, { method: "PATCH", body: data }),
  notify: (id: string, data?: { notifyNote?: string }) =>
    request<{ exam: ExamItem }>(`/exams/${id}/notify`, { method: "POST", body: data || {} }),
  delete: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/exams/${id}`, { method: "DELETE" }),

  listSlots: (params?: { examId?: string; branchId?: string; cls?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.examId) query.set("examId", params.examId);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.cls) query.set("cls", params.cls);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ slots: ExamSlotItem[] }>(`/exams/slots${qs}`, { signal });
  },
  createSlot: (data: {
    examId: string;
    cls: string;
    section?: string;
    subject: string;
    subjectId?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    room?: string;
    invigilator?: string;
    teacherId?: string | null;
    teacherName?: string;
    branchId?: string | null;
  }) => request<{ slot: ExamSlotItem }>("/exams/slots", { method: "POST", body: data }),
  updateSlot: (id: string, data: Partial<ExamSlotItem>) =>
    request<{ slot: ExamSlotItem }>(`/exams/slots/${id}`, { method: "PATCH", body: data }),
  deleteSlot: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/exams/slots/${id}`, { method: "DELETE" }),

  listSubmissions: (params?: { examId?: string; branchId?: string; status?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.examId) query.set("examId", params.examId);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ submissions: QuestionPaperSubmissionItem[] }>(`/exams/submissions${qs}`, { signal });
  },
  reviewSubmission: (id: string, data: { status: "Approved" | "Rejected" | "Submitted"; note?: string }) =>
    request<{ submission: QuestionPaperSubmissionItem }>(`/exams/submissions/${id}`, {
      method: "PATCH",
      body: data,
    }),

  myPapers: (signal?: AbortSignal) =>
    request<{ tasks: ExamPaperTaskItem[]; exams: ExamItem[] }>("/exams/my-papers", { signal }),
  submitPaper: (data: {
    examId: string;
    slotId?: string;
    cls?: string;
    section?: string;
    subject?: string;
    note?: string;
    files: ExamPaperFile[];
    teacherName?: string;
    teacherId?: string;
  }) => request<{ submission: QuestionPaperSubmissionItem }>("/exams/papers", { method: "POST", body: data }),

  listMarkSubjects: (examId: string, signal?: AbortSignal) =>
    request<{ subjects: ExamMarkSubjectOption[] }>(`/exams/${examId}/mark-subjects`, { signal }),

  marksRoster: (
    examId: string,
    params: { cls: string; section: string; subject: string; branchId?: string },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    query.set("cls", params.cls);
    query.set("section", params.section);
    query.set("subject", params.subject);
    if (params.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    return request<{
      exam: Pick<ExamItem, "id" | "name" | "type" | "session" | "status" | "resultAnnounceDate" | "publishedAt">;
      cls: string;
      section: string;
      subject: string;
      slotId?: string | null;
      roster: ExamMarkRosterRow[];
      markedCount: number;
    }>(`/exams/${examId}/marks/roster?${query.toString()}`, { signal });
  },

  saveMarks: (
    examId: string,
    data: {
      cls: string;
      section: string;
      subject: string;
      slotId?: string;
      records: Array<{ studentId: string; obtained: number; total?: number; grade?: string; remark?: string }>;
    }
  ) =>
    request<{ examId: string; cls: string; section: string; subject: string; marks: unknown[] }>(
      `/exams/${examId}/marks`,
      { method: "POST", body: data }
    ),

  listResults: async (
    params?: { examId?: string; cls?: string; section?: string; branchId?: string; publishedOnly?: boolean },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params?.examId) query.set("examId", params.examId);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.publishedOnly) query.set("publishedOnly", "true");
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await request<{ results: ExamResultItem[] }>(`/exams/results${qs}`, { signal });
    return {
      results: (res.results ?? []).map((r) => ({
        ...r,
        id: r.id || `${r.examId}-${r.studentId}`,
      })),
    };
  },

  myResults: async (signal?: AbortSignal) => {
    const res = await request<{ results: ExamResultItem[] }>("/exams/results/me", { signal });
    return {
      results: (res.results ?? []).map((r) => ({
        ...r,
        id: r.id || `${r.examId}-${r.studentId}`,
      })),
    };
  },

  verify: (examId: string) =>
    request<{ exam: ExamItem }>(`/exams/${examId}/verify`, { method: "POST", body: {} }),

  publish: (examId: string, data?: { resultAnnounceDate?: string; sendEmail?: boolean }) =>
    request<{
      exam: Pick<ExamItem, "id" | "name" | "status" | "publishedAt" | "resultAnnounceDate">;
      studentsNotified: number;
      emailsSent: number;
    }>(`/exams/${examId}/publish`, { method: "POST", body: data || {} }),
};

// ─── SCHOOL RULES & REGULATIONS ─────────────────────────────────────────────

export type RuleAudience = "Teachers" | "Students" | "Both";
export type RuleStatus = "Active" | "Inactive";

export type SchoolRuleItem = {
  id: string;
  title: string;
  body: string;
  audience: RuleAudience | string;
  status: RuleStatus | string;
  branchId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export const rulesApi = {
  list: (
    params?: {
      branchId?: string;
      audience?: RuleAudience | string;
      /** Portal filter: teacher → Teachers+Both (Active); student → Students+Both (Active). */
      panel?: "teacher" | "student";
      status?: RuleStatus | string;
      q?: string;
    },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.audience) query.set("audience", params.audience);
    if (params?.panel) query.set("panel", params.panel);
    if (params?.status) query.set("status", params.status);
    if (params?.q) query.set("q", params.q);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ rules: SchoolRuleItem[] }>(`/rules${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) =>
    request<{ rule: SchoolRuleItem }>(`/rules/${id}`, { signal }),
  create: (data: {
    title: string;
    body: string;
    audience?: RuleAudience | string;
    status?: RuleStatus | string;
    branchId?: string | null;
  }) => request<{ rule: SchoolRuleItem }>("/rules", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      title: string;
      body: string;
      audience: RuleAudience | string;
      status: RuleStatus | string;
      branchId: string | null;
    }>
  ) => request<{ rule: SchoolRuleItem }>(`/rules/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/rules/${id}`, { method: "DELETE" }),
};

// ─── PAYROLL ────────────────────────────────────────────────────────────────

export type PayrollStatus = "Draft" | "Approved" | "Paid";

export type SalaryStructureItem = {
  id: string;
  branchId: string | null;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  basic: number;
  houseRent: number;
  transport: number;
  medical: number;
  otherAllow: number;
  allowances: number;
  tax: number;
  providentFund: number;
  otherDeduct: number;
  deductions: number;
  gross: number;
  net: number;
  effectiveFrom: string | null;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PayrollRunItem = {
  id: string;
  branchId: string | null;
  month: string;
  title: string;
  status: PayrollStatus | string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  notes: string;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayslipItem = {
  id: string;
  branchId: string | null;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  month: string;
  basic: number;
  houseRent: number;
  transport: number;
  medical: number;
  otherAllow: number;
  allowances: number;
  tax: number;
  providentFund: number;
  otherDeduct: number;
  deductions: number;
  gross: number;
  net: number;
  status: PayrollStatus | string;
  note: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SalaryAmountInput = {
  basic?: number;
  houseRent?: number;
  transport?: number;
  medical?: number;
  otherAllow?: number;
  tax?: number;
  providentFund?: number;
  otherDeduct?: number;
};

export const payrollApi = {
  listStructures: (params?: { branchId?: string; status?: string; q?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.status) query.set("status", params.status);
    if (params?.q) query.set("q", params.q);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ structures: SalaryStructureItem[] }>(`/payroll/structures${qs}`, { signal });
  },
  upsertStructure: (
    data: SalaryAmountInput & {
      employeeId: string;
      branchId?: string | null;
      effectiveFrom?: string | null;
      status?: string;
      notes?: string;
    }
  ) => request<{ structure: SalaryStructureItem }>("/payroll/structures", { method: "POST", body: data }),
  updateStructure: (id: string, data: Partial<SalaryAmountInput & { status: string; notes: string; effectiveFrom: string | null; branchId: string | null }>) =>
    request<{ structure: SalaryStructureItem }>(`/payroll/structures/${id}`, { method: "PATCH", body: data }),
  deleteStructure: (id: string) =>
    request<{ deleted: boolean }>(`/payroll/structures/${id}`, { method: "DELETE" }),

  listRuns: (params?: { branchId?: string; status?: string; month?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.status) query.set("status", params.status);
    if (params?.month) query.set("month", params.month);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ runs: PayrollRunItem[] }>(`/payroll/runs${qs}`, { signal });
  },
  getRun: (id: string, signal?: AbortSignal) =>
    request<{ run: PayrollRunItem; payslips: PayslipItem[] }>(`/payroll/runs/${id}`, { signal }),
  createRun: (data: { month: string; branchId?: string | null; title?: string; notes?: string }) =>
    request<{ run: PayrollRunItem }>("/payroll/runs", { method: "POST", body: data }),
  generate: (id: string) =>
    request<{ run: PayrollRunItem }>(`/payroll/runs/${id}/generate`, { method: "POST", body: {} }),
  approve: (id: string) =>
    request<{ run: PayrollRunItem }>(`/payroll/runs/${id}/approve`, { method: "POST", body: {} }),
  pay: (id: string) =>
    request<{ run: PayrollRunItem }>(`/payroll/runs/${id}/pay`, { method: "POST", body: {} }),
  deleteRun: (id: string) =>
    request<{ deleted: boolean }>(`/payroll/runs/${id}`, { method: "DELETE" }),

  listPayslips: (params?: { runId?: string; branchId?: string; month?: string; status?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.runId) query.set("runId", params.runId);
    if (params?.branchId && params.branchId !== "all") query.set("branchId", params.branchId);
    if (params?.month) query.set("month", params.month);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ payslips: PayslipItem[] }>(`/payroll/payslips${qs}`, { signal });
  },
  updatePayslip: (id: string, data: Partial<SalaryAmountInput & { note: string }>) =>
    request<{ payslip: PayslipItem }>(`/payroll/payslips/${id}`, { method: "PATCH", body: data }),

  mine: (signal?: AbortSignal) =>
    request<{
      employee: {
        id: string;
        name: string;
        employeeCode: string;
        designation: string;
        department: string;
      };
      payslips: PayslipItem[];
    }>("/payroll/me", { signal }),
};

// ─── ACCOUNTING ─────────────────────────────────────────────────────────────

export type AccType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";
export type AccStatus = "Active" | "Inactive";

export type AccountItem = {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  type: AccType;
  parent: string;
  status: AccStatus;
  isActive: boolean;
  isSystem: boolean;
  openingBalance: number;
  balance: number;
};

export type CreateAccountInput = {
  code: string;
  name: string;
  type: AccType;
  parent?: string;
  status?: AccStatus;
  openingBalance?: number;
};

export type JournalLineItem = {
  id?: string;
  accountId: string;
  account?: string;
  accountCode?: string;
  description?: string;
  debit: number;
  credit: number;
};

export type JournalEntryItem = {
  id: string;
  no: string;
  date: string;
  description: string;
  reference: string;
  status: "Draft" | "Posted" | "Cancelled";
  notes?: string;
  by: string;
  postedAt?: string | null;
  reversedFromId?: string | null;
  branchId?: string | null;
  lines: JournalLineItem[];
  debit: number;
  credit: number;
};

export type CreateJournalInput = {
  date?: string;
  description: string;
  reference?: string;
  notes?: string;
  status?: "Draft" | "Posted";
  branchId?: string | null;
  lines: { accountId: string; description?: string; debit: number; credit: number }[];
};

export type VoucherItem = {
  id: string;
  no: string;
  kind: "Receipt" | "Payment";
  date: string;
  party: string;
  accountId: string;
  account: string;
  accountCode: string;
  accountType: string;
  amount: number;
  method: "Cash" | "Bank" | "Cheque" | "Online" | string;
  cashBankAccountId?: string | null;
  cashBankAccount?: string;
  cashBankAccountNumber?: string;
  reference: string;
  status: "Draft" | "Posted" | "Cancelled";
  journalEntryId?: string | null;
  branchId?: string | null;
};

export type CreateVoucherInput = {
  kind: "Receipt" | "Payment";
  party: string;
  accountId?: string;
  account?: string;
  amount: number;
  method?: string;
  reference?: string;
  status?: "Draft" | "Posted";
  cashBankAccountId?: string;
  date?: string;
  branchId?: string | null;
};

export type GeneralLedgerRow = {
  date: string;
  reference: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number;
};

export type GeneralLedgerResponse = {
  account: { id: string; code: string; name: string; type: string } | null;
  opening: number;
  rows: GeneralLedgerRow[];
  totalDebit: number;
  totalCredit: number;
  closing: number;
};

export type AccountStatementRow = {
  id: string;
  date: string;
  ref: string;
  description: string;
  category: string;
  type: string;
  income: number;
  expense: number;
  balance: number;
};

export type AccountStatementResponse = {
  rows: AccountStatementRow[];
  totalIncome: number;
  totalExpense: number;
  net: number;
};

export type TrialBalanceRow = {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
};

export type TrialBalanceResponse = {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
  balanced: boolean;
};

export type ReportLine = {
  name: string;
  amount: number;
};

export type ProfitLossResponse = {
  income: ReportLine[];
  expenses: ReportLine[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
};

export type BalanceSheetResponse = {
  assets: ReportLine[];
  liabilities: ReportLine[];
  equity: ReportLine[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  balanced: boolean;
};

export type CashFlowSection = {
  title: string;
  lines: ReportLine[];
  net: number;
};

export type CashFlowResponse = {
  opening: number;
  sections: CashFlowSection[];
  netTotal: number;
  closing: number;
};

export type CashBankAccountItem = {
  id: string;
  name: string;
  number: string;
  kind: "Cash" | "Bank";
  isActive: boolean;
  accountId: string;
  accountCode?: string;
  balance: number;
  branchId?: string | null;
};

export type BankTransactionItem = {
  id: string;
  bankAccountId: string;
  bankAccountName?: string;
  date: string;
  reference: string;
  description: string;
  book: number;
  bank: number;
  status: "Matched" | "Unmatched";
  branchId?: string | null;
};

export type CashBankSummaryResponse = {
  accounts: CashBankAccountItem[];
  cash: number;
  bank: number;
  total: number;
};

export type ReconciliationSummaryResponse = {
  account?: CashBankAccountItem;
  bookBalance: number;
  statementBalance: number;
  difference: number;
  matchedCount: number;
  unmatchedCount: number;
  txns: BankTransactionItem[];
};

export type BudgetItem = {
  id: string;
  name: string;
  year: string;
  department: string;
  budget: number;
  actual: number;
  remaining: number;
  status: "Active" | "Inactive" | "Completed" | "Over Budget";
  branchId?: string | null;
};

export type CreateBudgetInput = {
  name: string;
  department: string;
  year: string;
  budget: number;
  actual?: number;
  status?: string;
  branchId?: string | null;
};

export type ReceivableItem = {
  id: string;
  student: string;
  sid: string;
  cls: string;
  section: string;
  invoice: string;
  dueDate: string;
  total: number;
  discount: number;
  net: number;
  paid: number;
  outstanding: number;
  status: "Paid" | "Partial" | "Pending" | "Overdue";
};

export type ReceivablesResponse = {
  rows: ReceivableItem[];
  summary: {
    total: number;
    currentDue: number;
    overdue: number;
    collected: number;
    totalCount: number;
  };
};

export type AccountsDashboardResponse = {
  kpis: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    cash: number;
    bank: number;
    totalAvailable: number;
    collectedFees: number;
    pendingFees: number;
  };
  incomeCats: { label: string; value: number }[];
  expenseCats: { label: string; value: number }[];
  recentVouchers: VoucherItem[];
  recentJournals: {
    id: string;
    no: string;
    date: string;
    description: string;
    status: string;
    debit: number;
    credit: number;
  }[];
};

export const accountsApi = {
  // Dashboard
  getDashboard: (params?: { branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<AccountsDashboardResponse>(`/accounts/dashboard${q}`, { signal });
  },

  // Chart of Accounts
  listAccounts: (params?: { type?: string; status?: string }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ accounts: AccountItem[] }>(`/accounts/chart${q}`, { signal });
  },
  getAccount: (id: string, signal?: AbortSignal) =>
    request<{ account: AccountItem }>(`/accounts/chart/${id}`, { signal }),
  createAccount: (data: CreateAccountInput) =>
    request<{ account: AccountItem }>("/accounts/chart", { method: "POST", body: data }),
  updateAccount: (id: string, data: Partial<CreateAccountInput>) =>
    request<{ account: AccountItem }>(`/accounts/chart/${id}`, { method: "PATCH", body: data }),
  deleteAccount: (id: string) =>
    request<{ deleted: boolean }>(`/accounts/chart/${id}`, { method: "DELETE" }),
  seedDefaults: () =>
    request<{ accounts: AccountItem[] }>("/accounts/chart/seed", { method: "POST" }),

  // Journal Entries
  listJournals: (params?: { status?: string; from?: string; to?: string; q?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.q) qs.set("q", params.q);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ entries: JournalEntryItem[] }>(`/accounts/journals${q}`, { signal });
  },
  getJournal: (id: string, signal?: AbortSignal) =>
    request<{ entry: JournalEntryItem }>(`/accounts/journals/${id}`, { signal }),
  createJournal: (data: CreateJournalInput) =>
    request<{ entry: JournalEntryItem }>("/accounts/journals", { method: "POST", body: data }),
  updateJournal: (id: string, data: Partial<CreateJournalInput>) =>
    request<{ entry: JournalEntryItem }>(`/accounts/journals/${id}`, { method: "PATCH", body: data }),
  postJournal: (id: string) =>
    request<{ entry: JournalEntryItem }>(`/accounts/journals/${id}/post`, { method: "POST" }),
  cancelJournal: (id: string) =>
    request<{ entry: JournalEntryItem }>(`/accounts/journals/${id}/cancel`, { method: "POST" }),
  reverseJournal: (id: string) =>
    request<{ entry: JournalEntryItem }>(`/accounts/journals/${id}/reverse`, { method: "POST" }),
  deleteJournal: (id: string) =>
    request<{ deleted: boolean }>(`/accounts/journals/${id}`, { method: "DELETE" }),

  // Vouchers
  listVouchers: (params?: { kind?: string; status?: string; accountId?: string; from?: string; to?: string; q?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set("kind", params.kind);
    if (params?.status) qs.set("status", params.status);
    if (params?.accountId) qs.set("accountId", params.accountId);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.q) qs.set("q", params.q);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ vouchers: VoucherItem[] }>(`/accounts/vouchers${q}`, { signal });
  },
  getVoucher: (id: string, signal?: AbortSignal) =>
    request<{ voucher: VoucherItem }>(`/accounts/vouchers/${id}`, { signal }),
  createVoucher: (data: CreateVoucherInput) =>
    request<{ voucher: VoucherItem }>("/accounts/vouchers", { method: "POST", body: data }),
  postVoucher: (id: string) =>
    request<{ voucher: VoucherItem }>(`/accounts/vouchers/${id}/post`, { method: "POST" }),
  cancelVoucher: (id: string) =>
    request<{ voucher: VoucherItem }>(`/accounts/vouchers/${id}/cancel`, { method: "POST" }),
  deleteVoucher: (id: string) =>
    request<{ deleted: boolean }>(`/accounts/vouchers/${id}`, { method: "DELETE" }),

  // Ledgers & Reports
  getGeneralLedger: (params?: { accountId?: string; from?: string; to?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set("accountId", params.accountId);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<GeneralLedgerResponse>(`/accounts/ledger${q}`, { signal });
  },
  getStatement: (params?: { from?: string; to?: string; type?: string; q?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.type) qs.set("type", params.type);
    if (params?.q) qs.set("q", params.q);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<AccountStatementResponse>(`/accounts/statement${q}`, { signal });
  },
  getTrialBalance: (params?: { from?: string; to?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<TrialBalanceResponse>(`/accounts/trial-balance${q}`, { signal });
  },
  getProfitLoss: (params?: { from?: string; to?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<ProfitLossResponse>(`/accounts/profit-loss${q}`, { signal });
  },
  getBalanceSheet: (params?: { asOf?: string; from?: string; to?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.asOf) qs.set("asOf", params.asOf);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<BalanceSheetResponse>(`/accounts/balance-sheet${q}`, { signal });
  },
  getCashFlow: (params?: { from?: string; to?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<CashFlowResponse>(`/accounts/cash-flow${q}`, { signal });
  },

  // Cash & Bank
  getCashBankSummary: (params?: { branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<CashBankSummaryResponse>(`/accounts/cash-bank${q}`, { signal });
  },
  listBankAccounts: (params?: { branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ accounts: CashBankAccountItem[] }>(`/accounts/bank-accounts${q}`, { signal });
  },
  createBankAccount: (data: { name: string; number?: string; kind?: "Cash" | "Bank"; accountId?: string; openingBalance?: number; branchId?: string | null }) =>
    request<{ account: CashBankAccountItem }>("/accounts/bank-accounts", { method: "POST", body: data }),
  listBankTransactions: (params?: { bankAccountId?: string; status?: string; from?: string; to?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.bankAccountId) qs.set("bankAccountId", params.bankAccountId);
    if (params?.status) qs.set("status", params.status);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ txns: BankTransactionItem[] }>(`/accounts/bank-transactions${q}`, { signal });
  },
  createBankTransaction: (data: { bankAccountId: string; date?: string; reference?: string; description?: string; book?: number; bank?: number; status?: string; branchId?: string | null }) =>
    request<{ txn: BankTransactionItem }>("/accounts/bank-transactions", { method: "POST", body: data }),
  updateBankTransactionStatus: (id: string, status?: "Matched" | "Unmatched") =>
    request<{ id: string; status: string }>(`/accounts/bank-transactions/${id}/status`, { method: "PATCH", body: { status } }),
  markAllMatched: (bankAccountId?: string) =>
    request<{ matchedCount: number }>("/accounts/bank-transactions/mark-all-matched", { method: "POST", body: { bankAccountId } }),
  getReconciliationSummary: (params?: { bankAccountId?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.bankAccountId) qs.set("bankAccountId", params.bankAccountId);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<ReconciliationSummaryResponse>(`/accounts/bank-reconciliation${q}`, { signal });
  },

  // Budgets
  listBudgets: (params?: { year?: string; status?: string; department?: string; q?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.year) qs.set("year", params.year);
    if (params?.status) qs.set("status", params.status);
    if (params?.department) qs.set("department", params.department);
    if (params?.q) qs.set("q", params.q);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ budgets: BudgetItem[] }>(`/accounts/budgets${q}`, { signal });
  },
  createBudget: (data: CreateBudgetInput) =>
    request<{ budget: BudgetItem }>("/accounts/budgets", { method: "POST", body: data }),
  updateBudget: (id: string, data: Partial<CreateBudgetInput>) =>
    request<{ budget: BudgetItem }>(`/accounts/budgets/${id}`, { method: "PATCH", body: data }),
  deleteBudget: (id: string) =>
    request<{ deleted: boolean }>(`/accounts/budgets/${id}`, { method: "DELETE" }),

  // Fee Receivables
  listReceivables: (params?: { q?: string; status?: string; cls?: string; section?: string; branchId?: string | null }, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) qs.set("status", params.status);
    if (params?.cls) qs.set("cls", params.cls);
    if (params?.section) qs.set("section", params.section);
    if (params?.branchId && params.branchId !== "all") qs.set("branchId", params.branchId);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return request<ReceivablesResponse>(`/accounts/receivables${q}`, { signal });
  },
  collectFee: (id: string, data: { amount?: number; method?: string; cashBankAccountId?: string; branchId?: string | null }) =>
    request<{ invoice: any; voucher: VoucherItem }>(`/accounts/receivables/${id}/pay`, { method: "POST", body: data }),
};

// ─── ASSETS ──────────────────────────────────────────────────────────────────

export type AssetItem = {
  id: string;
  branchId: string | null;
  name: string;
  category: string;
  tag: string;
  purchaseDate: string;
  cost: number;
  location: string;
  assignee: string;
  warranty: string;
  status: string;
  notes: string;
  voucherId?: string | null;
  voucherNo?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAssetInput = {
  name: string;
  category: string;
  tag?: string;
  purchaseDate?: string;
  cost?: number;
  location?: string;
  assignee?: string;
  warranty?: string;
  status?: string;
  notes?: string;
  branchId?: string;
  /** When true (default) and cost > 0, posts a Payment voucher to Fixed Assets. */
  postToAccounts?: boolean;
  method?: string;
  cashBankAccountId?: string;
  accountId?: string;
  supplier?: string;
};

export const assetsApi = {
  list: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ assets: AssetItem[] }>(`/assets${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ asset: AssetItem }>(`/assets/${id}`, { signal }),
  create: (data: CreateAssetInput) => request<{ asset: AssetItem }>("/assets", { method: "POST", body: data }),
  update: (id: string, data: Partial<CreateAssetInput>) => request<{ asset: AssetItem }>(`/assets/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request<{ deleted: boolean }>(`/assets/${id}`, { method: "DELETE" }),
};

// ─── INVENTORY ───────────────────────────────────────────────────────────────

export type InventoryItem = {
  id: string;
  branchId: string | null;
  item: string;
  category: string;
  qty: number;
  unit: string;
  reorder: number;
  supplier: string;
  value: number;
  status: string;
  voucherId?: string | null;
  voucherNo?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryInput = {
  item: string;
  category: string;
  qty?: number;
  unit?: string;
  reorder?: number;
  supplier?: string;
  value?: number;
  branchId?: string;
  /** When true (default) and value > 0, posts a Payment voucher to Inventory Stock. */
  postToAccounts?: boolean;
  method?: string;
  cashBankAccountId?: string;
  accountId?: string;
};

export type AdjustInventoryInput = {
  delta: number;
  amount?: number;
  unitCost?: number;
  postToAccounts?: boolean;
  method?: string;
  cashBankAccountId?: string;
  accountId?: string;
  supplier?: string;
};

export const inventoryApi = {
  list: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ items: InventoryItem[] }>(`/inventory${qs}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ item: InventoryItem }>(`/inventory/${id}`, { signal }),
  create: (data: CreateInventoryInput) => request<{ item: InventoryItem }>("/inventory", { method: "POST", body: data }),
  update: (id: string, data: Partial<CreateInventoryInput>) => request<{ item: InventoryItem }>(`/inventory/${id}`, { method: "PATCH", body: data }),
  adjustStock: (id: string, data: AdjustInventoryInput | number) => {
    const body = typeof data === "number" ? { delta: data } : data;
    return request<{ item: InventoryItem }>(`/inventory/${id}/adjust`, { method: "POST", body });
  },
  delete: (id: string) => request<{ deleted: boolean }>(`/inventory/${id}`, { method: "DELETE" }),
};
