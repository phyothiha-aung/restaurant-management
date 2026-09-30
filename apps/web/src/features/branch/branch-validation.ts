import { z } from "zod";

export const BranchFormSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(100),
  branchCode: z.string().trim().max(30, "Branch code must be 30 characters or fewer"),
  address: z.string().trim().max(300, "Address must be 300 characters or fewer"),
  phone: z.string().trim().max(30, "Phone must be 30 characters or fewer"),
  isActive: z.boolean(),
});

export type BranchFormValues = z.infer<typeof BranchFormSchema>;
