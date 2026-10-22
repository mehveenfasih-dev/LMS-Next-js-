"use client";

import { useActionState, useEffect, useState } from "react";
import GoogleIcon from "@mui/icons-material/Google";
import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn as authSignIn } from "next-auth/react";
import { useAuth } from "../../components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  registerUserAction,
  type RegistrationState,
} from "./actions";

const initialRegistrationState: RegistrationState = {};

export function AuthForm({
  mode,
  nextPath,
  googleEnabled = false,
}: {
  mode: "login" | "register";
  nextPath?: string;
  googleEnabled?: boolean;
}) {
  return mode === "register" ? (
    <RegistrationForm />
  ) : (
    <LoginForm googleEnabled={googleEnabled} nextPath={nextPath} />
  );
}

function LoginForm({
  googleEnabled,
  nextPath,
}: {
  googleEnabled: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const { signIn, user, ready } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && ready) {
      router.replace(getPostSignInPath(user.role, nextPath));
    }
  }, [nextPath, ready, router, user]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await signIn(email, password);
      router.replace(getPostSignInPath(user.role, nextPath));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? t(cause.message)
          : t("Could not complete sign in."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    setError("");
    setSubmitting(true);
    try {
      const callbackPath = nextPath
        ? `/login?next=${encodeURIComponent(nextPath)}`
        : "/login";
      await authSignIn("google", { redirectTo: callbackPath });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("Could not complete sign in."),
      );
      setSubmitting(false);
    }
  }

  return (
    <Box className="auth-card">
      <AuthHeading
        title={t("Welcome back")}
        description={t("Sign in to manage your books and borrowing requests.")}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <TextField
            autoComplete="email"
            label={t("Email address")}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <TextField
            autoComplete="current-password"
            label={t("Password")}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button
            disabled={submitting}
            size="large"
            type="submit"
            variant="contained"
          >
            {submitting ? t("Please wait…") : t("Sign in")}
          </Button>
          {googleEnabled && (
            <>
              <Typography align="center" color="text.secondary" variant="body2">
                {t("Or continue with")}
              </Typography>
              <Button
                disabled={submitting}
                onClick={continueWithGoogle}
                size="large"
                startIcon={<GoogleIcon />}
                type="button"
                variant="outlined"
              >
                {t("Continue with Google")}
              </Button>
            </>
          )}
        </Stack>
      </Box>
      <FormFooter prompt={t("New to Book Hub?")} linkLabel={t("Create an account")} href="/register" />
    </Box>
  );
}

function RegistrationForm() {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(
    registerUserAction,
    initialRegistrationState,
  );

  return (
    <Box className="auth-card">
      <AuthHeading
        title={t("Join the library")}
        description={t("Create a member account to request books from our collection.")}
      />
      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{t(state.error)}</Alert>}
      {state.registered && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t("Account created. You can now sign in with your new credentials.")}
          {" "}<MuiLink component={Link} href="/login">{t("Go to sign in")}</MuiLink>
        </Alert>
      )}
      {!state.registered && (
        <Box action={formAction} component="form">
          <Stack spacing={2}>
            <TextField
              autoComplete="name"
              label={t("Full name")}
              name="name"
              required
              slotProps={{ htmlInput: { minLength: 2, maxLength: 80 } }}
            />
            <TextField
              autoComplete="email"
              label={t("Email address")}
              name="email"
              required
              type="email"
            />
            <TextField
              autoComplete="new-password"
              label={t("Password")}
              name="password"
              required
              type="password"
              slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
            />
            <Button
              disabled={pending}
              size="large"
              type="submit"
              variant="contained"
            >
              {pending ? t("Creating account…") : t("Create member account")}
            </Button>
          </Stack>
        </Box>
      )}
      <FormFooter prompt={t("Already a member?")} linkLabel={t("Sign in")} href="/login" />
    </Box>
  );
}

function AuthHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useLocale();
  return (
    <>
      <Typography className="eyebrow">{t("WELCOME TO BOOK HUB")}</Typography>
      <Typography component="h1" variant="h4">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        {description}
      </Typography>
    </>
  );
}

function FormFooter({
  prompt,
  linkLabel,
  href,
}: {
  prompt: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <Typography align="center" sx={{ mt: 3 }} variant="body2">
      {prompt}{" "}
      <MuiLink component={Link} href={href} underline="hover">
        {linkLabel}
      </MuiLink>
    </Typography>
  );
}

function sanitizeNextPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/catalog";
}

function getPostSignInPath(
  role: "admin" | "member",
  nextPath?: string,
) {
  if (role === "admin") return "/dashboard";
  if (!nextPath) return "/my-requests";

  const safePath = sanitizeNextPath(nextPath);
  return (
    safePath === "/catalog" ||
    safePath.startsWith("/catalog/") ||
    safePath === "/my-requests" ||
    safePath.startsWith("/my-requests/") ||
    safePath === "/profile" ||
    safePath.startsWith("/profile/")
  )
    ? safePath
    : "/my-requests";
}
