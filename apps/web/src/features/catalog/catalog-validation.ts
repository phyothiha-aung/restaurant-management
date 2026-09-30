import { z } from "zod";

const integer = z.string().regex(/^\d+$/, "Enter a whole number");
const money = z.string().trim().regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, "Enter a valid amount with up to 2 decimal places");
const addonAssignment = z.object({
  addonId: z.number().int().positive(),
  maxQuantity: z.number().int("Enter a whole number").min(1, "Minimum quantity is 1"),
  sortOrder: z.number().int("Enter a whole number").min(0, "Order cannot be negative"),
});

export const ProductFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().max(30),
  description: z.string().trim().max(1000),
  categoryId: z.string().refine((value) => Number(value) > 0, "Select a category"),
  sortOrder: integer,
  isActive: z.boolean(),
  variants: z.array(z.object({
    id: z.number().optional(),
    name: z.string().trim().min(1).max(50),
    price: money,
    sortOrder: integer,
    isActive: z.boolean(),
  })).min(1, "Add at least one variant"),
  addons: z.array(addonAssignment),
}).superRefine((value, context) => {
  if (value.isActive && !value.variants.some((variant) => variant.isActive)) {
    context.addIssue({ code: "custom", path: ["variants"], message: "An active product needs an active variant" });
  }
  const names = value.variants.map((variant) => variant.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    context.addIssue({ code: "custom", path: ["variants"], message: "Variant names must be unique" });
  }
  const addonIds = value.addons.map((assignment) => assignment.addonId);
  if (new Set(addonIds).size !== addonIds.length) {
    context.addIssue({ code: "custom", path: ["addons"], message: "An add-on can only be assigned once" });
  }
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export const AddonFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unitPrice: money,
  isActive: z.boolean(),
});
export type AddonFormValues = z.infer<typeof AddonFormSchema>;
