import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
