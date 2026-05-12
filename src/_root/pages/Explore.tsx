import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { Input } from "@/components/ui";
import useDebounce from "@/hooks/useDebounce";
import { GridPostList, Loader } from "@/components/shared";
import UserCard from "@/components/shared/UserCard";
import { useGetPosts, useSearchPosts, useGetTrendingPosts, useGetUsers } from "@/lib/react-query/queries";

export type SearchResultProps = {
  isSearchFetching: boolean;
  searchedPosts: any;
};

const SearchResults = ({
  isSearchFetching,
  searchedPosts,
}: SearchResultProps) => {
  if (isSearchFetching) {
    return <Loader />;
  } else if (searchedPosts && searchedPosts.documents.length > 0) {
    return <GridPostList posts={searchedPosts.documents} />;
  } else {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No results found</p>
    );
  }
};

const Explore = () => {
  const { ref, inView } = useInView();
  const { data: posts, fetchNextPage, hasNextPage } = useGetPosts();
  const { data: trendingData } = useGetTrendingPosts();

  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "people">("posts");
  const debouncedSearch = useDebounce(searchValue, 500);
  const { data: searchedPosts, isFetching: isSearchFetching } = useSearchPosts(debouncedSearch);
  const { data: searchedUsers, isFetching: isUsersFetching } = useGetUsers(
    undefined,
    debouncedSearch || undefined
  );

  useEffect(() => {
    if (inView && !searchValue) {
      fetchNextPage();
    }
  }, [inView, searchValue]);

  if (!posts)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  const shouldShowSearchResults = searchValue !== "";
  const shouldShowPosts =
    !shouldShowSearchResults &&
    posts.pages.every((item) => item.documents.length === 0);

  const trendingPosts = trendingData?.documents ?? [];

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search posts or people…"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {searchValue && (
          <div className="flex gap-2 w-full mt-2">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-4 py-1.5 rounded-lg small-semibold transition ${
                activeTab === "posts"
                  ? "bg-primary-600 text-white"
                  : "bg-dark-4 text-light-3 hover:text-light-1"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={`px-4 py-1.5 rounded-lg small-semibold transition ${
                activeTab === "people"
                  ? "bg-primary-600 text-white"
                  : "bg-dark-4 text-light-3 hover:text-light-1"
              }`}
            >
              People
            </button>
          </div>
        )}
      </div>

      {shouldShowSearchResults && activeTab === "people" ? (
        <div className="flex flex-wrap gap-9 w-full max-w-5xl mt-6">
          {isUsersFetching ? (
            <Loader />
          ) : searchedUsers?.documents?.length > 0 ? (
            searchedUsers.documents.map((u: any) => (
              <UserCard key={u.id} user={u} />
            ))
          ) : (
            <p className="text-light-4 mt-10 text-center w-full">No users found</p>
          )}
        </div>
      ) : (
        <>
          {!shouldShowSearchResults && trendingPosts.length > 0 && (
            <div className="flex-between w-full max-w-5xl mt-16 mb-7">
              <h3 className="body-bold md:h3-bold">🔥 Trending This Week</h3>
              <div className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2">
                <p className="small-medium md:base-medium text-light-2">All</p>
                <img
                  src="/assets/icons/filter.svg"
                  width={20}
                  height={20}
                  alt="filter"
                />
              </div>
            </div>
          )}

          {!shouldShowSearchResults && trendingPosts.length > 0 && (
            <div className="flex flex-wrap gap-9 w-full max-w-5xl mb-10">
              <GridPostList posts={trendingPosts} />
            </div>
          )}

          <div className="flex-between w-full max-w-5xl mt-4 mb-7">
            <h3 className="body-bold md:h3-bold">
              {shouldShowSearchResults ? "Results" : "Popular Today"}
            </h3>
            {!shouldShowSearchResults && (
              <div className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer">
                <p className="small-medium md:base-medium text-light-2">All</p>
                <img
                  src="/assets/icons/filter.svg"
                  width={20}
                  height={20}
                  alt="filter"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-9 w-full max-w-5xl">
            {shouldShowSearchResults ? (
              <SearchResults
                isSearchFetching={isSearchFetching}
                searchedPosts={searchedPosts}
              />
            ) : shouldShowPosts ? (
              <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
            ) : (
              posts.pages.map((item, index) => (
                <GridPostList key={`page-${index}`} posts={item.documents} />
              ))
            )}
          </div>

          {hasNextPage && !searchValue && (
            <div ref={ref} className="mt-10">
              <Loader />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
