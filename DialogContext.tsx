import React, { createContext, useContext, useState, useCallback } from "react";
import { ModernDialog } from "./components/ui";

interface DialogOptions {
  title?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogState {
  isOpen: boolean;
  type: "alert" | "confirm" | "prompt";
  title: string;
  message: string;
  defaultValue: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (value: any) => void;
}

interface DialogContextType {
  alert: (message: string, options?: DialogOptions) => Promise<void>;
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>;
  prompt: (message: string, options?: DialogOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<DialogState | null>(null);

  const showAlert = useCallback((message: string, options?: DialogOptions) => {
    return new Promise<void>((resolve) => {
      setState({
        isOpen: true,
        type: "alert",
        title: options?.title || "Notification",
        message,
        defaultValue: "",
        confirmLabel: options?.confirmLabel || "OK",
        cancelLabel: "",
        resolve: () => {
          setState(null);
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback(
    (message: string, options?: DialogOptions) => {
      return new Promise<boolean>((resolve) => {
        setState({
          isOpen: true,
          type: "confirm",
          title: options?.title || "Confirmation",
          message,
          defaultValue: "",
          confirmLabel: options?.confirmLabel || "Confirm",
          cancelLabel: options?.cancelLabel || "Cancel",
          resolve: (confirmed: boolean) => {
            setState(null);
            resolve(confirmed);
          },
        });
      });
    },
    [],
  );

  const showPrompt = useCallback((message: string, options?: DialogOptions) => {
    return new Promise<string | null>((resolve) => {
      setState({
        isOpen: true,
        type: "prompt",
        title: options?.title || "Input Required",
        message,
        defaultValue: options?.defaultValue || "",
        confirmLabel: options?.confirmLabel || "Submit",
        cancelLabel: options?.cancelLabel || "Cancel",
        resolve: (value: string | null) => {
          setState(null);
          resolve(value);
        },
      });
    });
  }, []);

  return (
    <DialogContext.Provider
      value={{ alert: showAlert, confirm: showConfirm, prompt: showPrompt }}
    >
      {children}
      {state && (
        <ModernDialog
          isOpen={state.isOpen}
          type={state.type}
          title={state.title}
          message={state.message}
          defaultValue={state.defaultValue}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          onClose={() => state.resolve(state.type === "confirm" ? false : null)}
          onConfirm={(value) =>
            state.resolve(state.type === "prompt" ? value : true)
          }
        />
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
