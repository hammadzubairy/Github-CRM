"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { signUpWithPassword } from "@/features/auth/actions";
import { signupSchema, type SignupValues } from "@/features/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthDivider, DemoNotice } from "./demo-notice";
import { DemoLoginButton } from "./demo-login-button";
import { GoogleButton } from "./google-button";

export function SignupForm() {
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", businessName: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await signUpWithPassword(values);
      if (result?.error) toast.error(result.error);
      if (result?.message) setSentTo(values.email);
    }),
  );

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheckIcon className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{sentTo}</span>. Click
          it to activate your workspace.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Free forever for solo businesses. No credit card required.
      </p>

      <div className="mt-6 space-y-3">
        {isSupabaseConfigured ? <GoogleButton /> : null}
        <DemoLoginButton
          size="lg"
          variant={isSupabaseConfigured ? "secondary" : "default"}
          className="w-full"
        >
          Explore the demo first
        </DemoLoginButton>
      </div>

      <AuthDivider label="or sign up with email" />

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <TextField
            control={form.control}
            name="name"
            label="Your name"
            autoComplete="name"
            placeholder="Alex Morgan"
          />
          <TextField
            control={form.control}
            name="businessName"
            label="Business name"
            autoComplete="organization"
            placeholder="Lumière Hair Studio"
          />
          <TextField
            control={form.control}
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
          />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            description="At least 8 characters, including a number."
          />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Create account
          </Button>
        </FieldGroup>
      </form>

      {!isSupabaseConfigured ? (
        <div className="mt-5">
          <DemoNotice>
            Sign-ups are simulated in this demo. You will land in a sample workspace you can freely edit.
          </DemoNotice>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to the Terms of Service and Privacy Policy.
      </p>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
