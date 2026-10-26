"use server";

import { auth } from "@/auth";
import { createUser } from "@/features/users/repository";
import { registrationSchema } from "./schemas";

export type RegistrationState = {
  error?: string;
  email?: string;
  registered?: boolean;
};

export async function registerUserAction(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const session = await auth();
  if (session) {
    return { error: "Sign out before creating a new member account." };
  }

  const input = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
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
