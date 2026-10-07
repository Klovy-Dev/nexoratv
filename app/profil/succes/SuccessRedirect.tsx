"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Compte à rebours puis redirection vers `to`. */
export default function SuccessRedirect({ to, seconds }: { to: string; seconds: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      router.replace(to);
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, router, to]);

  return (
    <p className="muted" style={{ marginTop: 24 }}>
      Redirection vers ton espace dans {left} s…{" "}
      <Link href={to} style={{ color: "var(--text)" }}>
        Y aller maintenant
      </Link>
    </p>
  );
}
