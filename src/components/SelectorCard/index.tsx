/* ========================================
   SELECTOR CARD
======================================== */

export function SelectorCard({
  icon,
  label,
  children,
  className = "",
}: any) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-white/[0.03]
        backdrop-blur-2xl
        p-4
        transition-all
        duration-300
        hover:bg-white/[0.05]
        hover:border-white/20
        hover:-translate-y-[2px]
        shadow-[0_4px_20px_rgba(0,0,0,0.25)]
        ${className}
      `}
    >
      {/* subtle glow */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-white/[0.03]
          via-transparent
          to-transparent
          pointer-events-none
        "
      />

      <div className="relative">
        {/* HEADER */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="
              w-8
              h-8
              rounded-xl
              bg-white/[0.04]
              border
              border-white/10
              flex
              items-center
              justify-center
              text-slate-300
            "
          >
            {icon}
          </div>

          <span className="text-sm font-medium text-slate-200 tracking-wide">
            {label}
          </span>
        </div>

        {/* CONTENT */}
        {children}
      </div>
    </div>
  );
}