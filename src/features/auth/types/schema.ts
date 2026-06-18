import { z } from "zod";

import { onboardableUserRoles } from "@/types/auth";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  expectedRole: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.enum(onboardableUserRoles).optional()
  )
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2).max(120),
  role: z.enum(onboardableUserRoles).default("CUSTOMER")
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

export const passwordUpdateSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
