import { Source } from "@/types";

export default function SourceCard({
  source,
  onSelect,
}: {
  source: Source;
  onSelect: (s: Source) => void;
}) {
  return (
    <button onClick={() => onSelect(source)} className="group text-left">
      <div className="relative rounded-lg overflow-hidden border border-transparent hover:border-blue-500 transition">
        <img src={source.thumbnail} className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <span className="text-xs text-white">Click to select</span>
        </div>
      </div>

      <div className="mt-2 text-sm text-zinc-300 truncate">{source.name}</div>
    </button>
  );
}
