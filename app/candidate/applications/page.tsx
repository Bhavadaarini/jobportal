"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ClipboardList,
  Briefcase,
  Wrench,
  Languages,
} from "lucide-react";

import CandidatePortalShell from "@/components/candidate/CandidatePortalShell";

import {
  createClient,
} from "@/lib/supabase/client";

// ===========================================================
// TYPES
// ===========================================================

type Candidate = {
  id: string;
  full_name: string;
  email: string;
};

type Company = {
  company_name: string;
};

type Job = {
  job_title: string;
  job_type: string;
  job_category: string;
  status: string;
  expires_at: string;

  companies:
    | Company
    | null;
};

type Application = {
  id: string;
  status: string;
  skills: string;
  languages_known: string;
  applied_at: string;

  jobs:
    | Job
    | null;
};

// ===========================================================
// PAGE
// ===========================================================

export default function CandidateApplicationsPage() {
  const router =
    useRouter();

  const [
    candidate,
    setCandidate,
  ] =
    useState<Candidate | null>(
      null
    );

  const [
    applications,
    setApplications,
  ] =
    useState<Application[]>(
      []
    );

  /*
   * Store the current time here instead of
   * calling Date.now() during rendering.
   */
  const [
    currentTime,
    setCurrentTime,
  ] =
    useState<number>(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadApplications =
      async () => {
        const supabase =
          createClient();

        try {
          setLoading(true);
          setError("");

          // ===================================================
          // CURRENT TIME
          // Safe because this runs inside useEffect
          // ===================================================

          const now =
            Date.now();

          // ===================================================
          // AUTH
          // ===================================================

          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase.auth
              .getUser();

          if (userError) {
            throw userError;
          }

          if (!user) {
            router.replace(
              "/candidate/login"
            );

            return;
          }

          // ===================================================
          // CANDIDATE
          // ===================================================

          const {
            data:
              candidateData,
            error:
              candidateError,
          } = await supabase
            .from(
              "candidates"
            )
            .select(`
              id,
              full_name,
              email
            `)
            .eq(
              "user_id",
              user.id
            )
            .maybeSingle();

          if (
            candidateError
          ) {
            throw candidateError;
          }

          if (
            !candidateData
          ) {
            throw new Error(
              "Candidate profile not found."
            );
          }

          // ===================================================
          // APPLICATIONS
          //
          // applications
          //      ↓
          // jobs
          //      ↓
          // companies
          // ===================================================

          const {
            data,
            error:
              applicationError,
          } = await supabase
            .from(
              "applications"
            )
            .select(`
              id,
              status,
              skills,
              languages_known,
              applied_at,

              jobs (
                job_title,
                job_type,
                job_category,
                status,
                expires_at,

                companies (
                  company_name
                )
              )
            `)
            .eq(
              "candidate_id",
              candidateData.id
            )
            .order(
              "applied_at",
              {
                ascending:
                  false,
              }
            );

          if (
            applicationError
          ) {
            throw applicationError;
          }

          // ===================================================
          // FORMAT DATA
          // ===================================================

          const formatted:
            Application[] =
            (
              data ?? []
            ).map(
              (item) => {
                const row =
                  item as unknown as {
                    id: string;

                    status:
                      string;

                    skills:
                      string | null;

                    languages_known:
                      string | null;

                    applied_at:
                      string;

                    jobs:
                      | Job
                      | null;
                  };

                return {
                  id:
                    row.id,

                  status:
                    row.status,

                  skills:
                    row.skills ??
                    "",

                  languages_known:
                    row.languages_known ??
                    "",

                  applied_at:
                    row.applied_at,

                  jobs:
                    row.jobs ??
                    null,
                };
              }
            );

          if (!mounted) {
            return;
          }

          // ===================================================
          // SAVE DATA
          // ===================================================

          setCandidate(
            candidateData as Candidate
          );

          setApplications(
            formatted
          );

          setCurrentTime(
            now
          );

        } catch (
          err: unknown
        ) {
          console.error(
            "Applications error:",
            err
          );

          if (mounted) {
            setError(
              getErrorMessage(
                err
              )
            );
          }

        } finally {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      };

    loadApplications();

    return () => {
      mounted = false;
    };

  }, [router]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <p className="text-sm text-gray-500">
          Loading applications...
        </p>

      </main>
    );
  }

  // =========================================================
  // PAGE UI
  // =========================================================

  return (
    <CandidatePortalShell
      candidateName={
        candidate?.full_name
      }
      candidateEmail={
        candidate?.email
      }
      title="My Applications"
      subtitle="Track all jobs you have applied for"
    >

      <div className="mx-auto max-w-7xl p-5 sm:p-8">

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>

          <h2 className="text-xl font-bold">
            Applied Jobs
          </h2>

          <p className="mt-1 text-sm text-gray-400">

            {applications.length}{" "}

            application

            {applications.length ===
            1
              ? ""
              : "s"}

          </p>

        </div>

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {applications.length ===
        0 ? (

          <div className="mt-5 rounded-2xl bg-white p-12 text-center shadow-sm">

            <ClipboardList
              size={34}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 font-semibold">
              No applications yet
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Jobs you apply for will appear here.
            </p>

          </div>

        ) : (

          // ===================================================
          // APPLICATION LIST
          // ===================================================

          <div className="mt-5 grid gap-5">

            {applications.map(
              (
                application
              ) => {

                const job =
                  application.jobs;

                /*
                 * IMPORTANT:
                 *
                 * We are NOT using Date.now()
                 * here anymore.
                 *
                 * currentTime came from useEffect.
                 */

                const expiryTime =
                  job?.expires_at
                    ? Date.parse(
                        job.expires_at
                      )
                    : 0;

                const expired =
                  Boolean(
                    job &&
                    currentTime > 0 &&
                    expiryTime <=
                      currentTime
                  );

                const jobClosed =
                  Boolean(
                    job &&
                    (
                      job.status ===
                        "Closed" ||
                      expired
                    )
                  );

                return (
                  <article
                    key={
                      application.id
                    }
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >

                    {/* =========================================
                        COMPANY + JOB
                    ========================================= */}

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                      <div className="flex gap-4">

                        {/* ICON */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">

                          <Briefcase
                            size={21}
                          />

                        </div>

                        <div>

                          {/* COMPANY NAME */}

                          <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">

                            {job
                              ?.companies
                              ?.company_name ||
                              "Company"}

                          </p>

                          {/* JOB TITLE */}

                          <h3 className="mt-1 text-xl font-bold text-gray-900">

                            {job
                              ?.job_title ||
                              "Job"}

                          </h3>

                          {/* CATEGORY + JOB TYPE */}

                          <p className="mt-1 text-sm text-gray-400">

                            {job
                              ?.job_category ||
                              ""}

                            {job?.job_type
                              ? ` · ${job.job_type}`
                              : ""}

                          </p>

                        </div>

                      </div>

                      {/* APPLICATION STATUS */}

                      <ApplicationStatus
                        status={
                          application.status
                        }
                      />

                    </div>

                    {/* =========================================
                        JOB STATUS + APPLIED DATE
                    ========================================= */}

                    <div className="mt-5 flex flex-wrap gap-3">

                      {/* JOB STATUS */}

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          jobClosed
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >

                        Job:{" "}

                        {jobClosed
                          ? "Closed"
                          : "Active"}

                      </span>

                      {/* APPLIED DATE */}

                      <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">

                        Applied{" "}

                        {formatDate(
                          application.applied_at
                        )}

                      </span>

                    </div>

                    {/* =========================================
                        SKILLS + LANGUAGES
                    ========================================= */}

                    <div className="mt-5 grid gap-4 md:grid-cols-2">

                      {/* SKILLS */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">

                          <Wrench
                            size={15}
                          />

                          Skills

                        </div>

                        <p className="mt-2 text-sm font-medium leading-6 text-gray-700">

                          {application
                            .skills ||
                            "Not provided"}

                        </p>

                      </div>

                      {/* LANGUAGES */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">

                          <Languages
                            size={15}
                          />

                          Languages Known

                        </div>

                        <p className="mt-2 text-sm font-medium leading-6 text-gray-700">

                          {application
                            .languages_known ||
                            "Not provided"}

                        </p>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </div>

    </CandidatePortalShell>
  );
}

// ===========================================================
// APPLICATION STATUS
// ===========================================================

function ApplicationStatus({
  status,
}: {
  status: string;
}) {

  const style =
    status ===
    "Shortlisted"

      ? "bg-green-50 text-green-600"

      : status ===
        "Interview"

      ? "bg-orange-50 text-orange-600"

      : status ===
        "Rejected"

      ? "bg-red-50 text-red-600"

      : status ===
        "Hired"

      ? "bg-purple-50 text-purple-600"

      : "bg-blue-50 text-blue-600";

  return (
    <span
      className={`h-fit rounded-full px-4 py-2 text-sm font-semibold ${style}`}
    >
      {status}
    </span>
  );
}

// ===========================================================
// DATE FORMAT
// ===========================================================

function formatDate(
  value: string
) {

  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

// ===========================================================
// ERROR HANDLER
// ===========================================================

function getErrorMessage(
  error: unknown
) {

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Unable to load applications.";
}