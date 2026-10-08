"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { initials } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { SettingsCard } from "./settings-card";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email"),
  title: z.string().trim().max(60),
});

type Values = z.infer<typeof schema>;

export function ProfileSettings() {
  const profile = useAppStore((s) => s.profile);
  const mode = useAppStore((s) => s.mode);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: profile.name, email: profile.email, title: profile.title },
  });

  const watchedName = useWatch({ control: form.control, name: "name" });

  const onSubmit = form.handleSubmit(async (values) => {
    const ok = await updateProfile(values);
    if (ok) {
      form.reset(values);
      toast.success("Profile updated");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsCard
        title="Profile"
        description="How you appear to your team and in activity history."
        footer={
          <Button type="submit" size="sm" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            Save profile
          </Button>
        }
      >
        <div className="flex items-center gap-4">
          <span className="bg-brand-gradient grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white">
            {initials(watchedName || profile.name)}
          </span>
          <div className="text-sm">
            <p className="font-medium">{profile.name}</p>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <FieldGroup className="mt-6 gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="name" label="Full name" autoComplete="name" />
            <TextField control={form.control} name="title" label="Job title" placeholder="Owner" />
          </div>
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            disabled={mode === "supabase"}
            description={mode === "supabase" ? "Your sign-in email is managed by your account." : undefined}
          />
        </FieldGroup>
      </SettingsCard>
    </form>
  );
}
