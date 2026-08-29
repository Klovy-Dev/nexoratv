import type { ReactNode } from "react";

type CalloutType = "tip" | "info" | "warning" | "danger" | "success";

const META: Record<CalloutType, { icon: string; label: string }> = {
  tip: { icon: "💡", label: "Astuce" },
  info: { icon: "📶", label: "Info" },
  warning: { icon: "⚠️", label: "Attention" },
  danger: { icon: "🔒", label: "Important" },
  success: { icon: "✅", label: "Conseil" },
};

export default function Callout({
  type = "info",
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  const { icon, label } = META[type];
  return (
    <div className={`callout callout-${type}`}>
      <span className="callout-label">
        {icon} {label}
      </span>
      <p>{children}</p>
    </div>
  );
}
