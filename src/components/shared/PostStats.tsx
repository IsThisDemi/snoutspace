import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
  useRepostPost,
} from "@/lib/react-query/queries";
import { IDocument } from "@/types";
import { useToast } from "@/components/ui/use-toast";

type PostStatsProps = {
  post?: IDocument;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();
  const { toast } = useToast();
  const likesList: string[] = post?.likes ?? [];

  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();
  const { mutate: repost, isPending: isReposting } = useRepostPost();

  const { data: currentUser } = useGetCurrentUser();

  const savedPostRecord = currentUser?.save?.find(
    (record: IDocument) => record.post?.id === post?.id
  );

  useEffect(() => {
    setIsSaved(!!savedPostRecord);
  }, [currentUser]);

  const handleLikePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    let likesArray = [...likes];

    if (likesArray.includes(userId)) {
      likesArray = likesArray.filter((Id) => Id !== userId);
    } else {
      likesArray.push(userId);
    }

    setLikes(likesArray);
    likePost({ postId: post?.id || "", likesArray });
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (savedPostRecord) {
      setIsSaved(false);
      return deleteSavePost(savedPostRecord.id);
    }

    savePost({ userId: userId, postId: post?.id || "" });
    setIsSaved(true);
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post?.id || post.repostOf) return;
    repost(post.id, {
      onSuccess: () => toast({ title: "Reposted!" }),
      onError: (err: any) => toast({ title: err.message === "Already reposted" ? "Already reposted" : "Repost failed", variant: "destructive" }),
    });
  };

  return (
    <div
      className={`flex justify-between items-center z-20 ${containerStyles}`}
    >
      <div className="flex gap-2 mr-5">
        <img
          src={`${
            checkIsLiked(likes, userId)
              ? "/assets/icons/liked.svg"
              : "/assets/icons/like.svg"
          }`}
          alt="like"
          width={20}
          height={20}
          onClick={(e) => handleLikePost(e)}
          className={`cursor-pointer transition-transform active:scale-90 ${
            checkIsLiked(likes, userId) ? "drop-shadow-[0_0_6px_#ff6b6b]" : ""
          }`}
        />
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>

      <div className="flex items-center gap-4">
        {!post?.repostOf && (
          <img
            src="/assets/icons/wallpaper.svg"
            alt="repost"
            width={20}
            height={20}
            onClick={handleRepost}
            className={`cursor-pointer transition-transform active:scale-90 opacity-60 hover:opacity-100 ${isReposting ? "animate-pulse" : ""}`}
          />
        )}
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          alt="save"
          width={20}
          height={20}
          className={`cursor-pointer transition-transform active:scale-90 ${
            isSaved ? "drop-shadow-[0_0_6px_#a78bfa]" : ""
          }`}
          onClick={(e) => handleSavePost(e)}
        />
      </div>
    </div>
  );
};

export default PostStats;
