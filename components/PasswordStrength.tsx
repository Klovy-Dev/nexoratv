"use client";

import { passwordStrength } from "@/lib/validation";

export default function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const { score, label } = passwordStrength(value);

  return (
    <div className="pw-strength" data-score={score}>
      <div className="pw-strength-track">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < score ? "on" : ""} />
        ))}
      </div>
      <span className="pw-strength-label">{label}</span>
    </div>
  );
}
