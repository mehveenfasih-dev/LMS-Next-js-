"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Snackbar } from "@mui/material";

export type Notice = {
  message: string;
  severity: "success" | "error" | "info";
};

type Notification = Notice & { open: boolean };

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = useCallback((message: string, severity: Notice["severity"] = "success") => {
    setNotification({ open: true, message, severity });
  }, []);
  const dismiss = useCallback(() => {
    setNotification((current) => ({ ...current, open: false }));
  }, []);

  useEffect(() => {
    const handleNotification = (
      event: WindowEventMap["library:notification"],
    ) => notify(event.detail.message, event.detail.severity);

    window.addEventListener("library:notification", handleNotification);
    return () =>
      window.removeEventListener("library:notification", handleNotification);
  }, [notify]);

  const notificationAlert = useMemo(
    () => (
      <Snackbar
        autoHideDuration={4500}
        onClose={dismiss}
        open={notification.open}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={dismiss}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    ),
    [dismiss, notification],
  );
  const contextValue = useMemo(
    () => ({ notification, notify, dismiss }),
    [dismiss, notification, notify],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notificationAlert}
    </NotificationContext.Provider>
  );
}

type NotificationContextValue = {
  notification: Notification;
  notify: (message: string, severity?: Notice["severity"]) => void;
  dismiss: () => void;
};

const NotificationContext =
  createContext<NotificationContextValue | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider.",
    );
  }
  return context;
}
