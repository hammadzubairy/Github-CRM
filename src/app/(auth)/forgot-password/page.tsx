import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset the password for your FlowDesk account.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
