import { useParams, Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui";
import { Loader } from "@/components/shared";
import { GridPostList, PostStats } from "@/components/shared";
import CommentSection from "@/components/shared/CommentSection";
import MentionText from "@/components/shared/MentionText";
import ReportModal from "@/components/shared/ReportModal";
import ImageCarousel from "@/components/shared/ImageCarousel";

import { useState } from "react";
import {
  useGetPostById,
  useGetUserPosts,
  useDeletePost,
} from "@/lib/react-query/queries";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";
import { IDocument } from "@/types";

const PostDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserContext();

  const { data: post, isLoading } = useGetPostById(id);
  const { data: userPosts, isLoading: isUserPostLoading } = useGetUserPosts(
    post?.creator?.id
  );
  const { mutate: deletePost } = useDeletePost();
  const [showReport, setShowReport] = useState(false);

  const relatedPosts = userPosts?.documents.filter(
    (userPost: IDocument) => userPost.id !== id
  );

  const handleDeletePost = () => {
    deletePost({ postId: id, imageId: post?.imageId });
    navigate(-1);
  };

  return (
    <div className="post_details-container">
      <div className="hidden md:flex max-w-5xl w-full">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="shad-button_ghost"
        >
          <img
            src={"/assets/icons/back.svg"}
            alt="back"
            width={24}
            height={24}
          />
          <p className="small-medium lg:base-medium">Back</p>
        </Button>
      </div>

      {isLoading || !post ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          <ImageCarousel
            images={post.images?.length > 0 ? post.images : [{ url: post.imageUrl, id: post.imageId }]}
            className="post_details-img rounded-none"
          />

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${post?.creator?.id}`}
                className="flex items-center gap-3"
              >
                <img
                  src={
                    post?.creator?.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 lg:w-12 lg:h-12 rounded-full ring-2 ring-primary-500/30"
                />
                <div className="flex gap-1 flex-col">
                  <p className="base-medium lg:body-bold text-light-1">
                    {post?.creator?.name}
                  </p>
                  <div className="flex-center gap-2 text-light-3">
                    <p className="subtle-semibold lg:small-regular">
                      {multiFormatDateString(post?.createdAt)}
                    </p>
                    •
                    <p className="subtle-semibold lg:small-regular">
                      {post?.location}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex-center gap-4">
                <Link
                  to={`/update-post/${post?.id}`}
                  className={`${user.id !== post?.creator?.id && "hidden"}`}
                >
                  <img
                    src={"/assets/icons/edit.svg"}
                    alt="edit"
                    width={24}
                    height={24}
                  />
                </Link>

                <Button
                  onClick={handleDeletePost}
                  variant="ghost"
                  className={`ost_details-delete_btn ${
                    user.id !== post?.creator?.id && "hidden"
                  }`}
                >
                  <img
                    src={"/assets/icons/delete.svg"}
                    alt="delete"
                    width={24}
                    height={24}
                  />
                </Button>

                {user.id !== post?.creator?.id && (
                  <Button
                    onClick={() => setShowReport(true)}
                    variant="ghost"
                    className="shad-button_ghost"
                    title="Report post"
                  >
                    <img src="/assets/icons/filter.svg" alt="report" width={20} height={20} className="opacity-50" />
                  </Button>
                )}
              </div>
            </div>

            <hr className="border w-full border-dark-4/80" />

            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <MentionText text={post?.caption ?? ""} />
              <ul className="flex flex-wrap gap-1 mt-2">
                {post?.tags.map((tag: string, index: number) => (
                  <li key={`${tag}${index}`}>
                    <Link
                      to={`/tags/${tag}`}
                      className="text-primary-500/70 small-regular hover:text-primary-400 transition"
                    >
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full">
              <PostStats post={post} userId={user.id} />
            </div>

            {user.id === post?.creator?.id && (
              <div className="flex gap-6 w-full px-3 py-2 rounded-lg bg-dark-4/40 text-light-3 tiny-medium">
                <span className="flex items-center gap-1.5">
                  <img src="/assets/icons/like.svg" alt="likes" width={14} height={14} />
                  {post.likes?.length ?? 0} likes
                </span>
                <span className="flex items-center gap-1.5">
                  <img src="/assets/icons/chat.svg" alt="comments" width={14} height={14} />
                  {post.commentCount ?? 0} comments
                </span>
                <span className="flex items-center gap-1.5">
                  <img src="/assets/icons/save.svg" alt="saves" width={14} height={14} />
                  {post.saveCount ?? 0} saves
                </span>
              </div>
            )}

            <hr className="border w-full border-dark-4/80" />

            <CommentSection postId={post.id} />
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        <hr className="border w-full border-dark-4/80" />

        <h3 className="body-bold md:h3-bold w-full my-10">
          More Related Posts
        </h3>
        {isUserPostLoading || !relatedPosts ? (
          <Loader />
        ) : (
          <GridPostList posts={relatedPosts} />
        )}
      </div>

      {showReport && post && (
        <ReportModal
          targetType="post"
          targetId={post.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default PostDetails;
