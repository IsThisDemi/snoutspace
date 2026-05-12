import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useGetNotifications, useMarkNotificationsRead } from "@/lib/react-query/queries";
import { multiFormatDateString } from "@/lib/utils";
import Loader from "@/components/shared/Loader";

const LABELS: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  reply: "replied to your comment",
  repost: "reposted your post",
};

const Notifications = () => {
  const { data, isLoading } = useGetNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  useEffect(() => {
    markRead();
  }, []);

  const notifications = data?.documents ?? [];

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-8 px-5 md:px-8 max-w-2xl w-full mx-auto">
      <div className="flex items-center gap-3 w-full">
        <img src="/assets/icons/chat.svg" alt="bell" width={30} height={30} className="invert-white" />
        <h2 className="h3-bold md:h2-bold">Notifications</h2>
      </div>

      {isLoading ? (
        <Loader />
      ) : notifications.length === 0 ? (
        <p className="text-light-4 body-medium text-center py-12">No notifications yet</p>
      ) : (
        <ul className="flex flex-col gap-1 w-full">
          {notifications.map((n: any) => (
            <li
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl transition hover:bg-dark-4/30 ${!n.read ? "bg-primary-500/5 border border-primary-500/10" : ""}`}
            >
              <Link to={`/profile/${n.actor?.id}`} className="shrink-0">
                <img
                  src={n.actor?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                  alt={n.actor?.name}
                  className="w-10 h-10 rounded-full ring-2 ring-primary-500/20"
                />
              </Link>

              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <p className="small-regular text-light-2">
                  <Link to={`/profile/${n.actor?.id}`} className="small-semibold text-light-1 hover:text-primary-400 transition">
                    {n.actor?.name}
                  </Link>{" "}
                  {LABELS[n.type] ?? n.type}
                  {n.comment && (
                    <span className="text-light-4"> — "{n.comment.body?.slice(0, 60)}{n.comment.body?.length > 60 ? "…" : ""}"</span>
                  )}
                </p>
                <span className="tiny-medium text-light-4">{multiFormatDateString(n.createdAt)}</span>
              </div>

              {n.post && (
                <Link to={`/posts/${n.post.id}`} className="shrink-0">
                  <img
                    src={n.post.imageUrl}
                    alt="post"
                    className="w-12 h-12 rounded-lg object-cover ring-1 ring-[var(--color-glass-border)]"
                  />
                </Link>
              )}

              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
