"use client";

import { useTransition } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startDemoSession } from "@/features/auth/actions";

type ButtonProps = React.ComponentProps<typeof Button>;

export function DemoLoginButton({
  children = "Try demo account",
  next,
  showArrow = true,
  ...props
}: ButtonProps & { next?: string; showArrow?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={() => startTransition(() => startDemoSession(next))}
    >
      {pending ? <Loader2Icon className="animate-spin" /> : null}
      {children}
      {showArrow && !pending ? (
        <ArrowRightIcon className="transition-transform group-hover/button:translate-x-0.5" />
      ) : null}
    </Button>
  );
}
