/* ========================================
   SELECTOR CARD
======================================== */

export function SelectorCard({
  icon,
  label,
  children,
}: any) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3 text-slate-300">
        {icon}

        <span className="font-medium">
          {label}
        </span>
      </div>

      {children}
    </div>
  );
}