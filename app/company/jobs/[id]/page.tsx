"use client";

import { useEffect, useState } from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Link from "next/link";

import {
  ArrowLeft,
  Briefcase,
  Power,
  PowerOff,
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
  status: "Active" | "Closed";
  created_at: string;
};


export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const jobId = params.id as string;

  const [job, setJob] =
    useState<Job | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    statusLoading,
    setStatusLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");


  /* =========================================================
     FETCH JOB
  ========================================================= */

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true);
      setError("");

      try {
        const supabase =
          createClient();


        /* ===============================================
           CHECK LOGGED-IN USER
        =============================================== */

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();


        if (userError) {
          throw userError;
        }


        if (!user) {
          router.replace(
            "/company/login"
          );

          return;
        }


        /* ===============================================
           GET COMPANY
        =============================================== */

        const {
          data: company,
          error: companyError,
        } = await supabase
          .from("companies")
          .select("id")
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();


        if (
          companyError ||
          !company
        ) {
          throw new Error(
            "Company profile not found."
          );
        }


        /* ===============================================
           GET SELECTED JOB

           IMPORTANT:
           Do NOT filter by status.

           Company must be able to open both:
           Active jobs
           Disabled / Closed jobs
        =============================================== */

        const {
          data: jobData,
          error: jobError,
        } = await supabase
          .from("jobs")
          .select(`
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
          `)
          .eq(
            "id",
            jobId
          )
          .eq(
            "company_id",
            company.id
          )
          .maybeSingle();


        if (jobError) {
          throw jobError;
        }


        if (!jobData) {
          throw new Error(
            "Job not found."
          );
        }


        setJob(
          jobData as Job
        );

      } catch (
        error: unknown
      ) {
        console.error(
          "Error loading job:",
          error
        );

        setError(
          getErrorMessage(error)
        );

      } finally {
        setLoading(false);
      }
    };


    if (jobId) {
      loadJob();
    }

  }, [
    jobId,
    router,
  ]);


  /* =========================================================
     ENABLE / DISABLE JOB
  ========================================================= */

  const handleToggleStatus =
    async () => {

      if (!job) {
        return;
      }


      setStatusLoading(true);
      setError("");


      try {
        const supabase =
          createClient();


        /* ===============================================
           CHANGE STATUS

           Active -> Closed
           Closed -> Active

           We keep "Closed" in the database so your
           existing database structure does not need
           to be changed.

           In the UI we display Closed as Disabled.
        =============================================== */

        const newStatus:
          "Active" | "Closed" =
          job.status === "Active"
            ? "Closed"
            : "Active";


        const {
          data: updatedJob,
          error: updateError,
        } = await supabase
          .from("jobs")
          .update({
            status: newStatus,
          })
          .eq(
            "id",
            job.id
          )
          .eq(
            "company_id",
            job.company_id
          )
          .select(`
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
          `)
          .single();


        if (updateError) {
          throw updateError;
        }


        /* ===============================================
           UPDATE UI IMMEDIATELY
        =============================================== */

        setJob(
          updatedJob as Job
        );

        router.refresh();

      } catch (
        error: unknown
      ) {
        console.error(
          "Error changing job status:",
          error
        );

        setError(
          getErrorMessage(error)
        );

      } finally {
        setStatusLoading(false);
      }
    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <p className="text-sm text-gray-500">
          Loading job...
        </p>

      </main>
    );
  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error &&
    !job
  ) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">

        <div className="mx-auto max-w-4xl">

          <Link
            href="/company/jobs"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600"
          >
            <ArrowLeft
              size={18}
            />

            Back to Jobs
          </Link>


          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>

        </div>

      </main>
    );
  }


  if (!job) {
    return null;
  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center px-5 sm:px-8">

          <Link
            href="/company/jobs"
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl border text-gray-500 transition hover:bg-gray-50"
          >
            <ArrowLeft
              size={18}
            />
          </Link>


          <div>

            <p className="text-xs text-gray-400">
              Company Portal
            </p>

            <h1 className="font-bold">
              Job Details
            </h1>

          </div>

        </div>

      </header>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-5xl p-5 sm:p-8">

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}


        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          {/* =================================================
              TITLE + STATUS
          ================================================= */}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div className="flex gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">

                <Briefcase
                  size={22}
                />

              </div>


              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  {job.job_title}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {job.job_category}
                </p>

              </div>

            </div>


            {/* STATUS */}

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                job.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {job.status === "Active"
                ? "Active"
                : "Disabled"}
            </span>

          </div>


          {/* =================================================
              STATUS MANAGEMENT
          ================================================= */}

          <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h3 className="font-semibold text-gray-900">
                  Job Status
                </h3>


                {job.status === "Active" ? (

                  <p className="mt-1 text-sm text-gray-500">
                    This job is currently enabled.
                    Candidates can view and apply for this job.
                    You can disable it whenever you want.
                  </p>

                ) : (

                  <p className="mt-1 text-sm text-gray-500">
                    This job is currently disabled.
                    Candidates cannot view or apply for this job.
                    You can enable it again whenever you want.
                  </p>

                )}

              </div>


              {/* ENABLE / DISABLE BUTTON */}

              <button
                type="button"
                disabled={
                  statusLoading
                }
                onClick={
                  handleToggleStatus
                }
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  job.status === "Active"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >

                {job.status === "Active" ? (
                  <>
                    <PowerOff
                      size={17}
                    />

                    {statusLoading
                      ? "Disabling..."
                      : "Disable Job"}
                  </>
                ) : (
                  <>
                    <Power
                      size={17}
                    />

                    {statusLoading
                      ? "Enabling..."
                      : "Enable Job"}
                  </>
                )}

              </button>

            </div>

          </div>


          {/* =================================================
              JOB INFORMATION
          ================================================= */}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">

            <JobInformation
              label="Job Type"
              value={
                job.job_type
              }
            />

            <JobInformation
              label="Experience Required"
              value={`${job.experience_required} years`}
            />

            <JobInformation
              label="Number of Openings"
              value={String(
                job.number_of_openings
              )}
            />

            <JobInformation
              label="Category"
              value={
                job.job_category
              }
            />

          </div>


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="mt-8">

            <h3 className="text-sm font-semibold text-gray-800">
              Job Description
            </h3>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
              {job.job_description}
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   JOB INFORMATION
========================================================= */

function JobInformation({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-800">
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
  error: unknown
): string {

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {

    const message =
      (
        error as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }

  return "Something went wrong.";
}