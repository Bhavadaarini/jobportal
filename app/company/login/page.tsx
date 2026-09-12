"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CompanyLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      router.replace("/company/dashboard");
      router.refresh();

    } catch (error) {
  console.error(error);

  setError(
    error instanceof Error
      ? error.message
      : "Invalid email or password."
  );
}finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}

        <div className="hidden bg-black p-12 text-white lg:flex lg:flex-col lg:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-xl font-bold text-black">
                J
              </div>

              <span className="text-xl font-bold">
                JobPortal
              </span>

            </div>
          </div>

          <div className="max-w-lg">

            <div className="mb-6 text-5xl">
              💼
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              Find the right talent for your company.
            </h1>

            <p className="mt-5 leading-7 text-gray-400">
              Manage your hiring process, discover talented
              candidates and build your perfect team.
            </p>

          </div>

          <p className="text-sm text-gray-500">
            © 2026 JobPortal. All rights reserved.
          </p>

        </div>

        {/* RIGHT */}

        <div className="flex items-center justify-center px-5 py-10">

          <div className="w-full max-w-md">

            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black font-bold text-white">
                J
              </div>

              <span className="text-xl font-bold">
                JobPortal
              </span>

            </div>

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                🏢
              </div>

              <h2 className="mt-5 text-3xl font-bold">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Login to your company account
              </p>

            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* EMAIL */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Official Company Email
                  </label>

                  <input
                    type="email"
                    placeholder="you@company.com"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

                {/* PASSWORD */}

                <div className="mt-5">

                  <div className="mb-2 flex justify-between">

                    <label className="text-sm font-semibold">
                      Password
                    </label>

                    <a
                      href="/company/forgot-password"
                      className="text-xs font-semibold text-orange-500"
                    >
                      Forgot password?
                    </a>

                  </div>

                  <div className="relative">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-gray-200 px-4 pr-16 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>

                <div className="mt-5 flex items-center gap-2">

                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 accent-orange-500"
                  />

                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-500"
                  >
                    Remember me
                  </label>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 h-12 w-full rounded-xl bg-black font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
                >
                  {loading
                    ? "Logging in..."
                    : "Login to Company Account →"}
                </button>

              </form>

              <div className="mt-6 text-center text-xs text-gray-400">
                🔒 Your account information is secure
              </div>

            </div>

            <div className="mt-6 text-center">

              <p className="text-sm text-gray-500">
                Do you have an account?
              </p>

              <a
                href="/company/register"
                className="mt-2 inline-block text-sm font-bold text-black hover:text-orange-500"
              >
                Create Company Account →
              </a>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}
