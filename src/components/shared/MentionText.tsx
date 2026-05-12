import { Link } from "react-router-dom";

type MentionTextProps = {
  text: string;
  className?: string;
};

const MentionText = ({ text, className }: MentionTextProps) => {
  const parts = text.split(/(@\w+)/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^@\w+$/.test(part) ? (
          <Link
            key={i}
            to={`/u/${part.slice(1)}`}
            className="text-primary-500 hover:text-primary-400 transition"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default MentionText;
