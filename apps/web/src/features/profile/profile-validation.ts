import { z } from "zod";

export const ProfileFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must contain at least 2 characters"),
    password: z.union([
      z.literal(""),
      z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(72, "Password must contain 72 characters or fewer"),
    ]),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;
