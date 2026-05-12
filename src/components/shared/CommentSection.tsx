import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetPostComments, useCreateComment, useDeleteComment } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { multiFormatDateString } from "@/lib/utils";
import Loader from "./Loader";
import MentionText from "./MentionText";

type CommentSectionProps = {
  postId: string;
};

type Comment = {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  author: { id: string; name: string; imageUrl: string };
};

const CommentItem = ({
  comment,
  replies,
  user,
  postId,
  onReply,
  replyingTo,
  setReplyingTo,
}: {
  comment: Comment;
  replies: Comment[];
  user: any;
  postId: string;
  onReply: (parentId: string, body: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
}) => {
  const [replyBody, setReplyBody] = useState("");
  const { mutate: deleteComment } = useDeleteComment(postId);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    onReply(comment.id, replyBody);
    setReplyBody("");
    setReplyingTo(null);
  };

  return (
    <li className="flex flex-col gap-2">
      <div className="flex gap-3 items-start group">
        <Link to={`/profile/${comment.author?.id}`} className="shrink-0">
          <img
            src={comment.author?.imageUrl || "/assets/icons/profile-placeholder.svg"}
            alt={comment.author?.name}
            className="w-8 h-8 rounded-full ring-2 ring-primary-500/20"
          />
        </Link>
        <div className="flex flex-col flex-1 gap-0.5">
          <div className="flex items-baseline gap-2">
            <Link to={`/profile/${comment.author?.id}`} className="small-semibold text-light-1 hover:text-primary-400 transition">
              {comment.author?.name}
            </Link>
            <span className="tiny-medium text-light-4">{multiFormatDateString(comment.createdAt)}</span>
          </div>
          <MentionText text={comment.body} className="small-regular text-light-2" />
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-left tiny-medium text-light-4 hover:text-primary-400 transition w-fit mt-0.5"
          >
            Reply
          </button>
        </div>
        {comment.author?.id === user.id && (
          <button onClick={() => deleteComment(comment.id)} className="opacity-0 group-hover:opacity-100 transition shrink-0 mt-1">
            <img src="/assets/icons/delete.svg" alt="delete" width={16} height={16} />
          </button>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <ul className="flex flex-col gap-3 ml-11 border-l border-[var(--color-glass-border)] pl-4">
          {replies.map((r) => (
            <li key={r.id} className="flex gap-3 items-start group">
              <Link to={`/profile/${r.author?.id}`} className="shrink-0">
                <img
                  src={r.author?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                  alt={r.author?.name}
                  className="w-6 h-6 rounded-full ring-1 ring-primary-500/20"
                />
              </Link>
              <div className="flex flex-col flex-1 gap-0.5">
                <div className="flex items-baseline gap-2">
                  <Link to={`/profile/${r.author?.id}`} className="tiny-medium text-light-1 hover:text-primary-400 transition font-semibold">
                    {r.author?.name}
                  </Link>
                  <span className="tiny-medium text-light-4">{multiFormatDateString(r.createdAt)}</span>
                </div>
                <MentionText text={r.body} className="small-regular text-light-2" />
              </div>
              {r.author?.id === user.id && (
                <button onClick={() => deleteComment(r.id)} className="opacity-0 group-hover:opacity-100 transition shrink-0">
                  <img src="/assets/icons/delete.svg" alt="delete" width={14} height={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Reply input */}
      {replyingTo === comment.id && (
        <form onSubmit={handleReplySubmit} className="flex gap-2 ml-11 mt-1">
          <input
            autoFocus
            type="text"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Reply to ${comment.author?.name}…`}
            maxLength={500}
            className="flex-1 bg-dark-4 border border-[var(--color-glass-border)] rounded-lg px-3 py-1.5 text-light-1 text-xs placeholder:text-light-4 focus:outline-none focus:border-primary-500/50 transition"
          />
          <button type="submit" disabled={!replyBody.trim()} className="text-primary-500 tiny-medium disabled:opacity-40 hover:text-primary-400 transition">
            Post
          </button>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-light-4 tiny-medium hover:text-light-1 transition">
            Cancel
          </button>
        </form>
      )}
    </li>
  );
};

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user } = useUserContext();
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: commentsData, isLoading } = useGetPostComments(postId);
  const { mutate: createComment, isPending: isSubmitting } = useCreateComment(postId);

  const allComments: Comment[] = commentsData?.documents ?? [];
  const topLevel = allComments.filter((c) => !c.parentId);
  const repliesMap: Record<string, Comment[]> = {};
  allComments.filter((c) => c.parentId).forEach((r) => {
    if (!repliesMap[r.parentId!]) repliesMap[r.parentId!] = [];
    repliesMap[r.parentId!].push(r);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createComment(body, { onSuccess: () => setBody("") });
  };

  const handleReply = (parentId: string, replyBody: string) => {
    createComment({ body: replyBody, parentId } as any);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <h4 className="body-bold text-light-1">
        Comments {allComments.length > 0 && <span className="text-primary-500">({allComments.length})</span>}
      </h4>

      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        <img
          src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="avatar"
          className="w-8 h-8 rounded-full ring-2 ring-primary-500/30 shrink-0"
        />
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          maxLength={500}
          className="flex-1 bg-dark-4 border border-[var(--color-glass-border)] rounded-lg px-4 py-2 text-light-1 text-sm placeholder:text-light-4 focus:outline-none focus:border-primary-500/50 transition"
        />
        <button
          type="submit"
          disabled={!body.trim() || isSubmitting}
          className="text-primary-500 small-semibold disabled:opacity-40 hover:text-primary-400 transition"
        >
          {isSubmitting ? <Loader /> : "Post"}
        </button>
      </form>

      {isLoading ? (
        <Loader />
      ) : topLevel.length === 0 ? (
        <p className="text-light-4 small-regular text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap[comment.id] ?? []}
              user={user}
              postId={postId}
              onReply={handleReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentSection;
