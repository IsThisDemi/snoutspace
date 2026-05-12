import { useState } from "react";
import { useGetUsers, useSearchPosts, useSearchPostsByTag } from "@/lib/react-query/queries";
import { IDocument } from "@/types";
import Loader from "@/components/shared/Loader";
import GridPostList from "@/components/shared/GridPostList";
import UserCard from "@/components/shared/UserCard";

type Tab = "people" | "posts" | "tags";

const Search = () => {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("people");

  const { data: usersData, isLoading: loadingUsers } = useGetUsers(undefined, query);
  const { data: postsData, isLoading: loadingPosts } = useSearchPosts(tab === "posts" ? query : "");
  const { data: tagsData, isLoading: loadingTags } = useSearchPostsByTag(tab === "tags" ? query : "");

  const tabs: { key: Tab; label: string }[] = [
    { key: "people", label: "People" },
    { key: "posts", label: "Posts" },
    { key: "tags", label: "Tags" },
  ];

  const renderResults = () => {
    if (tab === "people") {
      if (loadingUsers) return <Loader />;
      const users = usersData?.documents ?? [];
      if (!query) return <p className="text-light-4 small-regular text-center py-8">Type to search people</p>;
      if (users.length === 0) return <p className="text-light-4 small-regular text-center py-8">No users found</p>;
      return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {users.map((u: IDocument) => (
            <li key={u.id}><UserCard user={u} /></li>
          ))}
        </ul>
      );
    }

    if (tab === "posts") {
      if (loadingPosts) return <Loader />;
      const posts = postsData?.documents ?? [];
      if (!query) return <p className="text-light-4 small-regular text-center py-8">Type to search posts</p>;
      if (posts.length === 0) return <p className="text-light-4 small-regular text-center py-8">No posts found</p>;
      return <GridPostList posts={posts} />;
    }

    if (tab === "tags") {
      if (loadingTags) return <Loader />;
      const posts = tagsData?.documents ?? [];
      if (!query) return <p className="text-light-4 small-regular text-center py-8">Type to search by tag</p>;
      if (posts.length === 0) return <p className="text-light-4 small-regular text-center py-8">No posts found for this tag</p>;
      return <GridPostList posts={posts} />;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 py-8 px-5 md:px-8 max-w-5xl w-full mx-auto">
      <div className="flex items-center gap-3">
        <img src="/assets/icons/wallpaper.svg" alt="search" width={30} height={30} className="invert-white" />
        <h2 className="h3-bold md:h2-bold">Search</h2>
      </div>

      <div className="flex items-center gap-3 bg-dark-4 rounded-xl px-4 py-2 ring-1 ring-[var(--color-glass-border)] focus-within:ring-primary-500/50 transition">
        <img src="/assets/icons/search.svg" alt="search" width={20} height={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="flex-1 bg-transparent text-light-1 placeholder:text-light-4 small-regular focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-light-4 hover:text-light-1 transition">✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg small-semibold transition ${
              tab === key
                ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-[0_0_12px_#a78bfa30]"
                : "bg-dark-4 text-light-3 hover:text-light-1"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1">{renderResults()}</div>
    </div>
  );
};

export default Search;
