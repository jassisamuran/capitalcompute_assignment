import { Source } from "@/types";

export function SourceCard({ source, onSelect }: { source: Source; onSelect: (s: Source) => void }) {
  return (
    <button
      onClick={() => onSelect(source)}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-xl
        overflow-hidden text-left hover:border-amber-500/50 hover:bg-zinc-800/70
        focus:outline-none focus:ring-1 focus:ring-amber-500/60
        transition-all duration-150 cursor-pointer"
    >
      <div className="aspect-video w-full overflow-hidden bg-zinc-950 relative">
        <img
          src={source.thumbnail}
          alt={source.name}
          className="w-full h-full object-cover opacity-70
            group-hover:opacity-100 transition-opacity duration-150"
          draggable={false}
        />
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
          transition-opacity bg-amber-500 text-black text-[9px] font-mono
          font-bold px-1.5 py-0.5 rounded-sm tracking-wide">
          SELECT
        </span>
      </div>
      <div className="px-3 py-2 flex items-center gap-2">
        {source.appIcon && (
          <img src={source.appIcon} alt="" className="w-3.5 h-3.5 flex-shrink-0 rounded-sm"
            draggable={false} />
        )}
        <span className="text-xs text-zinc-400 group-hover:text-zinc-200
          transition-colors truncate font-medium">
          {source.name}
        </span>
      </div>
    </button>
  )
}