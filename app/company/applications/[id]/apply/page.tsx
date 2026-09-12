"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Link from "next/link";

import {
  ArrowLeft,
  Briefcase,
  Languages,
  Wrench,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


type Job = {
  id: string;
  job_title: string;
  status: string;
  expires_at: string;
};


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


  /* =========================================================
     LOAD JOB
  ========================================================= */

  useEffect(() => {

    const loadJob =
      async () => {

        const supabase =
          createClient();


        try {

          const {
            data,

            error:
              jobError,

          } = await supabase
            .from("jobs")
            .select(`
              id,
              job_title,
              status,
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


          if (!data) {

            throw new Error(
              "Job not found."
            );

          }


          setJob(
            data as Job
          );


        } catch (
          err: unknown
        ) {

          setError(
            getErrorMessage(
              err
            )
          );


        } finally {

          setLoading(
            false
          );

        }

      };


    if (jobId) {

      loadJob();

    }

  }, [jobId]);


  /* =========================================================
     SUBMIT
  ========================================================= */

  const submitApplication =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (!job) {
        return;
      }


      if (
        !skills.trim()
      ) {

        setError(
          "Please enter your skills."
        );

        return;

      }


      if (
        !languages.trim()
      ) {

        setError(
          "Please enter the languages you know."
        );

        return;

      }


      if (
        job.status !==
          "Active" ||
        new Date(
          job.expires_at
        ).getTime() <=
          Date.now()
      ) {

        setError(
          "This job is closed."
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


        if (!candidate) {

          throw new Error(
            "Candidate profile not found."
          );

        }


        const {
          data:
            existing,

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


        if (existing) {

          throw new Error(
            "You have already applied for this job."
          );

        }


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

          throw applicationError;

        }


        router.replace(
          "/candidate/dashboard"
        );

        router.refresh();


      } catch (
        err: unknown
      ) {

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


  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        Loading...
      </main>

    );

  }


  return (

    <main className="min-h-screen bg-gray-100 p-5 sm:p-8">

      <div className="mx-auto max-w-2xl">


        <Link
          href="/candidate/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500"
        >

          <ArrowLeft
            size={17}
          />

          Dashboard

        </Link>


        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">


          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500">

              <Briefcase
                size={22}
              />

            </div>


            <div>

              <p className="text-xs text-gray-400">
                Applying for
              </p>

              <h1 className="font-bold">
                {job
                  ?.job_title ||
                  "Job"}
              </h1>

            </div>

          </div>


          {error && (

            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">

              {error}

            </div>

          )}


          <form
            onSubmit={
              submitApplication
            }
            className="mt-7 space-y-6"
          >


            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

                <Wrench
                  size={17}
                />

                Skills *

              </label>

              <textarea
                required
                rows={4}
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
                placeholder="React, TypeScript, Next.js, MySQL"
                className="w-full rounded-xl border p-4 text-sm outline-none focus:border-orange-400"
              />

              <p className="mt-2 text-xs text-gray-400">
                Separate skills using commas.
              </p>

            </div>


            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

                <Languages
                  size={17}
                />

                Languages Known *

              </label>

              <textarea
                required
                rows={3}
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
                placeholder="English, Tamil, Hindi"
                className="w-full rounded-xl border p-4 text-sm outline-none focus:border-orange-400"
              />

              <p className="mt-2 text-xs text-gray-400">
                Separate languages using commas.
              </p>

            </div>


            <button
              type="submit"
              disabled={
                submitting
              }
              className="h-12 w-full rounded-xl bg-black font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >

              {submitting
                ? "Submitting..."
                : "Submit Application"}

            </button>

          </form>

        </div>

      </div>

    </main>

  );

}


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