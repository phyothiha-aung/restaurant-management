import { z } from "zod";

export const DiningTableFormSchema = z.object({
  name: z.string().trim().min(1, "Table name is required").max(50),
  capacity: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100),
      "Capacity must be a whole number from 1 to 100",
    ),
  sortOrder: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      "Display order must be zero or greater",
    ),
  isActive: z.boolean(),
});

export type DiningTableFormValues = z.infer<typeof DiningTableFormSchema>;
