import { Link } from "react-router-dom";

import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";
import PostStats from "./PostStats";
import MentionText from "./MentionText";
import ImageCarousel from "./ImageCarousel";
import { IDocument } from "@/types";

type PostCardProps = {
  post: IDocument;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();

  if (!post.creator) return;

  const images: { url: string; id: string }[] =
    post.images?.length > 0 ? post.images : [{ url: post.imageUrl, id: post.imageId }];

  return (
    <div className="post-card">
      {/* Repost header */}
      {post.repostOf && (
        <div className="flex items-center gap-2 mb-3 text-light-4 tiny-medium">
          <img src="/assets/icons/wallpaper.svg" alt="repost" width={14} height={14} className="opacity-50" />
          <span>
            Reposted from{" "}
            <Link
              to={`/profile/${post.repostOf.creator?.id}`}
              className="text-primary-500/70 hover:text-primary-400 transition"
              onClick={(e) => e.stopPropagation()}
            >
              @{post.repostOf.creator?.username}
            </Link>
          </span>
        </div>
      )}

      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator.id}`}>
            <img
              src={
                post.creator?.imageUrl ||
                "/assets/icons/profile-placeholder.svg"
              }
              alt="creator"
              className="w-12 lg:h-12 rounded-full ring-2 ring-primary-500/30"
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.creator.name}
            </p>
            <div className="flex-center gap-2 text-light-3">
              <p className="subtle-semibold lg:small-regular ">
                {multiFormatDateString(post.createdAt)}
              </p>
              •
              <p className="subtle-semibold lg:small-regular">
                {post.location}
              </p>
            </div>
          </div>
        </div>

        <Link
          to={`/update-post/${post.id}`}
          className={`${user.id !== post.creator.id && "hidden"}`}
        >
          <img
            src={"/assets/icons/edit.svg"}
            alt="edit"
            width={20}
            height={20}
          />
        </Link>
      </div>

      <Link to={`/posts/${post.id}`}>
        <div className="small-medium lg:base-medium py-5">
          <MentionText text={post.caption} />
          <ul className="flex flex-wrap gap-1 mt-2">
            {post.tags.map((tag: string, index: number) => (
              <li key={`${tag}${index}`}>
                <Link
                  to={`/tags/${tag}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary-500/70 small-regular hover:text-primary-400 transition"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <ImageCarousel images={images} />
      </Link>

      <PostStats post={post} userId={user.id} />
    </div>
  );
};

export default PostCard;
