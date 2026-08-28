"use client";

export default function ConfirmSubmit({
  children,
  className,
  confirm,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  confirm: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
