"use client";

import { useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/actions";

export function GoogleButton({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signInWithGoogle(next);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <GoogleIcon className="size-4" />}
      Continue with Google
    </Button>
  );
}
