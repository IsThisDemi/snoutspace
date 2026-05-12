import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { IDocument } from "@/types";
import { useUserContext } from "@/context/AuthContext";
import { useFollowUser, useUnfollowUser } from "@/lib/react-query/queries";
import Loader from "./Loader";

type UserCardProps = {
  user: IDocument;
};

const UserCard = ({ user }: UserCardProps) => {
  const { user: currentUser } = useUserContext();
  const { mutate: follow, isPending: isFollowing } = useFollowUser(user.id);
  const { mutate: unfollow, isPending: isUnfollowing } = useUnfollowUser(user.id);

  const isOwnProfile = currentUser.id === user.id;
  const isFollowed = user.isFollowedByCurrentUser;

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFollowed) {
      unfollow();
    } else {
      follow();
    }
  };

  return (
    <Link to={`/profile/${user.id}`} className="user-card">
      <img
        src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
        alt="creator"
        className="rounded-full w-14 h-14 ring-2 ring-primary-500/20"
      />

      <div className="flex-center flex-col gap-1">
        <p className="small-regular text-light-1 text-center line-clamp-1">
          {user.name}
        </p>
        <p className="small-regular text-light-3 text-center line-clamp-1">
          @{user.username}
        </p>
      </div>

      {!isOwnProfile && (
        <Button
          type="button"
          size="sm"
          className="shad-button_primary px-5"
          onClick={handleFollowToggle}
          disabled={isFollowing || isUnfollowing}
        >
          {isFollowing || isUnfollowing ? (
            <Loader />
          ) : isFollowed ? (
            "Unfollow"
          ) : (
            "Follow"
          )}
        </Button>
      )}
    </Link>
  );
};

export default UserCard;
