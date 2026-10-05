import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "./user-options";

const optionalPassword = z.union([
  z.literal(""),
  z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password must contain 72 characters or fewer"),
]);

export const createUserFormSchema = (isEditing: boolean) =>
    z.object({
      name: z.string().trim().min(2, "Name must contain at least 2 characters"),
      email: z.string().trim().email("Enter a valid email address"),
      password: isEditing
        ? optionalPassword
        : z
            .string()
            .min(8, "Password must contain at least 8 characters")
            .max(72, "Password must contain 72 characters or fewer"),
      role: z.enum(USER_ROLES),
      status: z.enum(USER_STATUSES),
    });

export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;
