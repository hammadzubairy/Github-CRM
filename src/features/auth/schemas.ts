import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name"),
  businessName: z.string().trim().min(2, "Business name is required").max(60),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").regex(/[0-9]/, "Include at least one number"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export interface AuthActionResult {
  error?: string;
  message?: string;
}
