"use server";

import { auth } from "@/auth";
import { createUser } from "@/features/users/repository";

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

  const name = readString(formData, "name").trim();
  const email = readString(formData, "email").trim().toLowerCase();
  const password = readString(formData, "password");

  if (name.length < 2 || name.length > 80) {
    return { error: "Enter a name between 2 and 80 characters." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "Use a password between 8 and 128 characters." };
  }

  try {
    const user = await createUser({ name, email, password });
    return { email: user.email, registered: true };
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

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
