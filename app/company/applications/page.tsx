"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Briefcase,
  Search,
  UserRound,
  Mail,
  Filter,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


/* =========================================================
   TYPES
========================================================= */

type Candidate = {
  full_name: string;
  email: string;
  phone: string | null;
  resume_name: string | null;
};

type Job = {
  id: string;
  job_title: string;
  job_category: string;
  job_type: string;
  status: string;
  company_id: string;
};

type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  fit_status: string;
  skills: string;
  languages_known: string;
  applied_at: string;

  candidates: Candidate | null;
  jobs: Job | null;
};


/* =========================================================
   PAGE
========================================================= */

export default function CompanyApplicationsPage() {
  const router =
    useRouter();

  const [
    applications,
    setApplications,
  ] =
    useState<Application[]>(
      []
    );

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

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    jobType,
    setJobType,
  ] =
    useState("All");


  /* =========================================================
     LOAD APPLICATIONS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadApplications =
      async () => {

        const supabase =
          createClient();

        try {

          setLoading(true);
          setError("");


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
             COMPANY
          ================================================= */

          const {
            data:
              company,

            error:
              companyError,
          } = await supabase
            .from(
              "companies"
            )
            .select("id")
            .eq(
              "user_id",
              user.id
            )
            .maybeSingle();


          if (
            companyError
          ) {
            throw companyError;
          }


          if (!company) {

            router.replace(
              "/company/register"
            );

            return;
          }


          /* =================================================
             APPLICATIONS
          ================================================= */

          const {
            data,
            error:
              applicationsError,
          } = await supabase
            .from(
              "applications"
            )
            .select(`
              id,
              job_id,
              candidate_id,
              status,
              fit_status,
              skills,
              languages_known,
              applied_at,

              candidates (
                full_name,
                email,
                phone,
                resume_name
              ),

              jobs!inner (
                id,
                job_title,
                job_category,
                job_type,
                status,
                company_id
              )
            `)
            .eq(
              "jobs.company_id",
              company.id
            )
            .order(
              "applied_at",
              {
                ascending: false,
              }
            );


          if (
            applicationsError
          ) {
            throw applicationsError;
          }


          const formatted:
            Application[] =
            (
              data ?? []
            ).map(
              (
                item
              ) => {

                const row =
                  item as unknown as {

                    id: string;

                    job_id: string;

                    candidate_id:
                      string;

                    status: string;

                    fit_status:
                      string;

                    skills: string;

                    languages_known:
                      string;

                    applied_at:
                      string;

                    candidates:
                      | Candidate
                      | null;

                    jobs:
                      | Job
                      | null;

                  };


                return {

                  id:
                    row.id,

                  job_id:
                    row.job_id,

                  candidate_id:
                    row.candidate_id,

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

                  candidates:
                    row.candidates ??
                    null,

                  jobs:
                    row.jobs ??
                    null,

                };

              }
            );


          if (mounted) {

            setApplications(
              formatted
            );

          }

        } catch (
          err: unknown
        ) {

          console.error(
            "Applications loading error:",
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


  /* =========================================================
     FILTER APPLICATIONS
  ========================================================= */

  const filteredApplications =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      return applications.filter(
        (
          application
        ) => {

          const job =
            application.jobs;

          const candidate =
            application.candidates;


          const matchesType =
            jobType ===
              "All" ||
            job?.job_type ===
              jobType;


          const matchesSearch =
            !searchText ||

            job?.job_title
              ?.toLowerCase()
              .includes(
                searchText
              ) ||

            job?.job_category
              ?.toLowerCase()
              .includes(
                searchText
              ) ||

            candidate
              ?.full_name
              ?.toLowerCase()
              .includes(
                searchText
              ) ||

            candidate
              ?.email
              ?.toLowerCase()
              .includes(
                searchText
              );


          return (
            matchesType &&
            matchesSearch
          );

        }
      );

    }, [
      applications,
      search,
      jobType,
    ]);


  /* =========================================================
     GROUP BY JOB
  ========================================================= */

  const groupedApplications =
    useMemo(() => {

      const groups:
        Record<
          string,
          {
            job: Job;
            applications:
              Application[];
          }
        > = {};


      filteredApplications.forEach(
        (
          application
        ) => {

          const job =
            application.jobs;


          if (!job) {
            return;
          }


          if (
            !groups[job.id]
          ) {

            groups[job.id] = {

              job,

              applications: [],

            };

          }


          groups[
            job.id
          ].applications.push(
            application
          );

        }
      );


      return Object.values(
        groups
      );

    }, [
      filteredApplications,
    ]);


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <p className="text-sm text-gray-500">
          Loading applications...
        </p>

      </main>

    );

  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <main className="min-h-screen bg-gray-100">


      {/* HEADER */}

      <header className="border-b bg-white">

        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">


          <div>

            <p className="text-xs text-gray-400">
              Company Portal
            </p>

            <h1 className="text-xl font-bold">
              Applications
            </h1>

          </div>


          <Link
            href="/company/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >

            <ArrowLeft
              size={17}
            />

            Dashboard

          </Link>

        </div>

      </header>


      <div className="mx-auto max-w-6xl p-5 sm:p-8">


        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">

            {error}

          </div>

        )}


        {/* ===================================================
            SEARCH + FILTER
        =================================================== */}

        <section className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-[1fr_230px]">


            {/* SEARCH */}

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search job title or candidate..."
                className="h-12 w-full rounded-xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

            </div>


            {/* FILTER */}

            <div className="relative">

              <Filter
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={
                  jobType
                }
                onChange={(
                  event
                ) =>
                  setJobType(
                    event.target.value
                  )
                }
                className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-orange-400"
              >

                <option value="All">
                  All Job Types
                </option>

                <option value="Full-time">
                  Full-time
                </option>

                <option value="Part-time">
                  Part-time
                </option>

                <option value="Contract">
                  Contract
                </option>

                <option value="Internship">
                  Internship
                </option>

              </select>

            </div>

          </div>

        </section>


        {/* ===================================================
            RESULT COUNT
        =================================================== */}

        <div className="mt-6 flex items-center justify-between">

          <div>

            <h2 className="font-bold">
              Job Applications
            </h2>

            <p className="mt-1 text-sm text-gray-400">

              {
                filteredApplications.length
              }{" "}

              candidate application
              {filteredApplications.length ===
              1
                ? ""
                : "s"}

            </p>

          </div>

        </div>


        {/* ===================================================
            GROUPED JOB APPLICATIONS
        =================================================== */}

        <div className="mt-5 space-y-6">

          {groupedApplications.length ===
          0 ? (

            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

              <Briefcase
                size={30}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 text-sm text-gray-400">
                No applications found.
              </p>

            </div>

          ) : (

            groupedApplications.map(
              (
                group
              ) => (

                <section
                  key={
                    group.job.id
                  }
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >


                  {/* JOB HEADER */}

                  <div className="border-b bg-gray-50 p-5">

                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                      <div>

                        <h3 className="font-bold text-gray-900">

                          {
                            group.job
                              .job_title
                          }

                        </h3>

                        <p className="mt-1 text-sm text-gray-400">

                          {
                            group.job
                              .job_category
                          }

                          {" · "}

                          {
                            group.job
                              .job_type
                          }

                        </p>

                      </div>


                      <span className="w-fit rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">

                        {
                          group.applications
                            .length
                        }{" "}

                        Candidate
                        {group.applications.length ===
                        1
                          ? ""
                          : "s"}

                      </span>

                    </div>

                  </div>


                  {/* CANDIDATES */}

                  <div>

                    {group.applications.map(
                      (
                        application
                      ) => {

                        const candidate =
                          application.candidates;


                        return (

                          <div
                            key={
                              application.id
                            }
                            className="flex flex-col gap-4 border-b p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
                          >


                            <div className="flex min-w-0 items-center gap-4">


                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">

                                {getInitials(
                                  candidate
                                    ?.full_name ||
                                    "Candidate"
                                )}

                              </div>


                              <div className="min-w-0">

                                <p className="truncate font-semibold">

                                  {candidate
                                    ?.full_name ||
                                    "Unknown Candidate"}

                                </p>


                                <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">

                                  <Mail
                                    size={13}
                                  />

                                  <span className="truncate">

                                    {candidate
                                      ?.email ||
                                      "No email"}

                                  </span>

                                </div>


                                <p className="mt-2 text-xs text-gray-500">

                                  Skills:{" "}

                                  {application.skills ||
                                    "Not provided"}

                                </p>

                              </div>

                            </div>


                            <div className="flex flex-wrap items-center gap-3">


                              <FitBadge
                                status={
                                  application.fit_status
                                }
                              />


                              <StatusBadge
                                status={
                                  application.status
                                }
                              />


                              <Link
                                href={`/company/applications/${application.id}`}
                                className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500"
                              >

                                View Candidate

                              </Link>

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                </section>

              )
            )

          )}

        </div>

      </div>

    </main>

  );
}


/* =========================================================
   FIT BADGE
========================================================= */

function FitBadge({
  status,
}: {
  status: string;
}) {

  const style =
    status === "Fit"

      ? "bg-green-50 text-green-600"

      : status === "Not Fit"

      ? "bg-red-50 text-red-600"

      : "bg-gray-100 text-gray-500";


  return (

    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}
    >

      {status}

    </span>

  );

}


/* =========================================================
   APPLICATION STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {

  return (

    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">

      {status}

    </span>

  );

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  name: string
) {

  return name
    .split(" ")
    .filter(Boolean)
    .map(
      (
        word
      ) =>
        word[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

    const value =
      (
        error as {
          message?: unknown;
        }
      ).message;


    if (
      typeof value ===
      "string"
    ) {

      return value;

    }

  }


  return "Unable to load applications.";

}