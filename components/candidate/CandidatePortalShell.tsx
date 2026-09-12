"use client";

import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  UserRound,
  LogOut,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";

type CandidatePortalShellProps = {
  children: ReactNode;
  candidateName?: string;
  candidateEmail?: string;
  title: string;
  subtitle?: string;
};

export default function CandidatePortalShell({
  children,
  candidateName = "Candidate",
  candidateEmail = "",
  title,
  subtitle,
}: CandidatePortalShellProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

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

  const menu = [
    {
      name: "Dashboard",
      href: "/candidate/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Offers",
      href: "/candidate/offers",
      icon: BriefcaseBusiness,
    },
    {
      name: "My Applications",
      href: "/candidate/applications",
      icon: ClipboardList,
    },
    {
      name: "Profile",
      href: "/candidate/profile",
      icon: UserRound,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r bg-white lg:block">

        {/* LOGO */}

        <div className="flex h-20 items-center gap-3 border-b px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black font-bold text-white">
            J
          </div>

          <div>
            <p className="font-bold">
              JobPortal
            </p>

            <p className="text-xs text-gray-400">
              Candidate Portal
            </p>
          </div>

        </div>

        {/* MENU */}

        <nav className="mt-8 px-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">

            {menu.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  pathname ===
                    item.href ||
                  (
                    item.href !==
                      "/candidate/dashboard" &&
                    pathname.startsWith(
                      `${item.href}/`
                    )
                  );

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-black text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-black"
                    }`}
                  >
                    <Icon
                      size={18}
                    />

                    {item.name}
                  </Link>
                );
              }
            )}

          </div>

        </nav>

        {/* USER */}

        <div className="absolute bottom-0 w-full border-t p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
              {getInitials(
                candidateName
              )}
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold">
                {candidateName}
              </p>

              <p className="truncate text-xs text-gray-400">
                {candidateEmail}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="mt-5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
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

        {/* HEADER */}

        <header className="border-b bg-white">

          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                Candidate Portal
              </p>

              <h1 className="mt-1 text-xl font-bold text-black">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-1 text-xs text-gray-400">
                  {subtitle}
                </p>
              )}

            </div>

            {/* MOBILE LOGOUT */}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border text-gray-500 lg:hidden"
            >
              <LogOut
                size={18}
              />
            </button>

          </div>

          {/* MOBILE MENU */}

          <div className="overflow-x-auto border-t px-4 py-3 lg:hidden">

            <div className="flex min-w-max gap-2">

              {menu.slice(
                0,
                3
              ).map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    pathname ===
                      item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                        active
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon
                        size={16}
                      />

                      {item.name}
                    </Link>
                  );
                }
              )}

            </div>

          </div>

        </header>

        {children}

      </section>

    </main>
  );
}

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