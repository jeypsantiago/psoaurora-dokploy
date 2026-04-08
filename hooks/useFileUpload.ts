import { useCallback, useMemo, useState } from "react";
import {
  type CompleteUploadResponse,
  invalidatePreparedUpload,
  prepareUpload,
  type UploadPreparationContext,
  type UploadTarget,
  uploadFile,
  type MediaUploadProgress,
} from "../services/mediaAssets";

type UploadTone = "neutral" | "success" | "error";

export type FileUploadState = {
  status: MediaUploadProgress["phase"] | "idle";
  progressPercent: number;
  message: string;
  isUploading: boolean;
  tone: UploadTone;
  error: string;
  lastResult: CompleteUploadResponse | null;
  isPrepared: boolean;
  isPreparing: boolean;
};

const phaseMessage = (progress: MediaUploadProgress) => {
  if (progress.message) return progress.message;
  if (progress.phase === "uploading") {
    return `Uploading ${progress.progressPercent ?? 0}%`;
  }
  if (progress.phase === "committing") return "Finishing upload...";
  if (progress.phase === "done") return "Upload complete.";
  if (progress.phase === "error") return "Upload failed.";
  return "Preparing upload...";
};

export const usePreparedUpload = (
  target: UploadTarget,
  context: UploadPreparationContext,
) => {
  const ownerUserId = context.ownerUserId || "";
  const slotId = context.slotId || "";
  const label = context.label || "";
  const stableContext = useMemo<UploadPreparationContext>(
    () => ({
      ownerUserId: ownerUserId || undefined,
      slotId: slotId || undefined,
      label: label || undefined,
    }),
    [label, ownerUserId, slotId],
  );
  const [isPrepared, setIsPrepared] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");

  const prepare = useCallback(async () => {
    setIsPreparing(true);
    setError("");
    try {
      const session = await prepareUpload(target, stableContext);
      setIsPrepared(!!session);
      return session;
    } catch (prepareError) {
      const message =
        prepareError instanceof Error
          ? prepareError.message
          : "Unable to prepare upload.";
      setError(message);
      setIsPrepared(false);
      throw prepareError;
    } finally {
      setIsPreparing(false);
    }
  }, [stableContext, target]);

  const invalidate = useCallback(() => {
    invalidatePreparedUpload(target, stableContext);
    setIsPrepared(false);
  }, [stableContext, target]);

  return useMemo(
    () => ({
      prepare,
      invalidate,
      isPrepared,
      isPreparing,
      error,
    }),
    [error, invalidate, isPrepared, isPreparing, prepare],
  );
};

export const useFileUpload = (
  target: UploadTarget,
  context: UploadPreparationContext,
) => {
  const ownerUserId = context.ownerUserId || "";
  const slotId = context.slotId || "";
  const label = context.label || "";
  const stableContext = useMemo<UploadPreparationContext>(
    () => ({
      ownerUserId: ownerUserId || undefined,
      slotId: slotId || undefined,
      label: label || undefined,
    }),
    [label, ownerUserId, slotId],
  );
  const prepared = usePreparedUpload(target, context);
  const [status, setStatus] = useState<FileUploadState>({
    status: "idle",
    progressPercent: 0,
    message: "",
    isUploading: false,
    tone: "neutral",
    error: "",
    lastResult: null,
    isPrepared: false,
    isPreparing: false,
  });

  const prepare = useCallback(async () => {
    const session = await prepared.prepare();
    setStatus((prev) => ({
      ...prev,
      isPrepared: !!session,
      isPreparing: false,
      error: "",
    }));
    return session;
  }, [prepared]);

  const start = useCallback(
    async (file: File) => {
      setStatus((prev) => ({
        ...prev,
        status: "preparing",
        progressPercent: 0,
        message: "Preparing upload...",
        isUploading: true,
        tone: "neutral",
        error: "",
      }));

      try {
        const result = await uploadFile(target, file, stableContext, {
          onProgress: (progress) => {
            setStatus((prev) => ({
              ...prev,
              status: progress.phase,
              progressPercent: progress.progressPercent ?? prev.progressPercent,
              message: phaseMessage(progress),
              isUploading:
                progress.phase !== "done" && progress.phase !== "error",
              tone: progress.phase === "error" ? "error" : "neutral",
              error:
                progress.phase === "error"
                  ? progress.message || "Upload failed."
                  : "",
            }));
          },
        });

        setStatus({
          status: "done",
          progressPercent: 100,
          message: "Upload complete.",
          isUploading: false,
          tone: "success",
          error: "",
          lastResult: result,
          isPrepared: false,
          isPreparing: false,
        });

        prepared.invalidate();
        return result;
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : "Upload failed.";
        setStatus((prev) => ({
          ...prev,
          status: "error",
          progressPercent: 0,
          message,
          isUploading: false,
          tone: "error",
          error: message,
        }));
        throw uploadError;
      }
    },
    [prepared, stableContext, target],
  );

  const clearStatus = useCallback(() => {
    setStatus({
      status: "idle",
      progressPercent: 0,
      message: "",
      isUploading: false,
      tone: "neutral",
      error: "",
      lastResult: null,
      isPrepared: false,
      isPreparing: false,
    });
  }, []);

  return useMemo(
    () => ({
      ...status,
      prepare,
      start,
      clearStatus,
      invalidate: prepared.invalidate,
      isPrepared: prepared.isPrepared || status.isPrepared,
      isPreparing: prepared.isPreparing,
      preparationError: prepared.error,
    }),
    [
      prepare,
      prepared.error,
      prepared.invalidate,
      prepared.isPrepared,
      prepared.isPreparing,
      start,
      status,
      clearStatus,
    ],
  );
};
