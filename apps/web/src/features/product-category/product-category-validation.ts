import { z } from "zod";

export const ProductCategoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(100),
  description: z.string().trim().max(300, "Description must contain 300 characters or fewer"),
  sortOrder: z
    .string()
    .regex(/^\d+$/, "Sort order must be a non-negative whole number"),
  isActive: z.boolean(),
});

export type ProductCategoryFormValues = z.infer<typeof ProductCategoryFormSchema>;
