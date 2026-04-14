import { Source } from "@/types";
import React from "react";
interface SourceCardProps {
  source: Source;
  onSelect: (s: Source) => void;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, onSelect }) => {
  return (
    <button onClick={() => onSelect(source)}>
      <div className="aspect-video w-full overflow-hidden bg-zinc-950 relative">
        <img src={source.thumbnail} alt={source.name} draggable={false} />
        <div />
        <span>SELECT</span>
      </div>

      {/* Label */}
      <div>
        {source.appIcon && (
          <img
            src={source.appIcon}
            alt=""
            className="w-3.5 h-3.5 flex-shrink-0 rounded-sm"
            draggable={false}
          />
        )}
        <span>{source.name}</span>
      </div>
    </button>
  );
};

export default SourceCard;
