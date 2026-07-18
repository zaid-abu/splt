import { z } from "zod";

const emailValidator = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")
  .max(255, "Email must be less than 255 characters.");

export const accountPasswordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[0-9]|[^A-Za-z0-9]/, "Password must include at least one number or symbol.");

const nameValidator = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(100, "Full name must be less than 100 characters.")
  .regex(/^[a-zA-Z\s\-']+$/, "Name contains invalid characters.");

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, "Password is required."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const passwordFormSchema = z
  .object({
    password: accountPasswordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const registerSchema = z
  .object({
    name: nameValidator,
    email: emailValidator,
    password: accountPasswordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordFormData = z.infer<typeof passwordFormSchema>;

export const forgotPasswordSchema = z.object({ email: emailValidator });
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
