import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGetUnreadCount, useGetNotifications, useMarkNotificationsRead } from "@/lib/react-query/queries";
import { multiFormatDateString } from "@/lib/utils";
import { socket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

const ICONS: Record<string, string> = {
  like: "/assets/icons/liked.svg",
  comment: "/assets/icons/chat.svg",
  follow: "/assets/icons/people.svg",
  reply: "/assets/icons/chat.svg",
  repost: "/assets/icons/wallpaper.svg",
};

const LABELS: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  reply: "replied to your comment",
  repost: "reposted your post",
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: countData } = useGetUnreadCount();
  const { data: notifData } = useGetNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  const unread = countData?.count ?? 0;
  const notifications = notifData?.documents ?? [];

  // Real-time badge increment on socket notification
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_UNREAD_COUNT] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_NOTIFICATIONS] });
    };
    socket.on("notification", handler);
    return () => { socket.off("notification", handler); };
  }, [queryClient]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unread > 0) markRead();
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-lg hover:bg-dark-4 transition">
        <img src="/assets/icons/chat.svg" alt="notifications" width={22} height={22} className="invert-white opacity-80" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl shadow-2xl z-50 overflow-hidden border border-[var(--color-glass-border)]">
          <div className="px-4 py-3 border-b border-[var(--color-glass-border)] flex items-center justify-between">
            <span className="small-semibold text-light-1">Notifications</span>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="tiny-medium text-primary-500 hover:text-primary-400 transition"
            >
              See all
            </Link>
          </div>

          <ul className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-light-4 small-regular">No notifications yet</li>
            ) : (
              notifications.slice(0, 8).map((n: any) => (
                <li key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-dark-4/40 transition ${!n.read ? "bg-primary-500/5" : ""}`}>
                  <img
                    src={n.actor?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                    alt={n.actor?.name}
                    className="w-8 h-8 rounded-full ring-1 ring-primary-500/20 shrink-0"
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="tiny-medium text-light-2 leading-snug">
                      <span className="font-semibold text-light-1">{n.actor?.name}</span>{" "}
                      {LABELS[n.type] ?? n.type}
                    </p>
                    <span className="tiny-medium text-light-4">{multiFormatDateString(n.createdAt)}</span>
                  </div>
                  <img src={ICONS[n.type]} alt={n.type} width={16} height={16} className="shrink-0 mt-1 opacity-60" />
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
