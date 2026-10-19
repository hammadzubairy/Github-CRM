"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { signInWithPassword } from "@/features/auth/actions";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthDivider, DemoNotice } from "./demo-notice";
import { DemoLoginButton } from "./demo-login-button";
import { GoogleButton } from "./google-button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const callbackError = searchParams.get("error");
  const [pending, startTransition] = useTransition();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: isSupabaseConfigured
      ? { email: "", password: "" }
      : { email: "demo@torix.app", password: "demo-password" },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await signInWithPassword(values, next);
      if (result?.error) toast.error(result.error);
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Log in to manage your bookings and clients.</p>

      {callbackError ? (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          That sign-in link is invalid or has expired. Please try again.
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        <DemoLoginButton size="lg" className="w-full" next={next}>
          Try demo account
        </DemoLoginButton>
        {isSupabaseConfigured ? <GoogleButton next={next} /> : null}
      </div>

      <AuthDivider label="or with email" />

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
          />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            labelAside={
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            }
          />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Log in
          </Button>
        </FieldGroup>
      </form>

      {!isSupabaseConfigured ? (
        <div className="mt-5">
          <DemoNotice>
            This is a live demo. Any credentials sign you in to a sample workspace with realistic data that is
            saved in your browser.
          </DemoNotice>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to FlowDesk?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
