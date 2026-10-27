"use server";

import { auth } from "@/auth";
import { createUser } from "@/features/users/repository";
import { getRequestClientIp, parseFormData, rateLimit } from "@/lib/security";
import { registrationSchema } from "./schemas";

export type RegistrationState = {
  error?: string;
  email?: string;
  registered?: boolean;
};

const REGISTRATION_LIMIT = 5;
const REGISTRATION_WINDOW_MS = 10 * 60 * 1000;

export async function registerUserAction(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const session = await auth();
  if (session) {
    return { error: "Sign out before creating a new member account." };
  }

  const clientIp = await getRequestClientIp();
  const limited = await rateLimit(
    `register:${clientIp}`,
    REGISTRATION_LIMIT,
    REGISTRATION_WINDOW_MS,
  );
  if (!limited.ok) {
    return {
      error: "Too many registration attempts. Please try again later.",
    };
  }

  // Client validation is for UX only; re-validate every field on the server.
  const input = parseFormData(registrationSchema, formData, [
    "name",
    "email",
    "password",
  ]);
  if (!input.success) {
    return {
      error:
        "Enter a valid name and email, and use a password between 8 and 128 characters.",
    };
  }

  try {
    const registeredUser = await createUser(input.data);
    return { email: registeredUser.email, registered: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "An account with this email already exists."
    ) {
      return { error: error.message };
    }
    console.error("Could not register the member account.", error);
    return { error: "Could not create your account. Please try again." };
  }
}
