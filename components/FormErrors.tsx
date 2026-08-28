import type { FormState } from "@/lib/types";

export default function FormErrors({ state }: { state: FormState }) {
  const messages = state.fieldErrors ?? (state.error ? [state.error] : []);
  if (messages.length === 0) return null;

  return (
    <ul className="form-errors">
      {messages.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  );
}
