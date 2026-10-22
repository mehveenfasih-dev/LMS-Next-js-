import axios, { type AxiosError } from "axios";

declare global {
  interface WindowEventMap {
    "library:loading": CustomEvent<1 | -1>;
    "library:notification": CustomEvent<{
      message: string;
      severity: "success" | "error" | "info";
    }>;
  }
}

function updateLoading(isStarting: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("library:loading", {
        detail: isStarting ? 1 : -1,
      }),
    );
  }
}

function getErrorMessage(
  error: AxiosError<{ message?: string; error?: string }>,
) {
  return (
    error.response?.data?.message ??
    error.response?.data?.error ??
    error.message ??
    "The request could not be completed."
  );
}

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    updateLoading(true);
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    updateLoading(false);
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    updateLoading(false);
    const message = getErrorMessage(error);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("library:notification", {
          detail: { message, severity: "error" },
        }),
      );
    }
    return Promise.reject(new Error(message, { cause: error }));
  },
);
