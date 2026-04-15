export default function FileRow({
  filename,
  tag,
}: {
  filename: string;
  tag: string;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs font-mono text-zinc-400">{filename}</span>
      <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
        {tag}
      </span>
    </div>
  );
}
