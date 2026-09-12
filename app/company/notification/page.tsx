"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationPage() {
  const router = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prevent the initial loading function from being called
  // repeatedly during development/React Strict Mode.
  const hasLoaded = useRef(false);

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace("/company/login");
        return;
      }

      // Get notifications belonging to this user
      const {
        data,
        error: notificationError,
      } = await supabase
        .from("notifications")
        .select(
          `
            id,
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (notificationError) {
        throw notificationError;
      }

      setNotifications(
        (data ?? []) as Notification[]
      );
    } catch (error: unknown) {
      console.error(
        "Load notifications error:",
        error
      );

      if (
        error &&
        typeof error === "object" &&
        "message" in error
      ) {
        setError(
          String(
            (error as { message: unknown }).message
          )
        );
      } else {
        setError("Unable to load notifications.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }

    hasLoaded.current = true;

    void loadNotifications();
  }, []);

  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  const markAsRead = async (
    notificationId: string
  ) => {
    try {
      const {
        error: updateError,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notificationId);

      if (updateError) {
        throw updateError;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (error: unknown) {
      console.error(
        "Mark notification read error:",
        error
      );

      if (
        error &&
        typeof error === "object" &&
        "message" in error
      ) {
        setError(
          String(
            (error as { message: unknown }).message
          )
        );
      } else {
        setError(
          "Unable to mark notification as read."
        );
      }
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/company/login");
        return;
      }

      const {
        error: updateError,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) {
        throw updateError;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (error: unknown) {
      console.error(
        "Mark all notifications read error:",
        error
      );

      setError(
        "Unable to mark all notifications as read."
      );
    }
  };

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  const deleteNotification = async (
    notificationId: string
  ) => {
    try {
      const {
        error: deleteError,
      } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (deleteError) {
        throw deleteError;
      }

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== notificationId
        )
      );
    } catch (error: unknown) {
      console.error(
        "Delete notification error:",
        error
      );

      setError(
        "Unable to delete notification."
      );
    }
  };

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  // =========================================================
  // NOTIFICATION ICON
  // =========================================================

  const getNotificationIcon = (
    type: string
  ) => {
    switch (type) {
      case "application":
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
            <Bell size={20} />
          </div>
        );

      case "success":
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <Check size={20} />
          </div>
        );

      default:
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Bell size={20} />
          </div>
        );
    }
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">
      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div>
            <p className="text-xs text-gray-400">
              Company Portal
            </p>

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <Link
            href="/company/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-5xl p-5 sm:p-8">
        {/* TOP ACTIONS */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">
              All Notifications
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Stay updated with applications and
              other company activities.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              <CheckCheck size={17} />
              Mark all as read
            </button>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          /* EMPTY */

          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
              <Bell size={28} />
            </div>

            <h2 className="mt-5 text-lg font-bold">
              No notifications
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              You will see new notifications here.
            </p>

            <Link
              href="/company/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>
          </div>
        ) : (
          /* NOTIFICATION LIST */

          <div className="space-y-3">
            {notifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                    notification.is_read
                      ? "border-gray-100"
                      : "border-orange-200 bg-orange-50/30"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* ICON */}

                    {getNotificationIcon(
                      notification.type
                    )}

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">
                              {notification.title}
                            </h3>

                            {!notification.is_read && (
                              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                            )}
                          </div>

                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {notification.message}
                          </p>
                        </div>

                        {/* ACTIONS */}

                        <div className="flex shrink-0 items-center gap-2">
                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification.id
                                )
                              }
                              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-green-300 hover:text-green-600"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              deleteNotification(
                                notification.id
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-red-300 hover:text-red-600"
                            title="Delete notification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-gray-400">
                        {formatDate(
                          notification.created_at
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* BACK TO DASHBOARD */}

        <div className="mt-8">
          <Link
            href="/company/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}