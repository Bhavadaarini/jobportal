"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  Building2,
  UserRound,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    description: "",
    address: "",
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  /* =========================================================
     UPDATE FORM FIELD
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

  /* =========================================================
     ERROR MESSAGE HELPER
  ========================================================= */

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      const possibleError = error as {
        message?: unknown;
      };

      if (typeof possibleError.message === "string") {
        return possibleError.message;
      }
    }

    return "Something went wrong while creating your account.";
  };

  /* =========================================================
     REGISTER COMPANY
  ========================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    /* ---------------------------------------------------------
       BASIC VALIDATION
    --------------------------------------------------------- */

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (!form.companyName.trim()) {
      setError("Please enter your company name.");
      return;
    }

    if (!form.industry.trim()) {
      setError("Please select your company industry.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter your company description.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter your company address.");
      return;
    }

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.jobTitle.trim()) {
      setError("Please enter your job title.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setLoading(true);

      /* =====================================================
         1. CREATE SUPABASE AUTH USER

         EMAIL IS USED ONLY AS THE LOGIN USERNAME.
         NO EMAIL VERIFICATION IS DONE IN THIS CODE.
      ===================================================== */

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,

        options: {
          data: {
            full_name: form.fullName.trim(),
            role: "company",
          },
        },
      });

      if (authError) {
        throw authError;
      }

      const user = authData.user;

      if (!user) {
        throw new Error("Unable to create your account.");
      }

      /* =====================================================
         IMPORTANT:

         There is NO email verification check here.

         We do NOT check authData.session.
      ===================================================== */

      /* =====================================================
         2. CREATE COMPANY RECORD
      ===================================================== */

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          company_name: form.companyName.trim(),
          industry: form.industry.trim(),
          description: form.description.trim(),
          address: form.address.trim(),
        })
        .select()
        .single();

      if (companyError) {
        throw companyError;
      }

      if (!company) {
        throw new Error(
          "Company information could not be created."
        );
      }

      /* =====================================================
         3. CREATE RECRUITER RECORD

         PHONE NUMBER IS STORED ONLY.
         NO MOBILE VERIFICATION IS PERFORMED.
      ===================================================== */

      const {
        error: recruiterError,
      } = await supabase
        .from("company_recruiters")
        .insert({
          company_id: company.id,
          full_name: form.fullName.trim(),
          job_title: form.jobTitle.trim(),
          phone: form.phone.trim(),
        });

      if (recruiterError) {
        throw recruiterError;
      }

      /* =====================================================
         4. REGISTRATION SUCCESS
      ===================================================== */

      router.replace("/company/dashboard");
      router.refresh();

    } catch (error: unknown) {
      console.error(
        "Company registration error:",
        error
      );

      setError(getErrorMessage(error));

    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f5f6fc] px-4 py-8 md:px-8 lg:py-12">

      {/* HEADER */}

      <div className="mx-auto mb-8 max-w-5xl text-center">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
          J
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-black md:text-4xl">
          Create your company account
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
          Create your company profile and start connecting
          with talented candidates.
        </p>

      </div>

      {/* FORM */}

      <div className="mx-auto max-w-5xl">

        <form
          onSubmit={handleSubmit}
          className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm md:p-10"
        >

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              COMPANY INFORMATION
          ================================================= */}

          <section>

            <SectionHeading
              icon={<Building2 size={20} />}
              title="Company Information"
              description="Tell candidates about your company."
            />

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <InputField
                label="Company Name"
                placeholder="Enter company name"
                value={form.companyName}
                onChange={(value) =>
                  updateField("companyName", value)
                }
                required
              />

              {/* INDUSTRY */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Industry{" "}
                  <span className="text-orange-500">*</span>
                </label>

                <select
                  required
                  value={form.industry}
                  onChange={(event) =>
                    updateField(
                      "industry",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">
                    Select industry
                  </option>

                  <option value="Information Technology">
                    Information Technology
                  </option>

                  <option value="Software">
                    Software
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Healthcare">
                    Healthcare
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Manufacturing">
                    Manufacturing
                  </option>

                  <option value="Marketing">
                    Marketing
                  </option>

                  <option value="Retail">
                    Retail
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Company Description{" "}
                  <span className="text-orange-500">*</span>
                </label>

                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Tell candidates about your company..."
                  className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

              </div>

              {/* ADDRESS */}

              <div className="md:col-span-2">

                <InputField
                  label="Company Address"
                  placeholder="Enter complete company address"
                  value={form.address}
                  onChange={(value) =>
                    updateField("address", value)
                  }
                  required
                />

              </div>

            </div>

          </section>

          <div className="my-10 border-t border-gray-100" />

          {/* =================================================
              RECRUITER INFORMATION
          ================================================= */}

          <section>

            <SectionHeading
              icon={<UserRound size={20} />}
              title="Recruiter / Account Administrator"
              description="Details of the person managing this company account."
            />

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <InputField
                label="Full Name"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={(value) =>
                  updateField("fullName", value)
                }
                required
              />

              <InputField
                label="Job Title / Designation"
                placeholder="e.g. HR Manager"
                value={form.jobTitle}
                onChange={(value) =>
                  updateField("jobTitle", value)
                }
                required
              />

              {/* EMAIL */}

              <InputField
                label="Email Address"
                placeholder="you@company.com"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField("email", value)
                }
                required
              />

              {/* PHONE - NO VERIFICATION */}

              <InputField
                label="Mobile / Phone Number"
                placeholder="+91 98765 43210"
                type="tel"
                value={form.phone}
                onChange={(value) =>
                  updateField("phone", value)
                }
                required
              />

              {/* PASSWORD */}

              <PasswordField
                label="Password"
                placeholder="Create a strong password"
                value={form.password}
                show={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                onChange={(value) =>
                  updateField(
                    "password",
                    value
                  )
                }
              />

              {/* CONFIRM PASSWORD */}

              <PasswordField
                label="Confirm Password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                show={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword(
                    (value) => !value
                  )
                }
                onChange={(value) =>
                  updateField(
                    "confirmPassword",
                    value
                  )
                }
              />

            </div>

          </section>

          <div className="my-10 border-t border-gray-100" />

          {/* =================================================
              TERMS
          ================================================= */}

          <section>

            <h2 className="text-lg font-bold text-black">
              Terms & Privacy
            </h2>

            <div className="mt-5 space-y-4">

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span className="text-sm text-gray-500">
                  I agree to the{" "}
                  <span className="font-semibold text-black">
                    Terms & Conditions
                  </span>
                </span>

              </label>

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span className="text-sm text-gray-500">
                  I accept the{" "}
                  <span className="font-semibold text-black">
                    Privacy Policy
                  </span>
                </span>

              </label>

            </div>

          </section>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading
              ? "Creating Account..."
              : "Create Company Account"}

            {!loading && (
              <ArrowRight size={18} />
            )}

          </button>

          {/* LOGIN */}

          <p className="mt-5 text-center text-sm text-gray-400">

            Already have a company account?{" "}

            <a
              href="/company/login"
              className="font-semibold text-black transition hover:text-orange-500"
            >
              Login
            </a>

          </p>

        </form>

      </div>

    </main>
  );
}


/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
        {icon}
      </div>

      <div>

        <h2 className="font-bold text-black">
          {title}
        </h2>

        <p className="mt-1 text-xs text-gray-400">
          {description}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  placeholder,
  type = "text",
  required = false,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
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
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />

    </div>
  );
}


/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  label,
  placeholder,
  value,
  show,
  onToggle,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-gray-800">

        {label}

        <span className="text-orange-500">
          {" "}*
        </span>

      </label>

      <div className="relative">

        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-gray-200 px-4 pr-12 text-sm outline-none transition placeholder:text-gray-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
        >
          {show ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>

      </div>

    </div>
  );
}