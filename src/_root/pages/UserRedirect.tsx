import { useParams, Navigate } from "react-router-dom";
import { useGetUserByUsername } from "@/lib/react-query/queries";
import Loader from "@/components/shared/Loader";

const UserRedirect = () => {
  const { username } = useParams<{ username: string }>();
  const { data: user, isLoading, isError } = useGetUserByUsername(username || "");

  if (isLoading)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  if (isError || !user)
    return (
      <div className="flex-center w-full h-full text-light-3 small-regular">
        User @{username} not found.
      </div>
    );

  return <Navigate to={`/profile/${user.id}`} replace />;
};

export default UserRedirect;
