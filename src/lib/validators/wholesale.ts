import { z } from "zod";

export const wholesaleEnquirySchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  phone: z.string().min(9, "Valid phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  businessType: z.enum(["HOTEL", "RESTAURANT", "CATERING", "SUPERMARKET", "EXPORTER", "OTHER"]),
  district: z.string().min(2, "District is required"),
  estimatedKgPerWeek: z.number().int().positive("Estimated volume in kg must be greater than 0"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type WholesaleEnquiryInput = z.infer<typeof wholesaleEnquirySchema>;
