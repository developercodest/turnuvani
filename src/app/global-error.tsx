"use client";

import { ErrorFallback } from "@/components/errors/ErrorFallback";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>
        <ErrorFallback error={error} retry={retry} />
      </body>
    </html>
  );
}
