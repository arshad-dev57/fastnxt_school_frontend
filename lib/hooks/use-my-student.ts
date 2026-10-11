"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { describeApiError, studentsApi, type StudentItem } from "@/lib/auth/api-client";

/** Load the Student row linked to the signed-in portal user. */
export function useMyStudent() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user || user.panel !== "student") {
      setStudent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await studentsApi.me();
      setStudent(res.student);
    } catch (err) {
      setStudent(null);
      setError(describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const scopeLabel = student ? `${student.cls}-${student.section}` : user?.name || "Student";

  return { student, loading, error, reload, scopeLabel };
}
