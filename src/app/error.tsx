"use client";

import { ErrorFallback } from "@/components/errors/ErrorFallback";

type AppErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function AppError({ error, retry }: AppErrorProps) {
  return <ErrorFallback error={error} retry={retry} />;
}
