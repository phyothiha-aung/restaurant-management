import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function Drawer({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();

    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <dialog
      ref={dialogRef}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-xl overflow-hidden bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/45"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
          <div>
            <h2 id={titleId} className="font-heading text-xl font-bold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-5 text-muted">
                {description}
              </p>
            )}
          </div>
          <Button
            className="h-9 w-9 shrink-0 px-0"
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={18} />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">{children}</div>
        {footer && (
          <footer className="border-t border-line bg-surface px-5 py-4 sm:px-7">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
