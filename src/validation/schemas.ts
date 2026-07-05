import { z } from "zod";

const emailValidator = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")
  .max(255, "Email must be less than 255 characters.");

const passwordValidator = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .max(72, "Password must be less than 72 characters.");

const nameValidator = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(100, "Full name must be less than 100 characters.")
  .regex(/^[a-zA-Z\s\-']+$/, "Name contains invalid characters.");

export const loginSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: nameValidator,
    email: emailValidator,
    password: passwordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
