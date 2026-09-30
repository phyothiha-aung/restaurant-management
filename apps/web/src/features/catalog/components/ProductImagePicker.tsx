import { ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024;

export interface ProductImageChange {
  file: File | null;
  remove: boolean;
}

interface Props {
  currentUrl?: string;
  currentName?: string;
  disabled?: boolean;
  onChange: (change: ProductImageChange) => void;
}

export function ProductImagePicker({ currentUrl, currentName, disabled, onChange }: Props) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => file ? URL.createObjectURL(file) : remove ? undefined : currentUrl, [currentUrl, file, remove]);

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => onChange({ file, remove }), [file, onChange, remove]);

  const choose = (next: File | undefined) => {
    setError(null);
    if (!next) return;
    if (!ALLOWED_TYPES.has(next.type)) return setError("Choose a JPEG, PNG, or WebP image.");
    if (next.size <= 0 || next.size > MAX_SIZE) return setError("Image must be between 1 byte and 10 MB.");
    setFile(next);
    setRemove(false);
  };

  return (
    <div className="grid gap-3">
      <div><p className="text-xs font-bold text-ink">Product image</p><p className="mt-1 text-xs text-muted">Optional JPEG, PNG, or WebP up to 10 MB.</p></div>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
        <div className="grid h-28 w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white sm:w-36">
          {preview ? <img className="h-full w-full object-cover" src={preview} alt="Product preview" /> : <ImagePlus className="text-muted" size={28} />}
        </div>
        <div className="flex-1">
          <p className="truncate text-sm font-bold text-ink">{file?.name ?? (remove ? "Image will be removed" : currentName ?? "No image selected")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-bold text-ink hover:border-brand-gold" htmlFor={inputId}>
              <ImagePlus size={15} /> {preview ? "Replace" : "Choose image"}
            </label>
            <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => { choose(event.target.files?.[0]); event.target.value = ""; }} />
            {(preview || currentUrl) && <Button size="sm" variant="ghost" disabled={disabled} onClick={() => { setFile(null); setRemove(Boolean(currentUrl)); }}><Trash2 size={14} /> Remove</Button>}
            {(file || remove) && <Button size="sm" variant="ghost" disabled={disabled} onClick={() => { setFile(null); setRemove(false); }}><RotateCcw size={14} /> Reset</Button>}
          </div>
        </div>
      </div>
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
