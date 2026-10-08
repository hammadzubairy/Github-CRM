import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start your free FlowDesk workspace in under a minute.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return <SignupForm />;
}
