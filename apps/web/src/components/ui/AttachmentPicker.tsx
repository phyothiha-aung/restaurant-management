import { FileText, Image, Paperclip, RefreshCw, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

interface UploadedFile {
  id: string;
}

interface PickerItem {
  localId: string;
  file: File;
  progress: number;
  status: "uploading" | "ready" | "error";
  uploadedId?: string;
  error?: string;
  controller: AbortController;
}

interface AttachmentPickerProps {
  maxFiles: number;
  disabled?: boolean;
  onChange: (uploadedIds: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  upload: (
    file: File,
    onProgress: (progress: number) => void,
    signal: AbortSignal,
  ) => Promise<UploadedFile>;
}

export function AttachmentPicker({
  maxFiles,
  disabled,
  onChange,
  onUploadingChange,
  upload,
}: AttachmentPickerProps) {
  const inputId = useId();
  const controllersRef = useRef(new Set<AbortController>());
  const [items, setItems] = useState<PickerItem[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    onChange(
      items
        .filter((item) => item.status === "ready" && item.uploadedId)
        .map((item) => item.uploadedId as string),
    );
  }, [items, onChange]);

  useEffect(() => {
    onUploadingChange?.(items.some((item) => item.status === "uploading"));
  }, [items, onUploadingChange]);

  useEffect(() => () => {
    controllersRef.current.forEach((controller) => controller.abort());
  }, []);

  const runUpload = async (localId: string, file: File, controller: AbortController) => {
    try {
      const uploaded = await upload(
        file,
        (progress) =>
          setItems((current) =>
            current.map((item) => item.localId === localId ? { ...item, progress } : item),
          ),
        controller.signal,
      );
      setItems((current) =>
        current.map((item) =>
          item.localId === localId
            ? { ...item, status: "ready", progress: 100, uploadedId: uploaded.id }
            : item,
        ),
      );
      controllersRef.current.delete(controller);
    } catch (error) {
      if (controller.signal.aborted) return;
      setItems((current) =>
        current.map((item) =>
          item.localId === localId
            ? {
                ...item,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : item,
        ),
      );
      controllersRef.current.delete(controller);
    }
  };

  const addFiles = (files: File[]) => {
    setSelectionError(null);
    const available = Math.max(0, maxFiles - items.length);
    if (files.length > available) {
      setSelectionError(`You can add ${available} more attachment${available === 1 ? "" : "s"}.`);
    }
    files.slice(0, available).forEach((file) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        setSelectionError("Only JPEG, PNG, WebP, and PDF files are supported.");
        return;
      }
      if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
        setSelectionError("Each attachment must be between 1 byte and 10 MB.");
        return;
      }
      const localId = crypto.randomUUID();
      const controller = new AbortController();
      controllersRef.current.add(controller);
      setItems((current) => [
        ...current,
        { localId, file, progress: 0, status: "uploading", controller },
      ]);
      void runUpload(localId, file, controller);
    });
  };

  const removeItem = (localId: string) => {
    setItems((current) => {
      current.find((item) => item.localId === localId)?.controller.abort();
      const controller = current.find((item) => item.localId === localId)?.controller;
      if (controller) controllersRef.current.delete(controller);
      return current.filter((item) => item.localId !== localId);
    });
  };

  const retryItem = (item: PickerItem) => {
    const controller = new AbortController();
    controllersRef.current.add(controller);
    setItems((current) =>
      current.map((entry) =>
        entry.localId === item.localId
          ? { ...entry, status: "uploading", progress: 0, error: undefined, controller }
          : entry,
      ),
    );
    void runUpload(item.localId, item.file, controller);
  };

  const isFull = items.length >= maxFiles;

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-xs font-bold text-ink">Attachments</p>
        <p className="mt-1 text-xs text-muted">
          JPEG, PNG, WebP, or PDF. Up to 10 MB each and five per expense.
        </p>
      </div>
      <label
        className={`grid min-h-28 place-items-center rounded-xl border-2 border-dashed border-line bg-surface p-4 text-center transition ${
          disabled || isFull
            ? "cursor-not-allowed opacity-55"
            : "cursor-pointer hover:border-brand-gold hover:bg-brand-gold-soft"
        }`}
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled && !isFull) addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <span>
          <Upload className="mx-auto text-brand-red" size={22} />
          <span className="mt-2 block text-sm font-bold text-ink">
            Drop files here or choose files
          </span>
        </span>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          disabled={disabled || isFull}
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </label>
      {selectionError && <p className="text-xs font-semibold text-danger">{selectionError}</p>}
      {items.length > 0 && (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li className="rounded-xl border border-line bg-white p-3" key={item.localId}>
              <div className="flex items-center gap-3">
                {item.file.type === "application/pdf" ? (
                  <FileText className="shrink-0 text-brand-red" size={20} />
                ) : (
                  <Image className="shrink-0 text-brand-red" size={20} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{item.file.name}</p>
                  <p className="mt-0.5 text-[0.68rem] text-muted">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB · {item.status}
                  </p>
                </div>
                {item.status === "error" && (
                  <Button size="sm" variant="ghost" onClick={() => retryItem(item)}>
                    <RefreshCw size={14} /> Retry
                  </Button>
                )}
                <button
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-line-soft hover:text-danger"
                  type="button"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => removeItem(item.localId)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {item.status === "uploading" && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full bg-brand-gold transition-all" style={{ width: `${item.progress}%` }} />
                </div>
              )}
              {item.error && <p className="mt-2 text-xs text-danger">{item.error}</p>}
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Paperclip size={14} /> Attachments are optional.
        </p>
      )}
    </div>
  );
}
