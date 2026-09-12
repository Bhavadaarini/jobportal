"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Lock,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

type Company = {
  id: string;
  company_name: string;
  industry: string;
  logo_url: string | null;
  description: string;
  address: string;
};

type Recruiter = {
  id: string;
  full_name: string;
  job_title: string;
  phone: string;
};

type EditableCompanyField =
  | "industry"
  | "description"
  | "address";

type EditableRecruiterField =
  | "full_name"
  | "job_title"
  | "phone";

/* =========================================================
   PAGE
========================================================= */

export default function CompanyProfilePage() {
  const router = useRouter();

  const [company, setCompany] =
    useState<Company | null>(null);

  const [recruiter, setRecruiter] =
    useState<Recruiter | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const supabase =
          createClient();

        /* =====================================================
           GET AUTH USER
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
           GET COMPANY
        ===================================================== */

        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from("companies")
          .select(`
            id,
            company_name,
            industry,
            logo_url,
            description,
            address
          `)
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (!companyData) {
          if (mounted) {
            setCompany(null);
            setRecruiter(null);
          }

          return;
        }

        /*
         * Convert nullable database values into
         * safe strings for form fields.
         */

        const formattedCompany: Company = {
          id: companyData.id,

          company_name:
            companyData.company_name ??
            "",

          industry:
            companyData.industry ??
            "",

          logo_url:
            companyData.logo_url ??
            null,

          description:
            companyData.description ??
            "",

          address:
            companyData.address ??
            "",
        };

        if (mounted) {
          setCompany(
            formattedCompany
          );
        }

        /* =====================================================
           GET RECRUITER
        ===================================================== */

        const {
          data: recruiterData,
          error: recruiterError,
        } = await supabase
          .from(
            "company_recruiters"
          )
          .select(`
            id,
            full_name,
            job_title,
            phone
          `)
          .eq(
            "company_id",
            companyData.id
          )
          .limit(1)
          .maybeSingle();

        if (recruiterError) {
          throw recruiterError;
        }

        if (
          mounted &&
          recruiterData
        ) {
          const formattedRecruiter: Recruiter =
            {
              id:
                recruiterData.id,

              full_name:
                recruiterData.full_name ??
                "",

              job_title:
                recruiterData.job_title ??
                "",

              phone:
                recruiterData.phone ??
                "",
            };

          setRecruiter(
            formattedRecruiter
          );
        } else if (mounted) {
          setRecruiter(null);
        }
      } catch (err: unknown) {
        console.error(
          "Profile loading error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          getErrorMessage(err)
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =========================================================
     UPDATE COMPANY LOCAL STATE

     Company name is NOT editable.
  ========================================================= */

  const updateCompany = (
    field: EditableCompanyField,
    value: string
  ) => {
    setCompany((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  /* =========================================================
     UPDATE RECRUITER LOCAL STATE
  ========================================================= */

  const updateRecruiter = (
    field: EditableRecruiterField,
    value: string
  ) => {
    setRecruiter((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const saveProfile =
    async () => {
      if (!company) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setMessage("");

        const supabase =
          createClient();

        /* =====================================================
           VERIFY USER
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
           VALIDATE COMPANY
        ===================================================== */

        if (
          !company.industry.trim()
        ) {
          setError(
            "Industry is required."
          );
          return;
        }

        if (
          !company.address.trim()
        ) {
          setError(
            "Company address is required."
          );
          return;
        }

        if (
          !company.description.trim()
        ) {
          setError(
            "Company description is required."
          );
          return;
        }

        /* =====================================================
           UPDATE COMPANY

           IMPORTANT:
           company_name is intentionally NOT updated.
        ===================================================== */

        const {
          error: companyError,
        } = await supabase
          .from("companies")
          .update({
            industry:
              company.industry.trim(),

            description:
              company.description.trim(),

            address:
              company.address.trim(),

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            company.id
          )
          .eq(
            "user_id",
            user.id
          );

        if (companyError) {
          throw companyError;
        }

        /* =====================================================
           UPDATE RECRUITER
        ===================================================== */

        if (recruiter) {
          if (
            !recruiter.full_name.trim()
          ) {
            setError(
              "Recruiter name is required."
            );
            return;
          }

          if (
            !recruiter.job_title.trim()
          ) {
            setError(
              "Job title is required."
            );
            return;
          }

          if (
            !recruiter.phone.trim()
          ) {
            setError(
              "Phone number is required."
            );
            return;
          }

          const {
            error: recruiterError,
          } = await supabase
            .from(
              "company_recruiters"
            )
            .update({
              full_name:
                recruiter.full_name.trim(),

              job_title:
                recruiter.job_title.trim(),

              phone:
                recruiter.phone.trim(),

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              recruiter.id
            )
            .eq(
              "company_id",
              company.id
            );

          if (recruiterError) {
            throw recruiterError;
          }
        }

        setMessage(
          "Company profile updated successfully."
        );
      } catch (err: unknown) {
        console.error(
          "Profile update error:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-5 sm:p-8">

        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-12 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="mt-4 text-sm text-gray-400">
            Loading company profile...
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
     COMPANY PROFILE NOT FOUND
  ========================================================= */

  if (!company) {
    return (
      <main className="min-h-screen bg-gray-100 p-5 sm:p-8">

        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">

            <Building2
              size={25}
            />

          </div>

          <h1 className="mt-5 text-xl font-bold text-black">
            Company profile not found
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            We could not find a company
            profile for this account.
          </p>

          <Link
            href="/company/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
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

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">

          <div>

            <p className="text-xs font-medium text-orange-500">
              {company.company_name}
            </p>

            <h1 className="text-xl font-bold text-black">
              Company Profile
            </h1>

          </div>

          <Link
            href="/company/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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

      <div className="mx-auto max-w-5xl p-5 sm:p-8">

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-600">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ===================================================
            COMPANY INFORMATION
        =================================================== */}

        <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
              <Building2
                size={21}
              />
            </div>

            <div>

              <h2 className="font-bold text-black">
                Company Information
              </h2>

              <p className="text-xs text-gray-400">
                Manage your company details.
              </p>

            </div>

          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">

            {/* =================================================
                COMPANY NAME - READ ONLY
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Company Name
              </label>

              <div className="relative">

                <Building2
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    company.company_name
                  }
                  readOnly
                  className="h-12 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 py-3 pl-11 pr-11 text-sm font-semibold text-gray-600 outline-none"
                />

                <Lock
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

              </div>

              <p className="mt-2 text-xs text-gray-400">
                Company name cannot be
                changed.
              </p>

            </div>

            {/* =================================================
                INDUSTRY
            ================================================= */}

            <ProfileInput
              label="Industry"
              value={
                company.industry
              }
              onChange={(value) =>
                updateCompany(
                  "industry",
                  value
                )
              }
            />

            {/* =================================================
                ADDRESS
            ================================================= */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Company Address
              </label>

              <div className="relative">

                <MapPin
                  size={17}
                  className="absolute left-4 top-4 text-gray-400"
                />

                <textarea
                  rows={3}
                  value={
                    company.address
                  }
                  onChange={(event) =>
                    updateCompany(
                      "address",
                      event.target.value
                    )
                  }
                  className="w-full resize-none rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

              </div>

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Company Description
              </label>

              <textarea
                rows={6}
                value={
                  company.description
                }
                onChange={(event) =>
                  updateCompany(
                    "description",
                    event.target.value
                  )
                }
                className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

            </div>

          </div>

        </section>

        {/* ===================================================
            RECRUITER INFORMATION
        =================================================== */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">

              <UserRound
                size={21}
              />

            </div>

            <div>

              <h2 className="font-bold text-black">
                Recruiter Information
              </h2>

              <p className="text-xs text-gray-400">
                Manage your account administrator
                details.
              </p>

            </div>

          </div>

          {recruiter ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <ProfileInput
                label="Full Name"
                value={
                  recruiter.full_name
                }
                onChange={(value) =>
                  updateRecruiter(
                    "full_name",
                    value
                  )
                }
              />

              <ProfileInput
                label="Job Title"
                value={
                  recruiter.job_title
                }
                onChange={(value) =>
                  updateRecruiter(
                    "job_title",
                    value
                  )
                }
              />

              <ProfileInput
                label="Phone Number"
                value={
                  recruiter.phone
                }
                onChange={(value) =>
                  updateRecruiter(
                    "phone",
                    value
                  )
                }
              />

            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-gray-50 p-5">

              <p className="text-sm text-gray-400">
                No recruiter information
                found.
              </p>

            </div>
          )}

        </section>

        {/* ===================================================
            ACTION BUTTONS
        =================================================== */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

          <Link
            href="/company/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft
              size={17}
            />

            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={
              saveProfile
            }
            disabled={
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save
              size={17}
            />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   PROFILE INPUT COMPONENT
========================================================= */

function ProfileInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-gray-800">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />

    </div>
  );
}

/* =========================================================
   SAFE ERROR MESSAGE

   This fixes errors related to:
   "Property 'message' does not exist on type unknown"
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
    "string"
  ) {
    return error;
  }

  return "Something went wrong. Please try again.";
}