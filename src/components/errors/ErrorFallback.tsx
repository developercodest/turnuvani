"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main
      role="alert"
      aria-labelledby="error-title"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f7f9fc",
        color: "#0b1535",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <section style={{ width: "min(100%, 480px)", textAlign: "center" }}>
        <p style={{ margin: "0 0 12px", color: "#2563eb", fontWeight: 700 }}>
          TURNUVANI
        </p>
        <h1 id="error-title" style={{ margin: "0 0 12px", fontSize: "1.75rem" }}>
          Beklenmeyen bir sorun oluştu
        </h1>
        <p style={{ margin: "0 auto 24px", color: "#5d6c8b", lineHeight: 1.6 }}>
          Sayfa yüklenirken bir hata oluştu. Tekrar deneyebilir veya ana sayfaya dönebilirsin.
        </p>
        {error.digest ? (
          <p style={{ margin: "-12px 0 24px", color: "#68758e", fontSize: ".875rem" }}>
            Hata kodu: {error.digest}
          </p>
        ) : null}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
          <button
            type="button"
            onClick={retry}
            style={{
              minHeight: 44,
              padding: "0 20px",
              border: 0,
              borderRadius: 8,
              background: "#2864eb",
              color: "#fff",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            style={{
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 20px",
              border: "1px solid #d7deeb",
              borderRadius: 8,
              color: "#243452",
              background: "#fff",
              fontWeight: 700,
            }}
          >
            Ana sayfaya dön
          </Link>
        </div>
      </section>
    </main>
  );
}
