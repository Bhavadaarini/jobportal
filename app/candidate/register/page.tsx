"use client";

import {
  FormEvent,
  useState,
  ChangeEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import {
  Upload,
  FileText,
  X,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


export default function CandidateRegisterPage() {
  const router = useRouter();

  // =========================================================
  // FORM STATES
  // =========================================================

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    about,
    setAbout,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    resume,
    setResume,
  ] = useState<File | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  // =========================================================
  // RESUME SELECTION
  // =========================================================

  const handleResumeChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }


    // =====================================================
    // ALLOWED FILE TYPES
    // =====================================================

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Resume must be PDF, DOC, or DOCX."
      );

      e.target.value = "";

      return;
    }


    // =====================================================
    // MAX FILE SIZE = 5 MB
    // =====================================================

    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size > maxSize
    ) {
      setError(
        "Resume size must be less than 5 MB."
      );

      e.target.value = "";

      return;
    }


    setResume(file);
  };


  // =========================================================
  // REMOVE RESUME
  // =========================================================

  const removeResume = () => {
    setResume(null);
  };


  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();


    try {
      setLoading(true);
      setError("");
      setSuccess("");


      // =====================================================
      // VALIDATION
      // =====================================================

      if (
        !fullName.trim() ||
        !email.trim() ||
        !phone.trim() ||
        !address.trim() ||
        !about.trim() ||
        !password
      ) {
        setError(
          "Please fill in all required fields."
        );

        return;
      }


      if (
        password.length < 6
      ) {
        setError(
          "Password must be at least 6 characters."
        );

        return;
      }


      if (!resume) {
        setError(
          "Please upload your resume."
        );

        return;
      }


      const supabase =
        createClient();


      // =====================================================
      // 1. CREATE AUTH USER
      // =====================================================

      const {
        data,
        error: signUpError,
      } =
        await supabase.auth
          .signUp({
            email: email
              .trim()
              .toLowerCase(),

            password,
          });


      if (signUpError) {
        setError(
          signUpError.message
        );

        return;
      }


      if (!data.user) {
        setError(
          "Unable to create account."
        );

        return;
      }


      // =====================================================
      // IMPORTANT
      //
      // We need an authenticated session here because
      // Storage and candidates table use RLS.
      // =====================================================

      if (!data.session) {
        setError(
          "Account created. Please verify your email before completing your candidate profile."
        );

        return;
      }


      // =====================================================
      // 2. CREATE SAFE RESUME FILE NAME
      // =====================================================

      const originalName =
        resume.name;


      const extension =
        originalName
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "pdf";


      const safeFileName =
        `resume-${Date.now()}.${extension}`;


      // =====================================================
      // STORAGE STRUCTURE
      //
      // candidate-resumes/
      //
      // auth-user-id/
      //      resume-123456.pdf
      //
      // =====================================================

      const resumePath =
        `${data.user.id}/${safeFileName}`;


      // =====================================================
      // 3. UPLOAD RESUME
      // =====================================================

      const {
        error:
          resumeUploadError,
      } = await supabase.storage
        .from(
          "candidate-resumes"
        )
        .upload(
          resumePath,
          resume,
          {
            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              resume.type,
          }
        );


      if (
        resumeUploadError
      ) {
        setError(
          `Resume upload failed: ${resumeUploadError.message}`
        );

        return;
      }


      // =====================================================
      // 4. CREATE CANDIDATE PROFILE
      //
      // IMPORTANT:
      //
      // auth.users.id
      //        ↓
      // candidates.user_id
      //
      // candidates.id is automatically generated.
      // =====================================================

      const {
        error:
          profileError,
      } = await supabase
        .from(
          "candidates"
        )
        .insert({

          user_id:
            data.user.id,

          full_name:
            fullName.trim(),

          email:
            email
              .trim()
              .toLowerCase(),

          phone:
            phone.trim(),

          address:
            address.trim(),

          about:
            about.trim(),

          resume_url:
            resumePath,

          resume_name:
            originalName,

        });


      // =====================================================
      // PROFILE ERROR
      // =====================================================

      if (profileError) {

        // Remove uploaded resume if candidate
        // profile creation failed.

        await supabase.storage
          .from(
            "candidate-resumes"
          )
          .remove([
            resumePath,
          ]);


        setError(
          profileError.message
        );

        return;
      }


      // =====================================================
      // 5. SUCCESS
      // =====================================================

      setSuccess(
        "Account created successfully."
      );


      // =====================================================
      // 6. SIGN OUT
      //
      // Registration completed.
      // Candidate must login again.
      // =====================================================

      await supabase.auth
        .signOut();


      // =====================================================
      // 7. GO TO LOGIN
      // =====================================================

      router.replace(
        "/candidate/login"
      );


    } catch (
      err: unknown
    ) {

      if (
        err instanceof Error
      ) {

        setError(
          err.message
        );

      } else {

        setError(
          "Unable to create account."
        );

      }


    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-5">

      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm">


        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black font-bold text-white">

            J

          </div>


          <h1 className="mt-4 text-2xl font-bold text-black">

            Create Candidate Account

          </h1>


          <p className="mt-2 text-sm text-gray-500">

            Create your profile and start applying for jobs.

          </p>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">

            {error}

          </div>

        )}


        {/* ===================================================
            SUCCESS
        =================================================== */}

        {success && (

          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-600">

            {success}

          </div>

        )}


        {/* ===================================================
            FORM
        =================================================== */}

        <form
          onSubmit={
            handleRegister
          }
          className="space-y-5"
        >


          {/* =================================================
              FULL NAME
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Full Name
              <span className="text-red-500">
                *
              </span>

            </label>


            <input
              type="text"

              placeholder="Enter your full name"

              value={
                fullName
              }

              onChange={(
                e
              ) =>
                setFullName(
                  e.target.value
                )
              }

              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"

              required
            />

          </div>


          {/* =================================================
              EMAIL
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Email Address

              <span className="text-red-500">
                *
              </span>

            </label>


            <input
              type="email"

              placeholder="Enter your email"

              value={
                email
              }

              onChange={(
                e
              ) =>
                setEmail(
                  e.target.value
                )
              }

              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"

              required
            />

          </div>


          {/* =================================================
              PHONE
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Phone Number

              <span className="text-red-500">
                *
              </span>

            </label>


            <input
              type="tel"

              placeholder="Enter your phone number"

              value={
                phone
              }

              onChange={(
                e
              ) =>
                setPhone(
                  e.target.value
                )
              }

              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"

              required
            />

          </div>


          {/* =================================================
              ADDRESS
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Address

              <span className="text-red-500">
                *
              </span>

            </label>


            <textarea
              placeholder="Enter your address"

              value={
                address
              }

              onChange={(
                e
              ) =>
                setAddress(
                  e.target.value
                )
              }

              rows={3}

              className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none transition focus:border-orange-500"

              required
            />

          </div>


          {/* =================================================
              ABOUT
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              About Me

              <span className="text-red-500">
                *
              </span>

            </label>


            <textarea
              placeholder="Tell us about yourself, your skills and experience..."

              value={
                about
              }

              onChange={(
                e
              ) =>
                setAbout(
                  e.target.value
                )
              }

              rows={5}

              maxLength={
                1500
              }

              className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none transition focus:border-orange-500"

              required
            />


            <div className="mt-1 text-right text-xs text-gray-400">

              {
                about.length
              }
              /1500

            </div>

          </div>


          {/* =================================================
              RESUME
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Resume

              <span className="text-red-500">
                *
              </span>

            </label>


            {!resume ? (

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-6 transition hover:border-orange-400 hover:bg-orange-50/30">

                <Upload
                  size={
                    26
                  }
                  className="text-gray-400"
                />


                <p className="mt-3 text-sm font-semibold text-gray-700">

                  Upload Resume

                </p>


                <p className="mt-1 text-xs text-gray-400">

                  PDF, DOC or DOCX — Maximum 5 MB

                </p>


                <input
                  type="file"

                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

                  onChange={
                    handleResumeChange
                  }

                  className="hidden"
                />

              </label>

            ) : (

              <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-green-600">

                    <FileText
                      size={
                        20
                      }
                    />

                  </div>


                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-gray-800">

                      {
                        resume.name
                      }

                    </p>


                    <p className="mt-1 text-xs text-gray-500">

                      {(
                        resume.size /
                        1024 /
                        1024
                      ).toFixed(
                        2
                      )}{" "}
                      MB

                    </p>

                  </div>

                </div>


                <button
                  type="button"

                  onClick={
                    removeResume
                  }

                  className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                >

                  <X
                    size={
                      18
                    }
                  />

                </button>

              </div>

            )}

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Password

              <span className="text-red-500">
                *
              </span>

            </label>


            <input
              type="password"

              placeholder="Minimum 6 characters"

              value={
                password
              }

              onChange={(
                e
              ) =>
                setPassword(
                  e.target.value
                )
              }

              minLength={
                6
              }

              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"

              required
            />

          </div>


          {/* =================================================
              REGISTER BUTTON
          ================================================= */}

          <button
            type="submit"

            disabled={
              loading
            }

            className="h-12 w-full rounded-xl bg-black text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading
              ? "Creating account..."
              : "Create Account"}

          </button>

        </form>


        {/* ===================================================
            LOGIN
        =================================================== */}

        <p className="mt-7 text-center text-sm text-gray-500">

          Already have an account?{" "}

          <Link
            href="/candidate/login"

            className="font-semibold text-orange-500 hover:text-orange-600"
          >

            Login

          </Link>

        </p>

      </div>

    </main>
  );
}