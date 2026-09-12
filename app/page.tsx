
"use client";

import Link from "next/link";
import {
  UserRound,
  Building2,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-5 py-10">

      <div className="w-full max-w-5xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
            <BriefcaseBusiness size={28} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-black sm:text-4xl">
            Welcome to Job Portal
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
            Choose how you want to continue.
            Find your next opportunity as a candidate
            or hire the right talent as a company.
          </p>

        </div>


        {/* =====================================================
            ROLE SELECTION
        ===================================================== */}

        <div className="mt-10 grid gap-6 md:grid-cols-2">


          {/* ===================================================
              CANDIDATE
          =================================================== */}

          <Link
            href="/candidate/register"
            className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-md sm:p-8"
          >

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">

              <UserRound size={27} />

            </div>


            <h2 className="mt-6 text-2xl font-bold text-black">
              I&apos;m a Candidate
            </h2>


            <p className="mt-3 text-sm leading-6 text-gray-500">
              Create your candidate profile,
              upload your resume,
              explore available jobs
              and apply for opportunities.
            </p>


            <div className="mt-7 flex items-center justify-between">

              <span className="text-sm font-semibold text-orange-500">
                Create Candidate Account
              </span>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition group-hover:bg-black group-hover:text-white">

                <ArrowRight size={18} />

              </div>

            </div>

          </Link>


          {/* ===================================================
              COMPANY
          =================================================== */}

          <Link
            href="/company/register"
            className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-md sm:p-8"
          >

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-black transition group-hover:bg-black group-hover:text-white">

              <Building2 size={27} />

            </div>


            <h2 className="mt-6 text-2xl font-bold text-black">
              I&apos;m a Company
            </h2>


            <p className="mt-3 text-sm leading-6 text-gray-500">
              Create your company profile,
              post job openings,
              review applications
              and manage candidates.
            </p>


            <div className="mt-7 flex items-center justify-between">

              <span className="text-sm font-semibold text-black transition group-hover:text-orange-500">
                Create Company Account
              </span>


              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition group-hover:bg-orange-500 group-hover:text-white">

                <ArrowRight size={18} />

              </div>

            </div>

          </Link>

        </div>


        {/* =====================================================
            EXISTING ACCOUNT
        ===================================================== */}

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Already have an account?
          </p>


          <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">


            <Link
              href="/candidate/login"
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-orange-500"
            >
              Candidate Login
            </Link>


            <Link
              href="/company/login"
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Company Login
            </Link>


          </div>

        </div>

      </div>

    </main>
  );
}