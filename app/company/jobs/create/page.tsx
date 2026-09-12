"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  Briefcase,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function CreateJobPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    jobTitle: "",
    jobCategory: "",
    otherJobCategory: "",
    jobType: "",
    experienceRequired: "",
    numberOfOpenings: "1",
    jobDescription: "",
  });

  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  const updateField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const jobDescriptionWordCount =
    countWords(
      form.jobDescription
    );

  const otherCategoryWordCount =
    countWords(
      form.otherJobCategory
    );

  /* =========================================================
     CREATE JOB
  ========================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase =
      createClient();

    try {
      /* =====================================================
         GET LOGGED-IN USER
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

      /* =====================================================
         VALIDATION
      ===================================================== */

      if (
        !form.jobTitle.trim() ||
        !form.jobCategory.trim() ||
        !form.jobType.trim() ||
        !form.experienceRequired.trim() ||
        !form.numberOfOpenings.trim() ||
        !form.jobDescription.trim()
      ) {
        throw new Error(
          "Please fill in all required fields."
        );
      }

      /* OTHER CATEGORY VALIDATION */

      if (
        form.jobCategory === "Other" &&
        !form.otherJobCategory.trim()
      ) {
        throw new Error(
          "Please enter the job category."
        );
      }

      /* EXPERIENCE VALIDATION */

      if (
        !/^\d+$/.test(
          form.experienceRequired
        )
      ) {
        throw new Error(
          "Experience Required must contain numbers only."
        );
      }

      /* DESCRIPTION WORD LIMIT */

      if (
        jobDescriptionWordCount >
        200
      ) {
        throw new Error(
          "Job Description cannot exceed 200 words."
        );
      }

      /* OTHER CATEGORY WORD LIMIT */

      if (
        form.jobCategory === "Other" &&
        otherCategoryWordCount > 15
      ) {
        throw new Error(
          "Other job category cannot exceed 15 words."
        );
      }

      /* NUMBER OF OPENINGS */

      const openings =
        Number(
          form.numberOfOpenings
        );

      if (
        Number.isNaN(
          openings
        ) ||
        openings < 1
      ) {
        throw new Error(
          "Number of openings must be at least 1."
        );
      }

      /* =====================================================
         CREATE JOB

         IMPORTANT:

         Every new job starts as Active.

         There is NO automatic 3-day expiry.

         Company can later:
         Active -> Closed
         Closed -> Active

         from the company jobs page.
      ===================================================== */

      const {
        error: jobError,
      } = await supabase
        .from("jobs")
        .insert({
          company_id:
            company.id,

          job_title:
            form.jobTitle.trim(),

          job_category:
            form.jobCategory ===
            "Other"
              ? form.otherJobCategory.trim()
              : form.jobCategory.trim(),

          job_type:
            form.jobType.trim(),

          experience_required:
            form.experienceRequired.trim(),

          number_of_openings:
            openings,

          job_description:
            form.jobDescription.trim(),

          status:
            "Active",
        });

      if (jobError) {
        throw jobError;
      }

      /* =====================================================
         GO TO COMPANY JOBS PAGE
      ===================================================== */

      router.replace(
        "/company/jobs"
      );

      router.refresh();

    } catch (
      error: unknown
    ) {
      console.error(
        "Error creating job:",
        error
      );

      setError(
        getErrorMessage(
          error
        )
      );

    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">

          <div className="flex items-center gap-3">

            <Link
              href="/company/jobs"
              className="flex h-10 w-10 items-center justify-center rounded-xl border text-gray-500 transition hover:bg-gray-50"
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
                Create New Job
              </h1>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-5xl p-5 sm:p-8">

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          {/* =================================================
              TITLE
          ================================================= */}

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500">

              <Briefcase
                size={22}
              />

            </div>

            <div>

              <h2 className="text-xl font-bold">
                Job Information
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Add the details of the position you want to publish.
              </p>

            </div>

          </div>

          {/* =================================================
              JOB STATUS INFORMATION
          ================================================= */}

          <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4">

            <p className="text-sm font-semibold text-gray-800">
              Job Status
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              The job will be published as Active.
              You can enable or disable the job whenever required
              from the Jobs page.
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              The job will no longer automatically close after
              three days.
            </p>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8"
          >

            <div className="grid gap-6 md:grid-cols-2">

              {/* =================================================
                  JOB TITLE
              ================================================= */}

              <Input
                label="Job Title"
                placeholder="e.g. Senior Frontend Developer"
                value={
                  form.jobTitle
                }
                onChange={(value) =>
                  updateField(
                    "jobTitle",
                    value
                  )
                }
                required
              />

              {/* =================================================
                  JOB CATEGORY
              ================================================= */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-800">

                  Job Category

                  <span className="text-orange-500">
                    {" "}*
                  </span>

                </label>

                <select
                  required
                  value={
                    form.jobCategory
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    updateField(
                      "jobCategory",
                      value
                    );

                    if (
                      value !==
                      "Other"
                    ) {
                      updateField(
                        "otherJobCategory",
                        ""
                      );
                    }
                  }}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                >

                  <option value="">
                    Select category
                  </option>

                  <option value="Information Technology">
                    Information Technology
                  </option>

                  <option value="Software Development">
                    Software Development
                  </option>

                  <option value="UI/UX Design">
                    UI/UX Design
                  </option>

                  <option value="Human Resources">
                    Human Resources
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Marketing">
                    Marketing
                  </option>

                  <option value="Sales">
                    Sales
                  </option>

                  <option value="Customer Support">
                    Customer Support
                  </option>

                  <option value="Operations">
                    Operations
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

                {/* OTHER CATEGORY */}

                {form.jobCategory ===
                  "Other" && (

                  <div className="mt-3">

                    <input
                      type="text"
                      required
                      value={
                        form.otherJobCategory
                      }
                      onChange={(event) =>
                        updateField(
                          "otherJobCategory",
                          limitWords(
                            event.target.value,
                            15
                          )
                        )
                      }
                      placeholder="Enter the job category"
                      className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none placeholder:text-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                    />

                    <p className="mt-1 text-right text-xs text-gray-400">
                      {
                        otherCategoryWordCount
                      }
                      /15 words
                    </p>

                  </div>
                )}

              </div>

              {/* =================================================
                  JOB TYPE
              ================================================= */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-800">

                  Job Type

                  <span className="text-orange-500">
                    {" "}*
                  </span>

                </label>

                <select
                  required
                  value={
                    form.jobType
                  }
                  onChange={(event) =>
                    updateField(
                      "jobType",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                >

                  <option value="">
                    Select job type
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

              {/* =================================================
                  EXPERIENCE REQUIRED
              ================================================= */}

              <Input
                label="Experience Required"
                placeholder="e.g. 2"
                inputMode="numeric"
                pattern="[0-9]*"
                value={
                  form.experienceRequired
                }
                onChange={(value) =>
                  updateField(
                    "experienceRequired",
                    value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                required
              />

              {/* =================================================
                  NUMBER OF OPENINGS
              ================================================= */}

              <Input
                label="Number of Openings"
                type="number"
                min="1"
                placeholder="e.g. 3"
                value={
                  form.numberOfOpenings
                }
                onChange={(value) =>
                  updateField(
                    "numberOfOpenings",
                    value
                  )
                }
                required
              />

            </div>

            {/* =================================================
                JOB DESCRIPTION
            ================================================= */}

            <div className="mt-6">

              <label className="mb-2 block text-sm font-semibold text-gray-800">

                Job Description

                <span className="text-orange-500">
                  {" "}*
                </span>

              </label>

              <textarea
                required
                rows={8}
                value={
                  form.jobDescription
                }
                onChange={(event) =>
                  updateField(
                    "jobDescription",
                    limitWords(
                      event.target.value,
                      200
                    )
                  )
                }
                placeholder="Describe the responsibilities, requirements, skills and qualifications..."
                className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none placeholder:text-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {
                  jobDescriptionWordCount
                }
                /200 words
              </p>

            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/company/jobs"
                  )
                }
                className="h-12 rounded-xl border border-gray-200 px-6 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="h-12 rounded-xl bg-black px-7 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading
                  ? "Publishing..."
                  : "Publish Job"}

              </button>

            </div>

          </form>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   INPUT COMPONENT
========================================================= */

function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  min,
  inputMode,
  pattern,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  type?: string;
  min?: string;

  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";

  pattern?: string;

  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-gray-800">

        {label}

        {required && (
          <span className="text-orange-500">
            {" "}*
          </span>
        )}

      </label>

      <input
        type={type}
        min={min}
        inputMode={inputMode}
        pattern={pattern}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none placeholder:text-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

    </div>
  );
}


/* =========================================================
   WORD COUNT
========================================================= */

function countWords(
  value: string
): number {

  const words =
    value
      .trim()
      .match(/\S+/g);

  return words
    ? words.length
    : 0;
}


/* =========================================================
   WORD LIMIT
========================================================= */

function limitWords(
  value: string,
  limit: number
): string {

  const matches =
    Array.from(
      value.matchAll(/\S+/g)
    );

  if (
    matches.length <= limit
  ) {
    return value;
  }

  const lastAllowedWord =
    matches[
      limit - 1
    ];

  const endIndex =
    (lastAllowedWord.index ?? 0) +
    lastAllowedWord[0].length;

  return value.slice(
    0,
    endIndex
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

  return "Unable to create job.";
}