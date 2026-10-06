/* ============================================================================
   BisonsEduCore360 — API client for bisonseducore360_backend
   ---------------------------------------------------------------------------
   The API is a separate Express project (../bisonseducore360_backend). All
   calls go over `fetch` with `credentials: "include"`, because the session
   travels in the httpOnly `bisons_session` cookie the API sets — no token is
   ever stored anywhere JavaScript can read it.

   Every endpoint answers with the same envelope (backend src/utils/response.js):

     success → { success: true,  message, data, meta? }
     failure → { success: false, message, errors?, code? }

   `request()` unwraps `data` on success and throws a typed `ApiError` on
   failure, so components never have to inspect the envelope themselves.
   ========================================================================== */

import type { ApiResult, AuthResponse, MeResponse, RegisterSchoolInput } from "./types";

/**
 * Base URL of the API, including the `/api` prefix. Configure it in
 * `.env.local` (see `.env.example`):
 *
 *   NEXT_PUBLIC_API_URL=http://localhost:5000/api
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

/** The backend's shared response envelope. */
type Envelope<T> = {
  success: boolean;
  message?: string;
  data?: T | null;
  errors?: string[] | null;
  code?: string | null;
};

/** A failed (or unreachable) API call, normalised for the UI. */
export class ApiError extends Error {
  /** Machine-readable code from the API, e.g. `INVALID_CREDENTIALS`. */
  readonly code: string;
  readonly status: number;
  /** Per-field validation messages (HTTP 400 responses only). */
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

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // Send the session cookie and accept the one the API may set back.
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch {
    // Network failure or a CORS rejection — the API never answered.
    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Please make sure the backend is running.`,
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
    throw new ApiError(
      payload?.message || `The request failed (HTTP ${response.status}).`,
      payload?.code || "REQUEST_FAILED",
      response.status,
      Array.isArray(payload?.errors) ? payload.errors : []
    );
  }

  return (payload.data ?? null) as T;
}

/** Normalise anything thrown by this client into a message + field errors. */
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
  logoUrl?: string;
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
  role: string;
  panel: string;
  status: "Active" | "Inactive";
  isActive: boolean;
  lastLogin: string;
  lastLoginAt?: string;
  createdAt: string;
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
  create: (data: { name: string; email: string; role: string; status?: string; password?: string }) =>
    request<{ user: UserAccount }>("/users", { method: "POST", body: data }),
  update: (id: string, data: Partial<{ name: string; email: string; role: string; status: string; isActive: boolean }>) =>
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
  /** GET /api/classes — list all classes (with optional filters). */
  list: (params?: { q?: string; section?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.section) query.set("section", params.section);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ classes: ClassItem[] }>(`/classes${qs}`, { signal });
  },

  /** GET /api/classes/teachers — active employees that can be class teachers. */
  listTeachers: (branchId?: string, signal?: AbortSignal) => {
    const qs = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
    return request<{ teachers: TeacherOption[] }>(`/classes/teachers${qs}`, { signal });
  },

  /** GET /api/classes/:id — single class details. */
  get: (id: string, signal?: AbortSignal) =>
    request<{ class: ClassItem }>(`/classes/${id}`, { signal }),

  /** POST /api/classes — create a new class. */
  create: (data: CreateClassInput) =>
    request<{ class: ClassItem }>("/classes", { method: "POST", body: data }),

  /** PATCH /api/classes/:id — update a class (partial). */
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
  listAssignments: (params?: { q?: string; cls?: string; section?: string; status?: string; branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.cls) query.set("cls", params.cls);
    if (params?.section) query.set("section", params.section);
    if (params?.status) query.set("status", params.status);
    if (params?.branchId) query.set("branchId", params.branchId);
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
  address?: string;
  prevSchool?: string;
  medical?: string;
  notes?: string;
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

  /** GET /api/students/admission-letters — list admission letters */
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

// ─── VISITORS ──────────────────────────────────────────────────────────────

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

// ─── NOTICES ───────────────────────────────────────────────────────────────

export type NoticeItem = {
  id: string;
  title: string;
  audience: string;
  channel: string;
  type: string;
  date: string;
  reach: number;
  status: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const noticesApi = {
  list: (params?: { branchId?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.set("branchId", params.branchId);
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

