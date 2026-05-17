
/* ========================================
   METRIC CARD
======================================== */

import { Gauge } from "lucide-react";

export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-4">
        <Gauge size={18} />

        <span>{label}</span>
      </div>

      <div className="text-5xl font-black">
        {value}
      </div>
    </div>
  );
}