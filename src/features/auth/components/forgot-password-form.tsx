"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { requestPasswordReset } from "@/features/auth/actions";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/features/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { DemoNotice } from "./demo-notice";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (result.error) toast.error(result.error);
      if (result.message) setMessage(result.message);
    }),
  );

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Back to log in
      </Link>
      {message ? (
        <div className="mt-8" role="status">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <MailCheckIcon className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
      ) : (
        <>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter the email you signed up with and we will send you a secure reset link.
          </p>
          <form onSubmit={onSubmit} noValidate className="mt-6">
            <FieldGroup>
              <TextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@business.com"
              />
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? <Loader2Icon className="animate-spin" /> : null}
                Send reset link
              </Button>
            </FieldGroup>
          </form>
        </>
      )}
      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <DemoNotice>Demo mode: no email is actually sent.</DemoNotice>
        </div>
      ) : null}
    </div>
  );
}
