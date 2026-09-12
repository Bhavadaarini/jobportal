"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

type Company = {
  id: string;
  company_name: string;
};

type Job = {
  id: string;
  job_title: string;
  job_category: string;
  job_type: string;
  experience_required: string;
  number_of_openings: number;
  status: string;
  created_at: string;
};

type Application = {
  id: string;
  status: string;
  applied_at: string;

  candidates: {
    full_name: string;
    email: string;
  } | null;

  jobs: {
    job_title: string;
  } | null;
};

type Recruiter = {
  full_name: string;
  job_title: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function CompanyDashboard() {
  const router = useRouter();

  const [company, setCompany] =
    useState<Company | null>(null);

  const [recruiter, setRecruiter] =
    useState<Recruiter | null>(null);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [totalJobs, setTotalJobs] =
    useState(0);

  const [
    totalApplications,
    setTotalApplications,
  ] = useState(0);

  const [shortlisted, setShortlisted] =
    useState(0);

  const [
    newCandidates,
    setNewCandidates,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      const supabase =
        createClient();

      try {
        if (!cancelled) {
          setLoading(true);
        }

        /* =====================================================
           AUTH USER
        ===================================================== */

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

        /* =====================================================
           COMPANY

           Now loading:
           - id
           - company_name
        ===================================================== */

        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from("companies")
          .select(
            `
              id,
              company_name
            `
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (!companyData) {
          router.replace(
            "/company/register"
          );

          return;
        }

        const companyId =
          companyData.id;

        if (!cancelled) {
          setCompany({
            id:
              companyData.id,

            company_name:
              companyData.company_name,
          });
        }

        /* =====================================================
           RECRUITER
        ===================================================== */

        const {
          data: recruiterData,
          error: recruiterError,
        } = await supabase
          .from(
            "company_recruiters"
          )
          .select(
            "full_name, job_title"
          )
          .eq(
            "company_id",
            companyId
          )
          .limit(1)
          .maybeSingle();

        if (
          recruiterError
        ) {
          console.error(
            "Recruiter loading error:",
            recruiterError
          );
        }

        if (!cancelled) {
          setRecruiter(
            recruiterData ??
              null
          );
        }

        /* =====================================================
           JOBS
        ===================================================== */

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
            status,
            created_at
          `)
          .eq(
            "company_id",
            companyId
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

        if (jobsError) {
          throw jobsError;
        }

        const allJobs =
          jobsData ?? [];

        if (!cancelled) {
          setJobs(
            allJobs as Job[]
          );

          setTotalJobs(
            allJobs.length
          );
        }

        /* =====================================================
           APPLICATIONS
        ===================================================== */

        const {
          data:
            applicationData,

          error:
            applicationError,
        } = await supabase
          .from(
            "applications"
          )
          .select(`
            id,
            status,
            applied_at,

            candidates (
              full_name,
              email
            ),

            jobs!inner (
              job_title,
              company_id
            )
          `)
          .eq(
            "jobs.company_id",
            companyId
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

        /* =====================================================
           FORMAT APPLICATION DATA
        ===================================================== */

        const allApplications:
          Application[] = (
          applicationData ?? []
        ).map(
          (item) => {
            const row =
              item as unknown as {
                id: string;

                status: string;

                applied_at:
                  string;

                candidates:
                  | {
                      full_name:
                        string;

                      email:
                        string;
                    }
                  | null;

                jobs:
                  | {
                      job_title:
                        string;

                      company_id:
                        string;
                    }
                  | null;
              };

            return {
              id:
                row.id,

              status:
                row.status,

              applied_at:
                row.applied_at,

              candidates:
                row.candidates
                  ? {
                      full_name:
                        row
                          .candidates
                          .full_name,

                      email:
                        row
                          .candidates
                          .email,
                    }
                  : null,

              jobs:
                row.jobs
                  ? {
                      job_title:
                        row.jobs
                          .job_title,
                    }
                  : null,
            };
          }
        );

        if (!cancelled) {
          setApplications(
            allApplications
          );

          setTotalApplications(
            allApplications.length
          );

          setShortlisted(
            allApplications.filter(
              (
                application
              ) =>
                application.status ===
                "Shortlisted"
            ).length
          );

          setNewCandidates(
            allApplications.filter(
              (
                application
              ) =>
                application.status ===
                "New"
            ).length
          );
        }
      } catch (
        error: unknown
      ) {
        console.error(
          "Dashboard error:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* =========================================================
     REALTIME
  ========================================================= */

  useEffect(() => {
    const supabase =
      createClient();

    const channel =
      supabase
        .channel(
          "company-dashboard-realtime"
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "jobs",
          },
          () => {
            window.location.reload();
          }
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "applications",
          },
          () => {
            window.location.reload();
          }
        )

        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout =
    async () => {
      const supabase =
        createClient();

      await supabase.auth
        .signOut();

      router.replace(
        "/company/login"
      );

      router.refresh();
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <div className="text-sm text-gray-500">
          Loading dashboard...
        </div>

      </main>
    );
  }

  /* =========================================================
     USER NAME
  ========================================================= */

  const firstName =
    recruiter?.full_name
      ?.split(" ")[0] ||
    "there";

  const companyName =
    company?.company_name ||
    "Company";

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="flex h-16 items-center justify-between bg-white px-5 shadow-sm lg:hidden">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black font-bold text-white">
            J
          </div>

          <div>

            <p className="text-sm font-bold">
              {companyName}
            </p>

            <p className="text-xs text-gray-400">
              Company Portal
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/company/notifications"
            )
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100"
        >
          <span className="text-xl">
            🔔
          </span>
        </button>

      </header>

      <div className="flex">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="fixed hidden h-screen w-64 bg-white shadow-sm lg:block">

          {/* LOGO */}

          <div className="flex h-20 items-center gap-3 border-b px-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black font-bold text-white">
              J
            </div>

            <div>

              <p className="font-bold">
                JobPortal
              </p>

              <p className="text-xs text-gray-400">
                Company Portal
              </p>

            </div>

          </div>

          <SidebarMenu />

          {/* =================================================
              BOTTOM COMPANY + USER DETAILS
          ================================================= */}

          <div className="absolute bottom-0 w-full border-t p-5">

            {/* COMPANY NAME */}

            <div className="mb-4 rounded-xl bg-gray-50 p-3">

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Company
              </p>

              <p className="mt-1 truncate text-sm font-bold text-gray-800">
                {companyName}
              </p>

            </div>

            {/* USER */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">

                {getInitials(
                  recruiter
                    ?.full_name ||
                    "User"
                )}

              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold">

                  {recruiter
                    ?.full_name ||
                    "User"}

                </p>

                <p className="truncate text-xs text-gray-400">

                  {recruiter
                    ?.job_title ||
                    "HR"}

                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="mt-5 w-full rounded-lg py-2 text-left text-sm text-red-500 hover:bg-red-50"
            >
              🚪 Logout
            </button>

          </div>

        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <section className="w-full lg:ml-64">

          {/* =================================================
              TOP BAR
          ================================================= */}

          <header className="hidden h-20 items-center justify-between border-b bg-white px-8 lg:flex">

            {/* =================================================
                COMPANY NAME AT TOP
            ================================================= */}

            <div>

              <p className="text-xs font-medium text-gray-400">
                {companyName}
              </p>

              <h2 className="font-bold">
                Company Portal Dashboard
              </h2>

            </div>

            <div className="flex items-center gap-5">

              {/* NOTIFICATION */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/company/notifications"
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100"
              >
                <span className="text-xl">
                  🔔
                </span>
              </button>

              {/* PROFILE */}

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">

                  {getInitials(
                    recruiter
                      ?.full_name ||
                    "User"
                  )}

                </div>

                <div>

                  <p className="text-sm font-semibold">

                    {recruiter
                      ?.full_name ||
                      "User"}

                  </p>

                  <p className="text-xs text-gray-400">

                    {recruiter
                      ?.job_title ||
                      "HR"}

                  </p>

                </div>

              </div>

            </div>

          </header>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="p-5 sm:p-8">

            {/* WELCOME */}

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <p className="text-sm font-medium text-orange-500">
                  {companyName}
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">

                  Hello,{" "}
                  {firstName} 👋

                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Here is what is happening
                  with your hiring process.
                </p>

              </div>

              <Link
                href="/company/jobs/create"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-orange-500"
              >
                + Post New Job
              </Link>

            </div>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Total Jobs"
                value={totalJobs}
                icon="💼"
                color="orange"
              />

              <StatCard
                title="Total Applications"
                value={
                  totalApplications
                }
                icon="📄"
                color="blue"
              />

              <StatCard
                title="Shortlisted"
                value={shortlisted}
                icon="✓"
                color="green"
              />

              <StatCard
                title="New Candidates"
                value={newCandidates}
                icon="👥"
                color="purple"
              />

            </div>

            {/* =================================================
                JOBS + CHART
            ================================================= */}

            <div className="mt-6 grid gap-6 xl:grid-cols-3">

              {/* RECENT JOBS */}

              <div className="rounded-2xl bg-white shadow-sm xl:col-span-2">

                <div className="flex items-center justify-between border-b p-5">

                  <div>

                    <h2 className="font-bold">
                      Recent Job Posts
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Your recently posted jobs
                    </p>

                  </div>

                  <Link
                    href="/company/jobs"
                    className="text-sm font-semibold text-orange-500"
                  >
                    View all →
                  </Link>

                </div>

                {jobs.length ===
                0 ? (

                  <div className="p-10 text-center">

                    <p className="text-sm text-gray-500">
                      You have not posted
                      any jobs yet.
                    </p>

                    <Link
                      href="/company/jobs/create"
                      className="mt-4 inline-block text-sm font-semibold text-orange-500"
                    >
                      Create your first job →
                    </Link>

                  </div>

                ) : (

                  jobs
                    .slice(0, 5)
                    .map(
                      (job) => (
                        <Job
                          key={
                            job.id
                          }
                          job={job}
                        />
                      )
                    )

                )}

              </div>

              {/* APPLICATION CHART */}

              <ApplicationChart
                applications={
                  applications
                }
              />

            </div>

            {/* =================================================
                APPLICATIONS + QUICK ACTIONS
            ================================================= */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* RECENT APPLICATIONS */}

              <div className="rounded-2xl bg-white shadow-sm">

                <div className="flex items-center justify-between border-b p-5">

                  <div>

                    <h2 className="font-bold">
                      Recent Applications
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Latest candidates
                    </p>

                  </div>

                  <Link
                    href="/company/applications"
                    className="text-sm font-semibold text-orange-500"
                  >
                    View all
                  </Link>

                </div>

                {applications.length ===
                0 ? (

                  <div className="p-10 text-center text-sm text-gray-400">
                    No applications yet.
                  </div>

                ) : (

                  applications
                    .slice(0, 5)
                    .map(
                      (
                        application
                      ) => (
                        <Candidate
                          key={
                            application.id
                          }
                          application={
                            application
                          }
                        />
                      )
                    )

                )}

              </div>

              {/* QUICK ACTIONS */}

              <div className="rounded-2xl bg-white shadow-sm">

                <div className="border-b p-5">

                  <h2 className="font-bold">
                    Quick Actions
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Frequently used actions
                  </p>

                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">

                  <QuickAction
                    href="/company/jobs/create"
                    icon="＋"
                    title="Post New Job"
                    description="Create a job opening"
                  />

                  <QuickAction
                    href="/company/applications"
                    icon="👥"
                    title="Applications"
                    description="Review candidates"
                  />

                  <QuickAction
                    href="/company/profile"
                    icon="🏢"
                    title="Company Profile"
                    description="Update company details"
                  />

                  <QuickAction
                    href="/company/notifications"
                    icon="🔔"
                    title="Notifications"
                    description="View notifications"
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   SIDEBAR MENU
========================================================= */

function SidebarMenu() {
  return (
    <nav className="mt-8 px-4">

      <p className="mb-3 px-3 text-xs font-bold uppercase text-gray-400">
        Main Menu
      </p>

      <div className="space-y-1">

        <Link
          href="/company/dashboard"
          className="block rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
        >
          📊 &nbsp; Dashboard
        </Link>

        <Link
          href="/company/jobs"
          className="block rounded-xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-100"
        >
          💼 &nbsp; Jobs
        </Link>

        <Link
          href="/company/applications"
          className="block rounded-xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-100"
        >
          👥 &nbsp; Applications
        </Link>

        <Link
          href="/company/profile"
          className="block rounded-xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-100"
        >
          🏢 &nbsp; Company Profile
        </Link>

        <Link
          href="/company/notifications"
          className="block rounded-xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-100"
        >
          🔔 &nbsp; Notifications
        </Link>

      </div>

    </nav>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  const background:
    Record<
      string,
      string
    > = {
    orange:
      "bg-orange-50 text-orange-500",

    blue:
      "bg-blue-50 text-blue-500",

    green:
      "bg-green-50 text-green-500",

    purple:
      "bg-purple-50 text-purple-500",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
          background[color]
        }`}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm text-gray-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   JOB
========================================================= */

function Job({
  job,
}: {
  job: Job;
}) {
  return (
    <div className="flex flex-col gap-4 border-b p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
          💼
        </div>

        <div>

          <h3 className="text-sm font-bold">
            {job.job_title}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            {job.job_category}
          </p>

          <p className="mt-2 text-xs text-gray-400">
            {job.job_type} ·{" "}
            {job.experience_required}
          </p>

        </div>

      </div>

      <div className="flex items-center gap-4">

        <div>

          <p className="text-xs text-gray-400">
            Openings
          </p>

          <p className="text-sm font-bold">
            {job.number_of_openings}
          </p>

        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            job.status ===
            "Active"
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {job.status}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   APPLICATION CHART
========================================================= */

function ApplicationChart({
  applications,
}: {
  applications: Application[];
}) {
  const newCount =
    applications.filter(
      (a) =>
        a.status === "New"
    ).length;

  const shortlisted =
    applications.filter(
      (a) =>
        a.status ===
        "Shortlisted"
    ).length;

  const interview =
    applications.filter(
      (a) =>
        a.status ===
        "Interview"
    ).length;

  const rejected =
    applications.filter(
      (a) =>
        a.status ===
        "Rejected"
    ).length;

  const total =
    applications.length;

  const newPercent =
    total > 0
      ? (newCount / total) *
        100
      : 0;

  const shortlistedPercent =
    total > 0
      ? (shortlisted / total) *
        100
      : 0;

  const interviewPercent =
    total > 0
      ? (interview / total) *
        100
      : 0;

  const chart = {
    background:
      total === 0
        ? "#e5e7eb"
        : `conic-gradient(
          #f97316 0% ${newPercent}%,
          #22c55e ${newPercent}% ${
            newPercent +
            shortlistedPercent
          }%,
          #3b82f6 ${
            newPercent +
            shortlistedPercent
          }% ${
            newPercent +
            shortlistedPercent +
            interviewPercent
          }%,
          #d1d5db ${
            newPercent +
            shortlistedPercent +
            interviewPercent
          }% 100%
        )`,
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">

      <h2 className="font-bold">
        Applications
      </h2>

      <p className="mt-1 text-xs text-gray-400">
        Application overview
      </p>

      <div
        className="mx-auto mt-8 flex h-44 w-44 items-center justify-center rounded-full"
        style={chart}
      >

        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">

          <p className="text-3xl font-bold">
            {total}
          </p>

          <p className="text-xs text-gray-400">
            Applications
          </p>

        </div>

      </div>

      <div className="mt-8 space-y-4">

        <Status
          color="bg-orange-500"
          name="New"
          value={newCount}
        />

        <Status
          color="bg-green-500"
          name="Shortlisted"
          value={shortlisted}
        />

        <Status
          color="bg-blue-500"
          name="Interview"
          value={interview}
        />

        <Status
          color="bg-gray-300"
          name="Rejected"
          value={rejected}
        />

      </div>

    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function Status({
  color,
  name,
  value,
}: {
  color: string;
  name: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-2">

        <span
          className={`h-2.5 w-2.5 rounded-full ${color}`}
        />

        <span className="text-sm text-gray-500">
          {name}
        </span>

      </div>

      <span className="text-sm font-bold">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   CANDIDATE
========================================================= */

function Candidate({
  application,
}: {
  application: Application;
}) {
  const candidateName =
    application.candidates
      ?.full_name ||
    "Unknown Candidate";

  const initials =
    getInitials(
      candidateName
    );

  return (
    <div className="flex items-center gap-4 border-b p-4 last:border-b-0">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
        {initials}
      </div>

      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-semibold">
          {candidateName}
        </p>

        <p className="truncate text-xs text-gray-400">
          {application.jobs
            ?.job_title ||
            "Job not available"}
        </p>

      </div>

      <div className="text-right">

        <p className="text-xs text-gray-400">
          {formatDate(
            application.applied_at
          )}
        </p>

        <Link
          href={`/company/application/${application.id}`}
          className="mt-1 inline-block text-xs font-semibold text-orange-500"
        >
          View
        </Link>

      </div>

    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border p-4 text-left hover:border-orange-300 hover:bg-orange-50"
    >

      <span className="text-xl">
        {icon}
      </span>

      <span>

        <span className="block text-sm font-semibold">
          {title}
        </span>

        <span className="mt-1 block text-xs text-gray-400">
          {description}
        </span>

      </span>

    </Link>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  name: string
) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}