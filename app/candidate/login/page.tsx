"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function CandidateLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const supabase =
        createClient();

      // =====================================================
      // VALIDATION
      // =====================================================

      if (
        !email.trim() ||
        !password
      ) {
        setError(
          "Please enter email and password."
        );
        return;
      }

      // =====================================================
      // LOGIN
      // =====================================================

      const {
        data,
        error: loginError,
      } =
        await supabase.auth
          .signInWithPassword({
            email: email
              .trim()
              .toLowerCase(),

            password,
          });

      if (loginError) {
        setError(
          loginError.message
        );
        return;
      }

      if (!data.user) {
        setError(
          "Unable to login."
        );
        return;
      }

      // =====================================================
      // CHECK CANDIDATE PROFILE
      // =====================================================

      const {
        data: candidate,
        error: candidateError,
      } = await supabase
        .from("candidates")
        .select("id")
        .eq(
          "user_id",
          data.user.id
        )
        .maybeSingle();

      if (candidateError) {
        setError(
          candidateError.message
        );
        return;
      }

      if (!candidate) {
        await supabase.auth.signOut();

        setError(
          "Candidate profile not found for this account."
        );

        return;
      }

      // =====================================================
      // GO TO DASHBOARD
      // =====================================================

      router.replace(
        "/candidate/dashboard"
      );

      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Unable to login."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-5">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black font-bold text-white">
            J
          </div>

          <h1 className="mt-4 text-2xl font-bold">
            Candidate Login
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Login to find and apply for jobs.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="h-12 w-full rounded-xl border px-4 text-sm outline-none focus:border-orange-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="h-12 w-full rounded-xl border px-4 text-sm outline-none focus:border-orange-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-black text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Do not have an account?{" "}

          <Link
            href="/candidate/register"
            className="font-semibold text-orange-500"
          >
            Create Account
          </Link>
        </p>

      </div>

    </main>
  );
}