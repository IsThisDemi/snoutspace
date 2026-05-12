import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared";
import GridPostList from "@/components/shared/GridPostList";
import { useGetPostsByTag } from "@/lib/react-query/queries";

const TagFeed = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPostsByTag(tag || "");

  return (
    <div className="explore-container">
      <div className="hidden md:flex max-w-5xl w-full">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="shad-button_ghost"
        >
          <img src={"/assets/icons/back.svg"} alt="back" width={24} height={24} />
          <p className="small-medium lg:base-medium">Back</p>
        </Button>
      </div>

      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">
          <span className="text-primary-500">#</span>{tag}
        </h2>
        {data && (
          <p className="text-light-3 small-regular">
            {data.total} {data.total === 1 ? "post" : "posts"}
          </p>
        )}
      </div>

      {isLoading ? (
        <Loader />
      ) : !data || data.documents.length === 0 ? (
        <p className="text-light-4 mt-10 text-center w-full">No posts with this tag yet.</p>
      ) : (
        <div className="flex flex-wrap gap-9 w-full max-w-5xl mt-8">
          <GridPostList posts={data.documents} />
        </div>
      )}
    </div>
  );
};

export default TagFeed;
