import { z } from "zod";

export const isSupportedTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

const optionalText = (max: number) =>
  z.string().trim().max(max).or(z.literal(""));

export const RestaurantSettingsFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  address: optionalText(300),
  phone: optionalText(30),
  taxId: optionalText(50),
  timeZone: z
    .string()
    .trim()
    .min(1, "Timezone is required.")
    .max(100)
    .refine(isSupportedTimeZone, "Choose a supported IANA timezone."),
  receiptFooter: optionalText(300),
  receiptPaperWidth: z.union([z.literal(58), z.literal(80)]),
});

export type RestaurantSettingsFormValues = z.infer<
  typeof RestaurantSettingsFormSchema
>;
