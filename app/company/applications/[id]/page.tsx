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
  UserRound,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle,
  MapPin,
  FileText,
  Languages,
  Wrench,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


/* =========================================================
   TYPES
========================================================= */

type Job = {
  job_title: string;
  job_category: string;
  job_type: string;
  experience_required: string;
};


type Candidate = {
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  about: string | null;
  resume_url: string | null;
  resume_name: string | null;
};


type Application = {

  id: string;

  status: string;

  fit_status: string;

  skills: string;

  languages_known: string;

  applied_at: string;

  job_id: string;

  candidate_id: string;

  jobs:
    Job | null;

  candidates:
    Candidate | null;

};


/* =========================================================
   PAGE
========================================================= */

export default function ApplicantDetailsPage() {

  const router =
    useRouter();

  const params =
    useParams();


  const applicationId =

    typeof params.id ===
    "string"

      ? params.id

      : Array.isArray(
          params.id
        )

      ? params.id[0]

      : "";


  const [
    application,
    setApplication,
  ] =
    useState<Application | null>(
      null
    );


  const [
    resumeUrl,
    setResumeUrl,
  ] =
    useState<string | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    fitSaving,
    setFitSaving,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  /* =========================================================
     LOAD APPLICATION
  ========================================================= */

  useEffect(() => {

    let mounted = true;


    const loadApplication =
      async () => {


        if (!applicationId) {

          if (mounted) {

            setError(
              "Application ID is missing."
            );

            setLoading(
              false
            );

          }

          return;

        }


        try {

          setLoading(
            true
          );

          setError("");


          const supabase =
            createClient();


          /* =================================================
             USER
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


          if (userError) {

            throw userError;

          }


          if (!user) {

            router.replace(
              "/company/login"
            );

            return;

          }


          /* =================================================
             APPLICATION
          ================================================= */

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
              fit_status,
              skills,
              languages_known,
              applied_at,
              job_id,
              candidate_id,

              jobs (
                job_title,
                job_category,
                job_type,
                experience_required
              ),

              candidates (
                full_name,
                email,
                phone,
                address,
                about,
                resume_url,
                resume_name
              )
            `)
            .eq(
              "id",
              applicationId
            )
            .maybeSingle();


          if (
            applicationError
          ) {

            throw applicationError;

          }


          if (!data) {

            if (mounted) {

              setApplication(
                null
              );

              setError(
                "Application not found."
              );

            }

            return;

          }


          const row =
            data as unknown as {

              id: string;

              status: string;

              fit_status:
                string;

              skills: string;

              languages_known:
                string;

              applied_at:
                string;

              job_id: string;

              candidate_id:
                string;

              jobs:
                Job | null;

              candidates:
                Candidate | null;

            };


          const formatted:
            Application = {

              id:
                row.id,

              status:
                row.status,

              fit_status:
                row.fit_status ??
                "Pending",

              skills:
                row.skills ?? "",

              languages_known:
                row.languages_known ??
                "",

              applied_at:
                row.applied_at,

              job_id:
                row.job_id,

              candidate_id:
                row.candidate_id,

              jobs:
                row.jobs ??
                null,

              candidates:
                row.candidates ??
                null,

            };


          if (mounted) {

            setApplication(
              formatted
            );

          }


          /* =================================================
             RESUME SIGNED URL
          ================================================= */

          if (
            row.candidates
              ?.resume_url
          ) {

            const {
              data:
                signedData,

              error:
                signedError,

            } =
              await supabase.storage
                .from(
                  "candidate-resumes"
                )
                .createSignedUrl(
                  row.candidates
                    .resume_url,
                  60 * 10
                );


            if (
              !signedError &&
              signedData &&
              mounted
            ) {

              setResumeUrl(
                signedData.signedUrl
              );

            }

          }


        } catch (
          err: unknown
        ) {

          console.error(
            "Applicant loading error:",
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


    loadApplication();


    return () => {

      mounted = false;

    };

  }, [
    applicationId,
    router,
  ]);


  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus =
    async (
      newStatus: string
    ) => {


      if (!application) {

        return;

      }


      try {

        setSaving(
          true
        );

        setError("");


        const supabase =
          createClient();


        const {
          error:
            updateError,

        } = await supabase
          .from(
            "applications"
          )
          .update({

            status:
              newStatus,

            updated_at:
              new Date()
                .toISOString(),

          })
          .eq(
            "id",
            application.id
          );


        if (
          updateError
        ) {

          throw updateError;

        }


        setApplication(
          (
            previous
          ) => {

            if (
              !previous
            ) {

              return previous;

            }


            return {

              ...previous,

              status:
                newStatus,

            };

          }
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

        setSaving(
          false
        );

      }

    };


  /* =========================================================
     UPDATE FIT STATUS
  ========================================================= */

  const updateFitStatus =
    async (
      newFitStatus:
        "Fit" |
        "Not Fit"
    ) => {


      if (!application) {

        return;

      }


      try {

        setFitSaving(
          true
        );

        setError("");


        const supabase =
          createClient();


        const {
          error:
            updateError,

        } = await supabase
          .from(
            "applications"
          )
          .update({

            fit_status:
              newFitStatus,

            updated_at:
              new Date()
                .toISOString(),

          })
          .eq(
            "id",
            application.id
          );


        if (
          updateError
        ) {

          throw updateError;

        }


        setApplication(
          (
            previous
          ) => {

            if (
              !previous
            ) {

              return previous;

            }


            return {

              ...previous,

              fit_status:
                newFitStatus,

            };

          }
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

        setFitSaving(
          false
        );

      }

    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <p className="text-sm text-gray-500">
          Loading applicant...
        </p>

      </main>

    );

  }


  if (!application) {

    return (

      <main className="min-h-screen bg-gray-100 p-8">

        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-10 text-center">

          <UserRound
            size={30}
            className="mx-auto text-orange-500"
          />

          <h1 className="mt-4 text-xl font-bold">
            Applicant not found
          </h1>

          <Link
            href="/company/applications"
            className="mt-5 inline-block rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Applications
          </Link>

        </div>

      </main>

    );

  }


  const candidate =
    application.candidates;


  const job =
    application.jobs;


  /* =========================================================
     UI
  ========================================================= */

  return (

    <main className="min-h-screen bg-gray-100">


      <header className="border-b bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">

          <div>

            <p className="text-xs text-gray-400">
              Company Portal
            </p>

            <h1 className="text-xl font-bold">
              Applicant Details
            </h1>

          </div>


          <Link
            href="/company/applications"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >

            <ArrowLeft
              size={17}
            />

            Applications

          </Link>

        </div>

      </header>


      <div className="mx-auto max-w-5xl p-5 sm:p-8">


        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">

            {error}

          </div>

        )}


        {/* =================================================
            CANDIDATE DETAILS
        ================================================= */}

        <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <div className="flex flex-col justify-between gap-5 md:flex-row">


            <div className="flex gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">

                <UserRound
                  size={28}
                />

              </div>


              <div>

                <h2 className="text-2xl font-bold">

                  {candidate
                    ?.full_name ||
                    "Unknown Candidate"}

                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Job Applicant
                </p>

              </div>

            </div>


            <FitStatus
              status={
                application.fit_status
              }
            />

          </div>


          <div className="mt-8 grid gap-4 md:grid-cols-2">


            <InfoItem
              icon={
                <Mail size={17} />
              }
              label="Email"
              value={
                candidate?.email ||
                "Not provided"
              }
            />


            <InfoItem
              icon={
                <Phone size={17} />
              }
              label="Phone"
              value={
                candidate?.phone ||
                "Not provided"
              }
            />


            <InfoItem
              icon={
                <MapPin size={17} />
              }
              label="Address"
              value={
                candidate?.address ||
                "Not provided"
              }
            />


            <InfoItem
              icon={
                <FileText size={17} />
              }
              label="Resume"
              value={
                candidate
                  ?.resume_name ||
                "Not provided"
              }
            />

          </div>


          {resumeUrl && (

            <a
              href={
                resumeUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-orange-500"
            >

              <FileText
                size={17}
              />

              View Resume

            </a>

          )}

        </section>


        {/* =================================================
            SKILLS + LANGUAGES
        ================================================= */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <h2 className="text-lg font-bold">
            Candidate Qualifications
          </h2>


          <div className="mt-5 grid gap-5 md:grid-cols-2">


            <div className="rounded-xl bg-gray-50 p-5">

              <div className="flex items-center gap-2 text-sm font-semibold">

                <Wrench
                  size={18}
                  className="text-orange-500"
                />

                Skills

              </div>


              <div className="mt-4 flex flex-wrap gap-2">

                {splitValues(
                  application.skills
                ).length >
                0 ? (

                  splitValues(
                    application.skills
                  ).map(
                    (
                      skill
                    ) => (

                      <span
                        key={
                          skill
                        }
                        className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600"
                      >
                        {skill}
                      </span>

                    )
                  )

                ) : (

                  <p className="text-sm text-gray-400">
                    Not provided
                  </p>

                )}

              </div>

            </div>


            <div className="rounded-xl bg-gray-50 p-5">

              <div className="flex items-center gap-2 text-sm font-semibold">

                <Languages
                  size={18}
                  className="text-orange-500"
                />

                Languages Known

              </div>


              <div className="mt-4 flex flex-wrap gap-2">

                {splitValues(
                  application
                    .languages_known
                ).length >
                0 ? (

                  splitValues(
                    application
                      .languages_known
                  ).map(
                    (
                      language
                    ) => (

                      <span
                        key={
                          language
                        }
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"
                      >
                        {language}
                      </span>

                    )
                  )

                ) : (

                  <p className="text-sm text-gray-400">
                    Not provided
                  </p>

                )}

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            JOB
        ================================================= */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <h2 className="text-lg font-bold">
            Applied Job
          </h2>


          <div className="mt-5 grid gap-4 md:grid-cols-2">


            <InfoItem
              icon={
                <Briefcase size={17} />
              }
              label="Job Title"
              value={
                job?.job_title ||
                "Unknown"
              }
            />


            <InfoItem
              icon={
                <Briefcase size={17} />
              }
              label="Category"
              value={
                job?.job_category ||
                "Not provided"
              }
            />


            <InfoItem
              icon={
                <CheckCircle size={17} />
              }
              label="Job Type"
              value={
                job?.job_type ||
                "Not provided"
              }
            />


            <InfoItem
              icon={
                <UserRound size={17} />
              }
              label="Experience"
              value={
                job
                  ?.experience_required ||
                "Not provided"
              }
            />


            <InfoItem
              icon={
                <Calendar size={17} />
              }
              label="Applied Date"
              value={
                new Date(
                  application.applied_at
                ).toLocaleDateString(
                  "en-IN"
                )
              }
            />

          </div>

        </section>


        {/* =================================================
            RECRUITER FIT DECISION
        ================================================= */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <h2 className="text-lg font-bold">
            Candidate Fit
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Decide whether this candidate is suitable for this job.
          </p>


          <div className="mt-5 flex flex-wrap gap-3">


            <button
              type="button"
              disabled={
                fitSaving
              }
              onClick={() =>
                updateFitStatus(
                  "Fit"
                )
              }
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                application.fit_status ===
                "Fit"
                  ? "bg-green-600 text-white"
                  : "border border-green-200 bg-green-50 text-green-600"
              }`}
            >

              <ThumbsUp
                size={17}
              />

              Fit for Job

            </button>


            <button
              type="button"
              disabled={
                fitSaving
              }
              onClick={() =>
                updateFitStatus(
                  "Not Fit"
                )
              }
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                application.fit_status ===
                "Not Fit"
                  ? "bg-red-600 text-white"
                  : "border border-red-200 bg-red-50 text-red-600"
              }`}
            >

              <ThumbsDown
                size={17}
              />

              Not Fit

            </button>

          </div>

        </section>


        {/* =================================================
            APPLICATION STATUS
        ================================================= */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <h2 className="text-lg font-bold">
            Application Status
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Update the candidate&apos;s recruitment progress.
          </p>


          <div className="mt-5 flex flex-wrap gap-3">

            {[
              "New",
              "Shortlisted",
              "Interview",
              "Rejected",
              "Hired",
            ].map(
              (
                status
              ) => (

                <button
                  key={
                    status
                  }
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    updateStatus(
                      status
                    )
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    application.status ===
                    status
                      ? "bg-black text-white"
                      : "border bg-white text-gray-700 hover:border-orange-300 hover:text-orange-500"
                  }`}
                >
                  {status}
                </button>

              )
            )}

          </div>

        </section>

      </div>

    </main>

  );

}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl bg-gray-50 p-4">

      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">

        {icon}

        {label}

      </div>

      <p className="mt-2 text-sm font-semibold text-gray-800">
        {value}
      </p>

    </div>

  );

}


/* =========================================================
   FIT STATUS
========================================================= */

function FitStatus({
  status,
}: {
  status: string;
}) {

  const classes =
    status === "Fit"

      ? "bg-green-50 text-green-600"

      : status === "Not Fit"

      ? "bg-red-50 text-red-600"

      : "bg-gray-100 text-gray-500";


  return (

    <span className={`h-fit rounded-full px-4 py-2 text-sm font-semibold ${classes}`}>

      {status}

    </span>

  );

}


/* =========================================================
   SPLIT VALUES
========================================================= */

function splitValues(
  value: string
): string[] {

  return value
    .split(",")
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(Boolean);

}


/* =========================================================
   ERROR
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


  return "Something went wrong.";

}