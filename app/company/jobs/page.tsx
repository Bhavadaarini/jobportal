"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Briefcase,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  company_id: string;
  job_title: string;
  job_category: string;
  job_type: string;
  experience_required: string;
  number_of_openings: number;
  job_description: string;
  status: string;
  created_at: string;
};

export default function CompanyJobsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD JOBS
   * =========================================================
   */

  const loadJobs = useCallback(async () => {
    try {
      setError("");

      /*
       * 1. Get currently logged-in user
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      /*
       * If user is not logged in
       */

      if (!user) {
        router.replace("/company/login");
        return;
      }

      /*
       * 2. Find company belonging to this user
       */

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (companyError) {
        throw companyError;
      }

      /*
       * If company does not exist
       */

      if (!company) {
        router.replace("/company/register");
        return;
      }

      /*
       * Save company ID
       */

      setCompanyId(company.id);

      /*
       * 3. Get jobs belonging only to this company
       */

      const {
        data,
        error: jobsError,
      } = await supabase
        .from("jobs")
        .select(
          `
          id,
          company_id,
          job_title,
          job_category,
          job_type,
          experience_required,
          number_of_openings,
          job_description,
          status,
          created_at
          `
        )
        .eq("company_id", company.id)
        .order("created_at", {
          ascending: false,
        });

      if (jobsError) {
        throw jobsError;
      }

      /*
       * 4. Update jobs
       */

      setJobs(data ?? []);
    } catch (err: unknown) {
      console.error("Error loading jobs:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load jobs.");
      }
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  /*
   * =========================================================
   * OPEN JOB DETAILS
   * =========================================================
   */

  const handleJobClick = (jobId: string) => {
    router.push(`/company/jobs/${jobId}`);
  };

  /*
   * =========================================================
   * LOAD JOBS + REALTIME
   * =========================================================
   */

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const initialize = async () => {
      /*
       * First load jobs
       */

      await loadJobs();

      /*
       * If component was removed while loading,
       * don't continue.
       */

      if (cancelled) {
        return;
      }

      /*
       * We need the logged-in user's company ID
       */

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      /*
       * Get company ID
       */

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!company || cancelled) {
        return;
      }

      /*
       * =====================================================
       * REALTIME JOB SUBSCRIPTION
       * =====================================================
       *
       * Whenever a job is:
       *
       * INSERTED
       * UPDATED
       * DELETED
       *
       * we reload the jobs.
       */

      channel = supabase
        .channel(`company-jobs-${company.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "jobs",
            filter: `company_id=eq.${company.id}`,
          },
          () => {
            loadJobs();
          }
        )
        .subscribe((status) => {
          console.log("Jobs realtime status:", status);
        });
    };

    initialize();

    /*
     * Cleanup
     */

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadJobs, supabase]);

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <header className="border-b bg-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/company/dashboard")}
                aria-label="Go back"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <p className="text-xs text-gray-400">
                  Company Portal
                </p>

                <h1 className="font-bold">
                  Jobs
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-400">
              Loading jobs...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-gray-100">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/company/dashboard")}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-xs text-gray-400">
                Company Portal
              </p>

              <h1 className="font-bold">
                Jobs
              </h1>
            </div>
          </div>

          <a
            href="/company/jobs/create"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            <Plus size={18} />
            Post New Job
          </a>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        {/* PAGE TITLE */}

        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Your Job Posts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage all your company job openings.
          </p>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ===================================================
            NO JOBS
        =================================================== */}

        {jobs.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
              <Briefcase size={24} />
            </div>

            <h2 className="mt-5 font-bold">
              No jobs posted yet
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Create your first job opening to start receiving applications.
            </p>

            <a
              href="/company/jobs/create"
              className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              + Create Job
            </a>
          </div>
        ) : (
          /* =================================================
             JOB LIST
          ================================================= */

          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  {/* JOB INFORMATION */}

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Briefcase size={20} />
                    </div>

                    <div>
                      {/* CLICKABLE JOB NAME */}

                      <button
                        type="button"
                        onClick={() => handleJobClick(job.id)}
                        className="text-left font-bold text-gray-900 transition hover:text-orange-500 hover:underline"
                      >
                        {job.job_title}
                      </button>

                      <p className="mt-1 text-sm text-gray-400">
                        {job.job_category}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {/* JOB TYPE */}

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                          {job.job_type}
                        </span>

                        {/* EXPERIENCE */}

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                          {job.experience_required}
                        </span>

                        {/* OPENINGS */}

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                          {job.number_of_openings}{" "}
                          {job.number_of_openings === 1
                            ? "opening"
                            : "openings"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STATUS + MANAGE */}

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        job.status === "Active"
                          ? "bg-green-50 text-green-600"
                          : job.status === "Closed"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {job.status === "Closed"
                        ? "Disabled"
                        : job.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleJobClick(job.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-orange-500 hover:bg-orange-50 hover:text-orange-500"
                    >
                      Manage Job
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="mt-5 border-t pt-5">
                  <p className="line-clamp-3 text-sm leading-6 text-gray-500">
                    {job.job_description}
                  </p>
                </div>

                {/* CREATED DATE */}

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-gray-400">
                    Posted{" "}
                    {new Date(job.created_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJobClick(job.id)}
                    className="text-xs font-semibold text-orange-500 hover:text-orange-600 hover:underline md:hidden"
                  >
                    View / Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}