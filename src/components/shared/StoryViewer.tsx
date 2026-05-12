import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useViewStory, useDeleteStory } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { multiFormatDateString } from "@/lib/utils";

type StoryViewerProps = {
  groups: any[];
  initialGroupIndex: number;
  onClose: () => void;
};

const STORY_DURATION = 5000;

const StoryViewer = ({ groups, initialGroupIndex, onClose }: StoryViewerProps) => {
  const { user } = useUserContext();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { mutate: viewStory } = useViewStory();
  const { mutate: deleteStory } = useDeleteStory();

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  useEffect(() => {
    if (!story) return;
    viewStory(story.id);
    setProgress(0);

    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          advance();
          return 0;
        }
        return p + 100 / (STORY_DURATION / 100);
      });
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [story?.id]);

  const advance = () => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goBack = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(0);
    }
  };

  if (!group || !story) return null;

  const isOwn = group.creator.id === user.id;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full max-w-sm h-full max-h-[85vh] rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {group.stories.map((_: any, i: number) => (
            <div key={i} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 flex items-center justify-between z-10">
          <Link to={`/profile/${group.creator.id}`} className="flex items-center gap-2" onClick={onClose}>
            <img
              src={group.creator.imageUrl || "/assets/icons/profile-placeholder.svg"}
              className="w-9 h-9 rounded-full ring-2 ring-white/30 object-cover"
              alt={group.creator.name}
            />
            <div>
              <p className="small-semibold text-white">{group.creator.name}</p>
              <p className="tiny-medium text-white/60">{multiFormatDateString(story.createdAt)}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isOwn && (
              <button
                onClick={() => { deleteStory(story.id); advance(); }}
                className="text-white/70 hover:text-white transition"
              >
                <img src="/assets/icons/delete.svg" alt="delete" width={18} height={18} />
              </button>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white transition text-xl leading-none">×</button>
          </div>
        </div>

        {/* Image */}
        <img
          src={story.imageUrl}
          alt="story"
          className="w-full h-full object-cover"
        />

        {/* Tap zones */}
        <button className="absolute left-0 top-0 h-full w-1/3 z-10" onClick={goBack} />
        <button className="absolute right-0 top-0 h-full w-1/3 z-10" onClick={advance} />

        {/* Views count (own story) */}
        {isOwn && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white/70 tiny-medium">
            <img src="/assets/icons/people.svg" alt="views" width={14} height={14} className="opacity-60" />
            {story.viewerCount} views
          </div>
        )}
      </div>

      {/* Close outside */}
      <button className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl z-50" onClick={onClose}>×</button>
    </div>
  );
};

export default StoryViewer;
