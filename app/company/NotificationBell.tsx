"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_application_id: string | null;
};

export default function NotificationBell() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [open, setOpen] =
    useState(false);

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "User loading error:",
            userError
          );
          return;
        }

        if (!user) {
          return;
        }

        const {
          data,
          error: notificationError,
        } = await supabase
          .from("notifications")
          .select(`
            id,
            title,
            message,
            type,
            is_read,
            created_at,
            related_application_id
          `)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(10);

        if (notificationError) {
          console.error(
            "Notification loading error:",
            notificationError
          );
          return;
        }

        if (!mounted) {
          return;
        }

        const notificationList =
          (data as Notification[]) || [];

        setNotifications(notificationList);

        setUnreadCount(
          notificationList.filter(
            (notification) =>
              !notification.is_read
          ).length
        );
      } catch (error) {
        console.error(
          "Notification error:",
          error
        );
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // REALTIME NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    let channel:
      | ReturnType<
          ReturnType<typeof createClient>["channel"]
        >
      | null = null;

    const setupRealtime = async () => {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        channel = supabase
          .channel(
            `company-notifications-${user.id}`
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotification =
                payload.new as Notification;

              setNotifications((current) => [
                newNotification,
                ...current,
              ].slice(0, 10));

              setUnreadCount(
                (current) => current + 1
              );
            }
          )
          .subscribe();
      } catch (error) {
        console.error(
          "Realtime notification error:",
          error
        );
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        const supabase = createClient();

        supabase.removeChannel(channel);
      }
    };
  }, []);

  // =====================================================
  // OPEN NOTIFICATIONS
  // =====================================================

  const openNotifications = () => {
    setOpen((current) => !current);
  };

  // =====================================================
  // GO TO NOTIFICATIONS PAGE
  // =====================================================

  const goToNotifications = () => {
    setOpen(false);

    router.push("/company/notifications");
  };

  // =====================================================
  // CLICK NOTIFICATION
  // =====================================================

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    const supabase = createClient();

    // Mark as read
    if (!notification.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notification.id);

      if (error) {
        console.error(
          "Mark notification as read error:",
          error
        );

        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    }

    setOpen(false);

    // Open application
    if (
      notification.related_application_id
    ) {
      router.push(
        `/company/applications/${notification.related_application_id}`
      );

      return;
    }

    // Otherwise open notifications
    router.push(
      "/company/notifications"
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative">
      {/* NOTIFICATION BUTTON */}

      <button
        type="button"
        onClick={openNotifications}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-orange-300 hover:text-orange-500"
      >
        <Bell size={20} />

        {/* UNREAD NUMBER */}

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* NOTIFICATION DROPDOWN */}

      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* HEADER */}

          <div className="flex items-center justify-between border-b px-4 py-4">
            <div>
              <h3 className="font-bold text-gray-800">
                Notifications
              </h3>

              <p className="text-xs text-gray-400">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={goToNotifications}
              className="text-xs font-semibold text-orange-500 hover:text-orange-600"
            >
              View all
            </button>
          </div>

          {/* EMPTY */}

          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell
                size={26}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm text-gray-400">
                No notifications
              </p>
            </div>
          ) : (
            /* NOTIFICATION LIST */

            <div className="max-h-96 overflow-y-auto">
              {notifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    className={`w-full border-b px-4 py-4 text-left transition hover:bg-gray-50 ${
                      !notification.is_read
                        ? "bg-orange-50/50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* ICON */}

                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <Bell size={16} />
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            {
                              notification.title
                            }
                          </p>

                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {
                            notification.message
                          }
                        </p>

                        <p className="mt-2 text-[10px] text-gray-400">
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          )}

          {/* VIEW ALL */}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={goToNotifications}
              className="w-full border-t bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-500"
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}