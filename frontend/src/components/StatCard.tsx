interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
}

export default function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{title}</div>
      <div className="text-2xl font-semibold mt-1 text-white">{value}</div>
      {hint ? <div className="text-xs text-zinc-500 mt-2">{hint}</div> : null}
    </div>
  );
}
