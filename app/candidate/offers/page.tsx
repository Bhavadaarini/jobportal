"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Search,
  Clock3,
} from "lucide-react";

import CandidatePortalShell from "@/components/candidate/CandidatePortalShell";
import { createClient } from "@/lib/supabase/client";

type Candidate = {
  id: string;
  full_name: string;
  email: string;
};

type Company = {
  company_name: string;
};

type Job = {
  id: string;
  job_title: string;
  job_category: string;
  job_type: string;
  experience_required: string;
  number_of_openings: number;
  job_description: string;
  status: string;
  created_at: string;
  companies: Company | null;
};

type Application = {
  job_id: string;
  status: string;
};

export default function CandidateOffersPage() {
  const router = useRouter();

  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    const loadOffers = async () => {
      const supabase = createClient();

      try {
        setLoading(true);
        setError("");

        // =====================================================
        // AUTH
        // =====================================================

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Candidate session error:",
            sessionError
          );
        }

        if (!session?.user) {
          router.replace(
            "/candidate/login"
          );
          return;
        }

        const user = session.user;

        // =====================================================
        // CANDIDATE PROFILE
        // =====================================================

        const {
          data: candidateData,
          error: candidateError,
        } = await supabase
          .from("candidates")
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

        if (candidateError) {
          throw candidateError;
        }

        if (!candidateData) {
          throw new Error(
            "Candidate profile not found."
          );
        }

        // =====================================================
        // JOBS + COMPANY NAME
        // =====================================================

        const {
          data: jobsData,
          error: jobsError,
        } = await supabase
          .from("jobs")
          .select(`
            id,
            job_title,
            job_category,
            job_type,
            experience_required,
            number_of_openings,
            job_description,
            status,
            created_at,

            companies (
              company_name
            )
          `)
          .eq(
            "status",
            "Active"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (jobsError) {
          throw jobsError;
        }

        // =====================================================
        // CANDIDATE APPLICATIONS
        // =====================================================

        const {
          data: applicationData,
          error: applicationError,
        } = await supabase
          .from("applications")
          .select(`
            job_id,
            status
          `)
          .eq(
            "candidate_id",
            candidateData.id
          );

        if (applicationError) {
          throw applicationError;
        }

        // =====================================================
        // FORMAT JOB DATA
        // =====================================================

        const formattedJobs: Job[] =
          (jobsData ?? []).map(
            (item) => {
              const row =
                item as unknown as {
                  id: string;
                  job_title: string;
                  job_category: string;
                  job_type: string;
                  experience_required: string;
                  number_of_openings: number;
                  job_description: string;
                  status: string;
                  created_at: string;
                  companies:
                    | Company
                    | null;
                };

              return {
                id: row.id,
                job_title:
                  row.job_title,
                job_category:
                  row.job_category,
                job_type:
                  row.job_type,
                experience_required:
                  row.experience_required,
                number_of_openings:
                  row.number_of_openings,
                job_description:
                  row.job_description,
                status:
                  row.status,
                created_at:
                  row.created_at,
                companies:
                  row.companies ??
                  null,
              };
            }
          );

        if (!mounted) {
          return;
        }

        setCandidate(
          candidateData as Candidate
        );

        setJobs(
          formattedJobs
        );

        setApplications(
          (applicationData ??
            []) as Application[]
        );
      } catch (
        err: unknown
      ) {
        console.error(
          "Offers error:",
          err
        );

        if (mounted) {
          setError(
            getErrorMessage(err)
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOffers();

    return () => {
      mounted = false;
    };
  }, [router]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredJobs =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      if (!text) {
        return jobs;
      }

      return jobs.filter(
        (job) =>
          job.job_title
            .toLowerCase()
            .includes(text) ||

          job.job_category
            .toLowerCase()
            .includes(text) ||

          job.job_type
            .toLowerCase()
            .includes(text) ||

          job.companies
            ?.company_name
            ?.toLowerCase()
            .includes(text)
      );
    }, [
      jobs,
      search,
    ]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading offers...
        </p>
      </main>
    );
  }

  return (
    <CandidatePortalShell
      candidateName={
        candidate?.full_name
      }
      candidateEmail={
        candidate?.email
      }
      title="Job Offers"
      subtitle="Explore job opportunities posted by companies"
    >
      <div className="mx-auto max-w-7xl p-5 sm:p-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* SEARCH */}

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search job title, company, category or job type..."
              className="h-12 w-full rounded-xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* TITLE */}

        <div className="mt-6">
          <h2 className="text-xl font-bold">
            Available Opportunities
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            {filteredJobs.length}{" "}
            {filteredJobs.length === 1
              ? "job"
              : "jobs"}{" "}
            found
          </p>
        </div>

        {/* JOBS */}

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          {filteredJobs.map(
            (job) => {
              const application =
                applications.find(
                  (item) =>
                    item.job_id ===
                    job.id
                );

              const applied =
                Boolean(application);

              const closed =
                isJobClosed(job);

              return (
                <article
                  key={job.id}
                  className={`rounded-2xl bg-white p-6 shadow-sm ${
                    closed
                      ? "border border-gray-200"
                      : ""
                  }`}
                >
                  {/* TOP */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex gap-4">

                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          closed
                            ? "bg-gray-100 text-gray-400"
                            : "bg-orange-100 text-orange-500"
                        }`}
                      >
                        <Briefcase
                          size={21}
                        />
                      </div>

                      <div>

                        {/* COMPANY NAME */}

                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                          {job
                            .companies
                            ?.company_name ||
                            "Company"}
                        </p>

                        {/* JOB TITLE */}

                        <h3 className="mt-1 text-xl font-bold text-gray-900">
                          {
                            job.job_title
                          }
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                          {
                            job.job_category
                          }
                          {job.job_type
                            ? ` · ${job.job_type}`
                            : ""}
                        </p>

                      </div>
                    </div>

                    {/* JOB STATUS */}

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        closed
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {closed
                        ? "Closed"
                        : "Active"}
                    </span>
                  </div>

                  {/* JOB INFO */}

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <JobInfo
                      title="Job Type"
                      value={
                        job.job_type
                      }
                    />

                    <JobInfo
                      title="Experience"
                      value={
                        job.experience_required
                      }
                    />

                    <JobInfo
                      title="Openings"
                      value={String(
                        job.number_of_openings
                      )}
                    />

                    <JobInfo
                      title="Posted"
                      value={formatDate(
                        job.created_at
                      )}
                    />

                  </div>

                  {/* DESCRIPTION */}

                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-500">
                    {
                      job.job_description
                    }
                  </p>

                  {/* CLOSING */}

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">

                    <Clock3
                      size={14}
                    />

                    {closed
                      ? "Applications closed"
                      : "Applications open"}
                  </div>

                  {/* APPLICATION BUTTON */}

                  {applied ? (
                    <button
                      type="button"
                      disabled
                      className="mt-6 h-11 w-full cursor-not-allowed rounded-xl bg-green-50 text-sm font-semibold text-green-600"
                    >
                      Application{" "}
                      {application
                        ?.status ||
                        "Submitted"}
                    </button>
                  ) : closed ? (
                    <button
                      type="button"
                      disabled
                      className="mt-6 h-11 w-full cursor-not-allowed rounded-xl bg-gray-200 text-sm font-semibold text-gray-500"
                    >
                      Closed
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/candidate/jobs/${job.id}/apply`
                        )
                      }
                      className="mt-6 h-11 w-full rounded-xl bg-black text-sm font-semibold text-white transition hover:bg-orange-500"
                    >
                      Apply Now
                    </button>
                  )}

                </article>
              );
            }
          )}
        </div>

        {/* NO JOBS */}

        {filteredJobs.length ===
          0 && (
          <div className="mt-5 rounded-2xl bg-white p-12 text-center shadow-sm">

            <Briefcase
              size={32}
              className="mx-auto text-gray-300"
            />

            <p className="mt-4 text-sm text-gray-400">
              No job offers found.
            </p>
          </div>
        )}

      </div>
    </CandidatePortalShell>
  );
}

function JobInfo({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">

      <p className="text-xs text-gray-400">
        {title}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-700">
        {value}
      </p>

    </div>
  );
}

function isJobClosed(
  job: Job
) {
  return job.status !== "Active";
}

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getErrorMessage(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Unable to load offers.";
}