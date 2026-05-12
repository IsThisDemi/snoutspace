import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";

import { Button } from "@/components/ui/button";
import { LikedPosts } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserById, useFollowUser, useUnfollowUser } from "@/lib/react-query/queries";
import Loader from "@/components/shared/Loader";
import GridPostList from "@/components/shared/GridPostList";

interface StabBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();

  const { data: currentUser } = useGetUserById(id || "");
  const { mutate: follow, isPending: isFollowing } = useFollowUser(id || "");
  const { mutate: unfollow, isPending: isUnfollowing } = useUnfollowUser(id || "");

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  const isOwnProfile = user.id === id;
  const isFollowed = currentUser.isFollowedByCurrentUser;
  const isPrivateBlocked = currentUser.isPrivate && !isFollowed && !isOwnProfile;

  const handleFollowToggle = () => {
    if (isFollowed) {
      unfollow();
    } else {
      follow();
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={
              currentUser.imageUrl || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full ring-2 ring-primary-500/30"
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-2 justify-center xl:justify-start">
                <h1 className="text-center xl:text-left h3-bold md:h1-semibold">
                  {currentUser.name}
                </h1>
                {currentUser.isPrivate && (
                  <img src="/assets/icons/lock.svg" alt="private" width={18} height={18} className="opacity-60" />
                )}
              </div>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser.username}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={currentUser.posts?.length ?? 0} label="Posts" />
              <StatBlock value={currentUser.followerCount ?? 0} label="Followers" />
              <StatBlock value={currentUser.followingCount ?? 0} label="Following" />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
              {currentUser.bio}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {isOwnProfile ? (
              <Link
                to={`/update-profile/${currentUser.id}`}
                className="h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg"
              >
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            ) : (
              <Button
                type="button"
                className="shad-button_primary px-8"
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
          </div>
        </div>
      </div>

      {currentUser.id === user.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${
              pathname === `/profile/${id}` && "!bg-dark-3"
            }`}
          >
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab rounded-r-lg ${
              pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
            }`}
          >
            <img
              src={"/assets/icons/like.svg"}
              alt="like"
              width={20}
              height={20}
            />
            Liked Posts
          </Link>
        </div>
      )}

      {isPrivateBlocked ? (
        <div className="flex flex-col items-center gap-4 mt-10 text-light-3">
          <img src="/assets/icons/lock.svg" alt="private" width={48} height={48} className="opacity-30" />
          <p className="body-bold text-light-2">This account is private</p>
          <p className="small-regular">Follow to see their posts.</p>
        </div>
      ) : (
        <Routes>
          <Route
            index
            element={<GridPostList posts={currentUser.posts ?? []} showUser={false} />}
          />
          {currentUser.id === user.id && (
            <Route path="/liked-posts" element={<LikedPosts />} />
          )}
        </Routes>
      )}
      <Outlet />
    </div>
  );
};

export default Profile;
