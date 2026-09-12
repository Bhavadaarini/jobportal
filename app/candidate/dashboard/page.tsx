"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  UserRound,
  LogOut,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

type Candidate = {
  id: string;
  full_name: string;
  email: string;
};

type Application = {
  id: string;
  status: string;
  applied_at: string;

  jobs:
    | {
        job_title: string;
        job_type: string;
      }
    | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function CandidateDashboardPage() {
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
    availableOffers,
    setAvailableOffers,
  ] =
    useState(0);

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

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadDashboard =
      async () => {
        const supabase =
          createClient();

        try {
          setLoading(true);

          setError("");

          /* =================================================
             GET USER
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
              "/candidate/login"
            );

            return;
          }

          /* =================================================
             GET CANDIDATE
          ================================================= */

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

          /* =================================================
             GET ACTIVE OFFERS

             Only count jobs that are:
             Active
             AND not expired
          ================================================= */

          const currentTime =
            new Date()
              .toISOString();

          const {
            data:
              jobsData,

            error:
              jobsError,
          } = await supabase
            .from("jobs")
            .select(`
              id,
              status,
              expires_at
            `)
            .eq(
              "status",
              "Active"
            )
            .gt(
              "expires_at",
              currentTime
            );

          if (
            jobsError
          ) {
            throw jobsError;
          }

          /* =================================================
             GET APPLICATIONS
          ================================================= */

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

              jobs (
                job_title,
                job_type
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

          /* =================================================
             FORMAT APPLICATIONS
          ================================================= */

          const formattedApplications:
            Application[] =
            (
              applicationData ??
              []
            ).map(
              (
                item
              ) => {
                const row =
                  item as unknown as {
                    id: string;

                    status: string;

                    applied_at:
                      string;

                    jobs:
                      | {
                          job_title:
                            string;

                          job_type:
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

                  jobs:
                    row.jobs ??
                    null,
                };
              }
            );

          if (
            !mounted
          ) {
            return;
          }

          /* =================================================
             SET STATE
          ================================================= */

          setCandidate({
            id:
              candidateData.id,

            full_name:
              candidateData.full_name,

            email:
              candidateData.email,
          });

          setAvailableOffers(
            jobsData?.length ??
              0
          );

          setApplications(
            formattedApplications
          );
        } catch (
          err: unknown
        ) {
          console.error(
            "Candidate dashboard error:",
            err
          );

          if (
            !mounted
          ) {
            return;
          }

          setError(
            getErrorMessage(
              err
            )
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

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
        "/candidate/login"
      );

      router.refresh();
    };

  /* =========================================================
     STATISTICS
  ========================================================= */

  const shortlisted =
    applications.filter(
      (
        application
      ) =>
        application.status ===
        "Shortlisted"
    ).length;

  const interviews =
    applications.filter(
      (
        application
      ) =>
        application.status ===
        "Interview"
    ).length;

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="mt-4 text-sm text-gray-500">
            Loading dashboard...
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r bg-white lg:block">

        {/* ===================================================
            LOGO
        =================================================== */}

        <div className="flex h-20 items-center gap-3 border-b px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black font-bold text-white">
            J
          </div>

          <div>

            <p className="font-bold text-black">
              JobPortal
            </p>

            <p className="text-xs text-gray-400">
              Candidate Portal
            </p>

          </div>

        </div>

        {/* ===================================================
            MENU
        =================================================== */}

        <nav className="mt-8 px-4">

          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">

            {/* DASHBOARD */}

            <Link
              href="/candidate/dashboard"
              className="flex items-center gap-3 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              <LayoutDashboard
                size={18}
              />

              Dashboard
            </Link>

            {/* OFFERS */}

            <Link
              href="/candidate/offers"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              <BriefcaseBusiness
                size={18}
              />

              Offers
            </Link>

            {/* MY APPLICATIONS */}

            <Link
              href="/candidate/applications"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              <ClipboardList
                size={18}
              />

              My Applications
            </Link>

            {/* PROFILE */}

            <Link
              href="/candidate/profile"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              <UserRound
                size={18}
              />

              Profile
            </Link>

          </div>

        </nav>

        {/* ===================================================
            USER DETAILS
        =================================================== */}

        <div className="absolute bottom-0 w-full border-t p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">

              {getInitials(
                candidate
                  ?.full_name ||
                  "Candidate"
              )}

            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-gray-800">

                {candidate
                  ?.full_name ||
                  "Candidate"}

              </p>

              <p className="truncate text-xs text-gray-400">

                {candidate
                  ?.email ||
                  ""}

              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="mt-5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            <LogOut
              size={17}
            />

            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="lg:ml-64">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="border-b bg-white">

          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                Candidate Portal
              </p>

              <h1 className="mt-1 text-xl font-bold text-black">
                Dashboard
              </h1>

              <p className="mt-1 text-xs text-gray-400">
                Overview of your job search and applications
              </p>

            </div>

            {/* MOBILE LOGOUT */}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 lg:hidden"
            >
              <LogOut
                size={18}
              />
            </button>

          </div>

          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <div className="overflow-x-auto border-t px-4 py-3 lg:hidden">

            <div className="flex min-w-max gap-2">

              <Link
                href="/candidate/dashboard"
                className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                <LayoutDashboard
                  size={16}
                />

                Dashboard
              </Link>

              <Link
                href="/candidate/offers"
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500"
              >
                <BriefcaseBusiness
                  size={16}
                />

                Offers
              </Link>

              <Link
                href="/candidate/applications"
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500"
              >
                <ClipboardList
                  size={16}
                />

                Applications
              </Link>

            </div>

          </div>

        </header>

        {/* ===================================================
            DASHBOARD CONTENT
        =================================================== */}

        <div className="mx-auto max-w-7xl p-5 sm:p-8">

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              WELCOME
          ================================================= */}

          <section className="rounded-2xl bg-black p-6 text-white sm:p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">

                <UserRound
                  size={26}
                />

              </div>

              <div>

                <p className="text-sm text-gray-400">
                  Welcome back
                </p>

                <h2 className="mt-1 text-2xl font-bold">

                  {candidate
                    ?.full_name ||
                    "Candidate"}

                </h2>

                <p className="mt-1 text-sm text-gray-400">

                  {candidate
                    ?.email ||
                    ""}

                </p>

              </div>

            </div>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-gray-300">

              Discover new job opportunities, submit applications and track your recruitment progress.

            </p>

          </section>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Available Offers"
              value={
                availableOffers
              }
              icon={
                <BriefcaseBusiness
                  size={20}
                />
              }
            />

            <StatCard
              title="Applied Jobs"
              value={
                applications.length
              }
              icon={
                <ClipboardList
                  size={20}
                />
              }
            />

            <StatCard
              title="Shortlisted"
              value={
                shortlisted
              }
              icon={
                <CheckCircle2
                  size={20}
                />
              }
            />

            <StatCard
              title="Interviews"
              value={
                interviews
              }
              icon={
                <CalendarClock
                  size={20}
                />
              }
            />

          </div>

          {/* =================================================
              MODULES
          ================================================= */}

          <div className="mt-7 grid gap-5 md:grid-cols-2">

            {/* OFFERS MODULE */}

            <Link
              href="/candidate/offers"
              className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500">

                <BriefcaseBusiness
                  size={22}
                />

              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Job Offers
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">

                Explore active job opportunities posted by companies and apply for positions matching your skills.

              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-orange-500">

                View Offers

                <ArrowRight
                  size={16}
                />

              </div>

            </Link>

            {/* APPLICATION MODULE */}

            <Link
              href="/candidate/applications"
              className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">

                <ClipboardList
                  size={22}
                />

              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                My Applications
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">

                View jobs you have already applied for and monitor your application status.

              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-orange-500">

                View Applications

                <ArrowRight
                  size={16}
                />

              </div>

            </Link>

          </div>

          {/* =================================================
              RECENT APPLICATIONS
          ================================================= */}

          <section className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm">

            <div className="flex items-center justify-between border-b p-5">

              <div>

                <h2 className="font-bold text-gray-900">
                  Recent Applications
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Your latest submitted applications
                </p>

              </div>

              <Link
                href="/candidate/applications"
                className="text-sm font-semibold text-orange-500"
              >
                View All →
              </Link>

            </div>

            {/* NO APPLICATIONS */}

            {applications.length ===
            0 ? (

              <div className="p-10 text-center">

                <ClipboardList
                  size={30}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-4 text-sm text-gray-400">
                  You have not applied for any jobs yet.
                </p>

                <Link
                  href="/candidate/offers"
                  className="mt-4 inline-block text-sm font-semibold text-orange-500"
                >
                  Browse Job Offers →
                </Link>

              </div>

            ) : (

              applications
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    application
                  ) => (

                    <div
                      key={
                        application.id
                      }
                      className="flex flex-col justify-between gap-3 border-b p-5 last:border-b-0 sm:flex-row sm:items-center"
                    >

                      <div>

                        <p className="font-semibold text-gray-900">

                          {application.jobs
                            ?.job_title ||
                            "Job"}

                        </p>

                        <p className="mt-1 text-xs text-gray-400">

                          {application.jobs
                            ?.job_type ||
                            ""}

                          {application.applied_at
                            ? ` · Applied ${formatDate(
                                application.applied_at
                              )}`
                            : ""}

                        </p>

                      </div>

                      <ApplicationStatus
                        status={
                          application.status
                        }
                      />

                    </div>

                  )
                )

            )}

          </section>

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon:
    React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-black">
            {value}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">

          {icon}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   APPLICATION STATUS
========================================================= */

function ApplicationStatus({
  status,
}: {
  status: string;
}) {
  const className =
    status ===
    "New"
      ? "bg-blue-50 text-blue-600"

      : status ===
        "Shortlisted"
      ? "bg-green-50 text-green-600"

      : status ===
        "Interview"
      ? "bg-orange-50 text-orange-600"

      : status ===
        "Hired"
      ? "bg-purple-50 text-purple-600"

      : status ===
        "Rejected"
      ? "bg-red-50 text-red-600"

      : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   GET INITIALS
========================================================= */

function getInitials(
  name: string
): string {
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
    .slice(
      0,
      2
    )
    .toUpperCase();
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  value: string
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
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

  return "Unable to load dashboard.";
}