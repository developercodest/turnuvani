"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useWizardLeaveGuard } from "./WizardLeaveGuard";

type GuardedLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "onClick" | "children"> & {
  href: string;
  children: ReactNode;
};

export function GuardedLink({ href, children, ...linkProps }: GuardedLinkProps) {
  const router = useRouter();
  const { requestLeave } = useWizardLeaveGuard();

  return <Link href={href} {...linkProps} onClick={(event) => { event.preventDefault(); requestLeave(() => router.push(href)); }}>{children}</Link>;
}
