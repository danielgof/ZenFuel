/* ========================================
   INFO CARD
======================================== */

export function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="text-slate-400 text-sm mb-2">
        {label}
      </div>

      <div className="text-lg font-semibold">
        {value}
      </div>
    </div>
  );
}