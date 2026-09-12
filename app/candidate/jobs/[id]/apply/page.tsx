"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Briefcase,
  Languages,
  Wrench,
  CalendarDays,
  Clock3,
  CheckCircle2,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


/* =========================================================
   TYPES
========================================================= */

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
  expires_at: string;
};


/* =========================================================
   PAGE
========================================================= */

export default function ApplyJobPage() {
  const router =
    useRouter();

  const params =
    useParams();


  const jobId =
    typeof params.id ===
    "string"
      ? params.id
      : Array.isArray(
          params.id
        )
      ? params.id[0]
      : "";


  const [
    job,
    setJob,
  ] =
    useState<Job | null>(
      null
    );


  const [
    skills,
    setSkills,
  ] =
    useState("");


  const [
    languages,
    setLanguages,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  /* =========================================================
     LOAD JOB
  ========================================================= */

  useEffect(() => {
    let mounted = true;


    const loadJob =
      async () => {

        if (!jobId) {

          if (mounted) {

            setError(
              "Job ID is missing."
            );

            setLoading(
              false
            );

          }

          return;
        }


        const supabase =
          createClient();


        try {

          setLoading(
            true
          );

          setError("");


          /* =================================================
             CHECK AUTHENTICATION
          ================================================= */

          const {
            data: {
              user,
            },

            error:
              userError,

          } =
            await supabase.auth
              .getUser();


          if (
            userError
          ) {

            throw userError;

          }


          if (!user) {

            router.replace(
              "/candidate/login"
            );

            return;

          }


          /* =================================================
             CHECK CANDIDATE PROFILE
          ================================================= */

          const {
            data:
              candidate,

            error:
              candidateError,

          } = await supabase
            .from(
              "candidates"
            )
            .select("id")
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
            !candidate
          ) {

            throw new Error(
              "Candidate profile not found."
            );

          }


          /* =================================================
             GET JOB
          ================================================= */

          const {
            data:
              jobData,

            error:
              jobError,

          } = await supabase
            .from(
              "jobs"
            )
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
              expires_at
            `)
            .eq(
              "id",
              jobId
            )
            .maybeSingle();


          if (
            jobError
          ) {

            throw jobError;

          }


          if (
            !jobData
          ) {

            throw new Error(
              "Job not found."
            );

          }


          if (mounted) {

            setJob(
              jobData as Job
            );

          }


        } catch (
          err: unknown
        ) {

          console.error(
            "Load job error:",
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


    loadJob();


    return () => {

      mounted = false;

    };

  }, [
    jobId,
    router,
  ]);


  /* =========================================================
     SUBMIT APPLICATION
  ========================================================= */

  const submitApplication =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (!job) {

        setError(
          "Job information is unavailable."
        );

        return;

      }


      /* =====================================================
         VALIDATE SKILLS
      ===================================================== */

      if (
        !skills.trim()
      ) {

        setError(
          "Please enter your skills."
        );

        return;

      }


      /* =====================================================
         VALIDATE LANGUAGES
      ===================================================== */

      if (
        !languages.trim()
      ) {

        setError(
          "Please enter the languages you know."
        );

        return;

      }


      /* =====================================================
         CHECK JOB STATUS
      ===================================================== */

      if (
        isJobClosed(
          job
        )
      ) {

        setError(
          "This job is closed and no longer accepting applications."
        );

        return;

      }


      const supabase =
        createClient();


      try {

        setSubmitting(
          true
        );

        setError("");

        setSuccess("");


        /* =================================================
           GET AUTH USER
        ================================================= */

        const {
          data: {
            user,
          },

          error:
            userError,

        } =
          await supabase.auth
            .getUser();


        if (
          userError
        ) {

          throw userError;

        }


        if (!user) {

          router.replace(
            "/candidate/login"
          );

          return;

        }


        /* =================================================
           GET CANDIDATE PROFILE

           IMPORTANT:

           auth.users.id
                  ↓
           candidates.user_id
                  ↓
           candidates.id
        ================================================= */

        const {
          data:
            candidate,

          error:
            candidateError,

        } = await supabase
          .from(
            "candidates"
          )
          .select(`
            id,
            full_name
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
          !candidate
        ) {

          throw new Error(
            "Candidate profile not found."
          );

        }


        /* =================================================
           RE-CHECK JOB BEFORE INSERT

           We re-fetch it because the candidate may have
           kept the page open until the job expired.
        ================================================= */

        const {
          data:
            currentJob,

          error:
            currentJobError,

        } = await supabase
          .from(
            "jobs"
          )
          .select(`
            id,
            status,
            expires_at
          `)
          .eq(
            "id",
            job.id
          )
          .maybeSingle();


        if (
          currentJobError
        ) {

          throw currentJobError;

        }


        if (
          !currentJob
        ) {

          throw new Error(
            "Job not found."
          );

        }


        const currentJobClosed =
          currentJob.status ===
            "Closed" ||
          (
            currentJob
              .expires_at &&
            new Date(
              currentJob.expires_at
            ).getTime() <=
              Date.now()
          );


        if (
          currentJobClosed
        ) {

          throw new Error(
            "This job is closed and no longer accepting applications."
          );

        }


        /* =================================================
           CHECK DUPLICATE APPLICATION
        ================================================= */

        const {
          data:
            existingApplication,

          error:
            existingError,

        } = await supabase
          .from(
            "applications"
          )
          .select("id")
          .eq(
            "job_id",
            job.id
          )
          .eq(
            "candidate_id",
            candidate.id
          )
          .maybeSingle();


        if (
          existingError
        ) {

          throw existingError;

        }


        if (
          existingApplication
        ) {

          throw new Error(
            "You have already applied for this job."
          );

        }


        /* =================================================
           CREATE APPLICATION

           Skills and languages are stored on the application
           because they are supplied specifically when the
           candidate applies for this job.
        ================================================= */

        const {
          error:
            applicationError,

        } = await supabase
          .from(
            "applications"
          )
          .insert({

            job_id:
              job.id,

            candidate_id:
              candidate.id,

            status:
              "New",

            fit_status:
              "Pending",

            skills:
              skills.trim(),

            languages_known:
              languages.trim(),

          });


        if (
          applicationError
        ) {

          /* ===============================================
             DUPLICATE UNIQUE CONSTRAINT
          =============================================== */

          if (
            applicationError.code ===
            "23505"
          ) {

            throw new Error(
              "You have already applied for this job."
            );

          }


          /* ===============================================
             RLS ERROR

             Could happen when:
             - job expired
             - job closed
             - candidate mismatch
          =============================================== */

          if (
            applicationError.code ===
            "42501"
          ) {

            throw new Error(
              "This application could not be submitted. The job may have closed."
            );

          }


          throw applicationError;

        }


        /* =================================================
           SUCCESS
        ================================================= */

        setSuccess(
          "Application submitted successfully."
        );


        /*
         * Redirect candidate back to dashboard.
         */

        router.replace(
          "/candidate/dashboard"
        );

        router.refresh();


      } catch (
        err: unknown
      ) {

        console.error(
          "Submit application error:",
          err
        );


        setError(
          getErrorMessage(
            err
          )
        );


      } finally {

        setSubmitting(
          false
        );

      }

    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading
  ) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />


          <p className="mt-4 text-sm text-gray-500">

            Loading job...

          </p>

        </div>

      </main>

    );

  }


  /* =========================================================
     JOB NOT FOUND
  ========================================================= */

  if (
    !job
  ) {

    return (

      <main className="min-h-screen bg-gray-100 p-5 sm:p-8">


        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-sm">


          <Briefcase
            size={34}
            className="mx-auto text-gray-300"
          />


          <h1 className="mt-4 text-xl font-bold">

            Job not available

          </h1>


          {error && (

            <p className="mt-2 text-sm text-red-500">

              {error}

            </p>

          )}


          <Link
            href="/candidate/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-orange-500"
          >

            <ArrowLeft
              size={17}
            />

            Back to Dashboard

          </Link>


        </div>


      </main>

    );

  }


  const closed =
    isJobClosed(
      job
    );


  /* =========================================================
     UI
  ========================================================= */

  return (

    <main className="min-h-screen bg-gray-100">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">


        <div className="mx-auto flex min-h-20 max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">


          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">

              Candidate Portal

            </p>


            <h1 className="mt-1 text-xl font-bold">

              Apply for Job

            </h1>

          </div>


          <Link
            href="/candidate/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >

            <ArrowLeft
              size={17}
            />

            Dashboard

          </Link>


        </div>


      </header>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-4xl p-5 sm:p-8">


        {/* ===================================================
            JOB DETAILS
        =================================================== */}

        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">


          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">


            <div className="flex gap-4">


              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  closed
                    ? "bg-gray-100 text-gray-400"
                    : "bg-orange-100 text-orange-500"
                }`}
              >

                <Briefcase
                  size={22}
                />

              </div>


              <div>


                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">

                  {
                    job.job_category
                  }

                </p>


                <h2 className="mt-1 text-2xl font-bold text-gray-900">

                  {
                    job.job_title
                  }

                </h2>


                <p className="mt-2 text-sm text-gray-500">

                  {
                    job.job_type
                  }

                  {" · "}

                  {
                    job.experience_required
                  }

                </p>


              </div>


            </div>


            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
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


          {/* =================================================
              JOB INFO
          ================================================= */}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">


            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs text-gray-400">

                Job Type

              </p>

              <p className="mt-1 text-sm font-semibold">

                {
                  job.job_type
                }

              </p>

            </div>


            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs text-gray-400">

                Experience

              </p>

              <p className="mt-1 text-sm font-semibold">

                {
                  job.experience_required
                }

              </p>

            </div>


            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs text-gray-400">

                Openings

              </p>

              <p className="mt-1 text-sm font-semibold">

                {
                  job.number_of_openings
                }

              </p>

            </div>


          </div>


          {/* =================================================
              DATES
          ================================================= */}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">


            <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">

              <CalendarDays
                size={18}
                className="text-gray-400"
              />

              <div>

                <p className="text-xs text-gray-400">

                  Posted Date

                </p>

                <p className="mt-1 text-sm font-semibold">

                  {formatDate(
                    job.created_at
                  )}

                </p>

              </div>

            </div>


            <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">

              <Clock3
                size={18}
                className={
                  closed
                    ? "text-red-500"
                    : "text-orange-500"
                }
              />

              <div>

                <p className="text-xs text-gray-400">

                  {closed
                    ? "Applications Closed"
                    : "Application Closes"}

                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    closed
                      ? "text-red-600"
                      : ""
                  }`}
                >

                  {formatDateTime(
                    job.expires_at
                  )}

                </p>

              </div>

            </div>


          </div>


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="mt-6">


            <h3 className="text-sm font-semibold text-gray-800">

              Job Description

            </h3>


            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-500">

              {
                job.job_description
              }

            </p>


          </div>


        </section>


        {/* ===================================================
            CLOSED JOB MESSAGE
        =================================================== */}

        {closed ? (

          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">


            <Clock3
              size={30}
              className="mx-auto text-red-500"
            />


            <h2 className="mt-3 font-bold text-red-700">

              Applications Closed

            </h2>


            <p className="mt-2 text-sm text-red-600">

              This job has reached its application deadline and is no longer accepting applications.

            </p>


            <Link
              href="/candidate/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >

              <ArrowLeft
                size={17}
              />

              View Other Jobs

            </Link>


          </section>

        ) : (

          /* ===================================================
              APPLICATION FORM
          =================================================== */

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">


            <div>


              <h2 className="text-xl font-bold">

                Application Information

              </h2>


              <p className="mt-1 text-sm text-gray-400">

                Tell the recruiter about your skills and languages.

              </p>


            </div>


            {/* ERROR */}

            {error && (

              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">

                {error}

              </div>

            )}


            {/* SUCCESS */}

            {success && (

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-600">

                <CheckCircle2
                  size={18}
                />

                {success}

              </div>

            )}


            <form
              onSubmit={
                submitApplication
              }
              className="mt-7 space-y-6"
            >


              {/* =================================================
                  SKILLS
              ================================================= */}

              <div>


                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">

                  <Wrench
                    size={17}
                    className="text-orange-500"
                  />

                  Skills

                  <span className="text-orange-500">
                    *
                  </span>

                </label>


                <textarea
                  required

                  rows={5}

                  value={
                    skills
                  }

                  onChange={(
                    event
                  ) =>
                    setSkills(
                      event.target.value
                    )
                  }

                  placeholder="Example: React, TypeScript, JavaScript, Next.js, Node.js, MySQL"

                  className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />


                <p className="mt-2 text-xs text-gray-400">

                  Enter your relevant skills separated by commas.

                </p>


              </div>


              {/* =================================================
                  LANGUAGES
              ================================================= */}

              <div>


                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">

                  <Languages
                    size={17}
                    className="text-orange-500"
                  />

                  Languages Known

                  <span className="text-orange-500">
                    *
                  </span>

                </label>


                <textarea
                  required

                  rows={4}

                  value={
                    languages
                  }

                  onChange={(
                    event
                  ) =>
                    setLanguages(
                      event.target.value
                    )
                  }

                  placeholder="Example: English, Tamil, Hindi"

                  className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />


                <p className="mt-2 text-xs text-gray-400">

                  Enter the languages you know separated by commas.

                </p>


              </div>


              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">


                <Link
                  href="/candidate/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >

                  <ArrowLeft
                    size={17}
                  />

                  Cancel

                </Link>


                <button
                  type="submit"

                  disabled={
                    submitting
                  }

                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-7 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <CheckCircle2
                    size={18}
                  />


                  {submitting
                    ? "Submitting..."
                    : "Submit Application"}

                </button>


              </div>


            </form>


          </section>

        )}


      </div>


    </main>

  );

}


/* =========================================================
   JOB CLOSED CHECK
========================================================= */

function isJobClosed(
  job: Job
): boolean {

  if (
    job.status ===
    "Closed"
  ) {

    return true;

  }


  if (
    job.expires_at
  ) {

    const expiry =
      new Date(
        job.expires_at
      ).getTime();


    if (
      expiry <=
      Date.now()
    ) {

      return true;

    }

  }


  return false;

}


/* =========================================================
   DATE
========================================================= */

function formatDate(
  date: string
): string {

  if (!date) {

    return "-";

  }


  return new Date(
    date
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


/* =========================================================
   DATE + TIME
========================================================= */

function formatDateTime(
  date: string
): string {

  if (!date) {

    return "-";

  }


  return new Date(
    date
  ).toLocaleString(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );

}


/* =========================================================
   ERROR HELPER
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
    typeof error ===
      "object" &&
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


  return "Unable to submit application.";

}