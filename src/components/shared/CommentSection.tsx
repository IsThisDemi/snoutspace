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

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user } = useUserContext();
  const [body, setBody] = useState("");

  const { data: commentsData, isLoading } = useGetPostComments(postId);
  const { mutate: createComment, isPending: isSubmitting } = useCreateComment(postId);
  const { mutate: deleteComment } = useDeleteComment(postId);

  const comments = commentsData?.documents ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createComment(body, { onSuccess: () => setBody("") });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <h4 className="body-bold text-light-1">
        Comments {comments.length > 0 && <span className="text-primary-500">({comments.length})</span>}
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
      ) : comments.length === 0 ? (
        <p className="text-light-4 small-regular text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment: any) => (
            <li key={comment.id} className="flex gap-3 items-start group">
              <Link to={`/profile/${comment.author?.id}`} className="shrink-0">
                <img
                  src={comment.author?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                  alt={comment.author?.name}
                  className="w-8 h-8 rounded-full ring-2 ring-primary-500/20"
                />
              </Link>
              <div className="flex flex-col flex-1 gap-0.5">
                <div className="flex items-baseline gap-2">
                  <Link
                    to={`/profile/${comment.author?.id}`}
                    className="small-semibold text-light-1 hover:text-primary-400 transition"
                  >
                    {comment.author?.name}
                  </Link>
                  <span className="tiny-medium text-light-4">
                    {multiFormatDateString(comment.createdAt)}
                  </span>
                </div>
                <MentionText text={comment.body} className="small-regular text-light-2" />
              </div>
              {comment.author?.id === user.id && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition shrink-0 mt-1"
                >
                  <img src="/assets/icons/delete.svg" alt="delete" width={16} height={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentSection;
