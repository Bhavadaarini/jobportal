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
  Mail,
  Phone,
  MapPin,
  FileText,
  CalendarDays,
  ExternalLink,
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
  phone: string | null;
  address: string | null;
  about: string | null;
  resume_url: string | null;
  resume_name: string | null;
  created_at: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function CandidateProfilePage() {
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
    resumeSignedUrl,
    setResumeSignedUrl,
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
    error,
    setError,
  ] =
    useState("");

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  useEffect(() => {
    let mounted =
      true;

    const loadProfile =
      async () => {
        const supabase =
          createClient();

        try {
          setLoading(
            true
          );

          setError("");

          /* =================================================
             GET LOGGED-IN USER
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
              email,
              phone,
              address,
              about,
              resume_url,
              resume_name,
              created_at
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

          const formattedCandidate:
            Candidate = {
              id:
                candidateData.id,

              full_name:
                candidateData.full_name ??
                "",

              email:
                candidateData.email ??
                "",

              phone:
                candidateData.phone ??
                null,

              address:
                candidateData.address ??
                null,

              about:
                candidateData.about ??
                null,

              resume_url:
                candidateData.resume_url ??
                null,

              resume_name:
                candidateData.resume_name ??
                null,

              created_at:
                candidateData.created_at,
            };

          if (
            mounted
          ) {
            setCandidate(
              formattedCandidate
            );
          }

          /* =================================================
             CREATE SIGNED URL FOR RESUME

             Resume bucket is private.
          ================================================= */

          if (
            candidateData.resume_url
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
                  candidateData.resume_url,
                  60 * 10
                );

            if (
              signedError
            ) {
              console.error(
                "Resume signed URL error:",
                signedError
              );
            }

            if (
              mounted &&
              signedData
            ) {
              setResumeSignedUrl(
                signedData.signedUrl
              );
            }
          }
        } catch (
          err: unknown
        ) {
          console.error(
            "Candidate profile error:",
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
          if (
            mounted
          ) {
            setLoading(
              false
            );
          }
        }
      };

    loadProfile();

    return () => {
      mounted =
        false;
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
            Loading profile...
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
     PROFILE NOT FOUND
  ========================================================= */

  if (
    !candidate
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-5">

        <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm">

          <UserRound
            size={36}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-4 text-xl font-bold">
            Candidate Profile Not Found
          </h1>

          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}

          <Link
            href="/candidate/dashboard"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Back to Dashboard
          </Link>

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

        {/* LOGO */}

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

        {/* MENU */}

        <nav className="mt-8 px-4">

          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">

            <Link
              href="/candidate/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              <LayoutDashboard
                size={18}
              />

              Dashboard
            </Link>

            <Link
              href="/candidate/offers"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              <BriefcaseBusiness
                size={18}
              />

              Offers
            </Link>

            <Link
              href="/candidate/applications"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              <ClipboardList
                size={18}
              />

              My Applications
            </Link>

            <Link
              href="/candidate/profile"
              className="flex items-center gap-3 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              <UserRound
                size={18}
              />

              Profile
            </Link>

          </div>

        </nav>

        {/* USER DETAILS */}

        <div className="absolute bottom-0 w-full border-t p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">

              {getInitials(
                candidate.full_name
              )}

            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-gray-800">
                {candidate.full_name}
              </p>

              <p className="truncate text-xs text-gray-400">
                {candidate.email}
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
          MAIN
      ===================================================== */}

      <section className="lg:ml-64">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="border-b bg-white">

          <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-5 py-4 sm:px-8">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                Candidate Portal
              </p>

              <h1 className="mt-1 text-xl font-bold text-black">
                My Profile
              </h1>

              <p className="mt-1 text-xs text-gray-400">
                Personal information provided during registration
              </p>

            </div>

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
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500"
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

              <Link
                href="/candidate/profile"
                className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                <UserRound
                  size={16}
                />

                Profile
              </Link>

            </div>

          </div>

        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="mx-auto max-w-6xl p-5 sm:p-8">

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <section className="rounded-2xl bg-black p-6 text-white sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">

                {getInitials(
                  candidate.full_name
                )}

              </div>

              <div>

                <p className="text-sm text-gray-400">
                  Candidate
                </p>

                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                  {candidate.full_name}
                </h2>

                <p className="mt-2 text-sm text-gray-300">
                  {candidate.email}
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">

            <div>

              <h2 className="text-lg font-bold text-black">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Details provided when you created your account.
              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {/* FULL NAME */}

              <ProfileItem
                icon={
                  <UserRound
                    size={18}
                  />
                }
                label="Full Name"
                value={
                  candidate.full_name
                }
              />

              {/* EMAIL */}

              <ProfileItem
                icon={
                  <Mail
                    size={18}
                  />
                }
                label="Email ID"
                value={
                  candidate.email
                }
              />

              {/* PHONE */}

              <ProfileItem
                icon={
                  <Phone
                    size={18}
                  />
                }
                label="Phone Number"
                value={
                  candidate.phone ||
                  "Not provided"
                }
              />

              {/* CREATED */}

              <ProfileItem
                icon={
                  <CalendarDays
                    size={18}
                  />
                }
                label="Account Created"
                value={
                  formatDate(
                    candidate.created_at
                  )
                }
              />

            </div>

          </section>

          {/* =================================================
              ADDRESS
          ================================================= */}

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <MapPin
                  size={19}
                />
              </div>

              <div>

                <h2 className="font-bold">
                  Address
                </h2>

                <p className="text-xs text-gray-400">
                  Candidate contact address
                </p>

              </div>

            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-5">

              <p className="whitespace-pre-line text-sm leading-6 text-gray-700">

                {candidate.address ||
                  "Address not provided"}

              </p>

            </div>

          </section>

          {/* =================================================
              ABOUT
          ================================================= */}

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <UserRound
                  size={19}
                />
              </div>

              <div>

                <h2 className="font-bold">
                  About Me
                </h2>

                <p className="text-xs text-gray-400">
                  Candidate profile description
                </p>

              </div>

            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-5">

              <p className="whitespace-pre-line text-sm leading-6 text-gray-700">

                {candidate.about ||
                  "About information not provided"}

              </p>

            </div>

          </section>

          {/* =================================================
              RESUME
          ================================================= */}

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">

                <FileText
                  size={19}
                />

              </div>

              <div>

                <h2 className="font-bold">
                  Resume
                </h2>

                <p className="text-xs text-gray-400">
                  Resume uploaded during registration
                </p>

              </div>

            </div>

            {candidate.resume_name ? (

              <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-gray-200 p-5 sm:flex-row sm:items-center">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">

                    <FileText
                      size={21}
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-gray-800">
                      {candidate.resume_name}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Candidate Resume
                    </p>

                  </div>

                </div>

                {resumeSignedUrl ? (

                  <a
                    href={
                      resumeSignedUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-orange-500"
                  >
                    <ExternalLink
                      size={16}
                    />

                    View Resume
                  </a>

                ) : (

                  <button
                    type="button"
                    disabled
                    className="h-11 cursor-not-allowed rounded-xl bg-gray-100 px-5 text-sm font-semibold text-gray-400"
                  >
                    Resume unavailable
                  </button>

                )}

              </div>

            ) : (

              <div className="mt-5 rounded-xl bg-gray-50 p-6 text-center">

                <FileText
                  size={28}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 text-sm text-gray-400">
                  No resume uploaded.
                </p>

              </div>

            )}

          </section>

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   PROFILE ITEM
========================================================= */

function ProfileItem({
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
    <div className="rounded-xl bg-gray-50 p-5">

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">

        {icon}

        {label}

      </div>

      <p className="mt-3 break-words text-sm font-semibold text-gray-800">

        {value}

      </p>

    </div>
  );
}

/* =========================================================
   INITIALS
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
        "long",

      year:
        "numeric",
    }
  );
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

  return "Unable to load candidate profile.";
}