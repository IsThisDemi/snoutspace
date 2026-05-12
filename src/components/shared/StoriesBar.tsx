import { useRef, useState } from "react";
import { useGetStories, useCreateStory } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import StoryViewer from "./StoryViewer";
import Loader from "./Loader";

const StoriesBar = () => {
  const { user } = useUserContext();
  const { data, isLoading } = useGetStories();
  const { mutate: createStory, isPending: isCreating } = useCreateStory();
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState<{ group: any; index: number } | null>(null);

  const groups: any[] = data?.documents ?? [];

  const ownGroup = groups.find((g) => g.creator.id === user.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) createStory(file);
    e.target.value = "";
  };

  if (isLoading) return <div className="flex gap-4 px-1 py-2"><Loader /></div>;
  if (groups.length === 0 && !isLoading) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide w-full">
        {/* Own story / add story */}
        <button
          onClick={() => {
            if (ownGroup) {
              setViewing({ group: ownGroup, index: 0 });
            } else {
              fileRef.current?.click();
            }
          }}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div className={`relative w-16 h-16 rounded-full ${ownGroup ? "ring-2 ring-primary-500" : "ring-2 ring-dark-5"} ring-offset-2 ring-offset-dark-1`}>
            <img
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="your story"
              className="w-full h-full rounded-full object-cover"
            />
            {!ownGroup && (
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-dark-1">+</span>
            )}
            {isCreating && (
              <div className="absolute inset-0 rounded-full bg-dark-1/60 flex items-center justify-center">
                <Loader />
              </div>
            )}
          </div>
          <span className="tiny-medium text-light-3 w-16 text-center truncate">
            {ownGroup ? "Your story" : "Add story"}
          </span>
        </button>

        {/* Other users' stories */}
        {groups
          .filter((g) => g.creator.id !== user.id)
          .map((group, i) => (
            <button
              key={group.creator.id}
              onClick={() => setViewing({ group, index: i + 1 })}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className={`w-16 h-16 rounded-full ring-2 ring-offset-2 ring-offset-dark-1 ${group.hasUnviewed ? "ring-primary-500" : "ring-dark-5"}`}>
                <img
                  src={group.creator.imageUrl || "/assets/icons/profile-placeholder.svg"}
                  alt={group.creator.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="tiny-medium text-light-3 w-16 text-center truncate">
                {group.creator.name}
              </span>
            </button>
          ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />

      {viewing && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewing.index}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
};

export default StoriesBar;
