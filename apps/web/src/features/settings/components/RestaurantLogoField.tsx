import type { RestaurantSettings } from "@restaurant-management/shared";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import {
  useRemoveRestaurantLogo,
  useReplaceRestaurantLogo,
} from "../settings-services";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 10 * 1024 * 1024;

export function RestaurantLogoField({
  settings,
  canEdit,
}: {
  settings: RestaurantSettings;
  canEdit: boolean;
}) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const replaceLogo = useReplaceRestaurantLogo();
  const removeLogo = useRemoveRestaurantLogo();
  const preview = useMemo(
    () => file ? URL.createObjectURL(file) : settings.logoUrl ?? "/icon.jpg",
    [file, settings.logoUrl],
  );

  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const choose = (next?: File) => {
    setError(null);
    if (!next) return;
    if (!allowedTypes.has(next.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (next.size <= 0 || next.size > maxSize) {
      setError("Logo must be between 1 byte and 10 MB.");
      return;
    }
    setFile(next);
    setProgress(0);
  };

  const save = () => {
    if (!file) return;
    replaceLogo.mutate(
      { file, onProgress: setProgress },
      { onSuccess: () => { setFile(null); setProgress(0); } },
    );
  };

  const busy = replaceLogo.isPending || removeLogo.isPending;

  return (
    <div className="grid gap-4 border-b border-line pb-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-ink">Restaurant logo</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          JPEG, PNG, or WebP up to 10 MB. The bundled logo is used when none is uploaded.
        </p>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
        <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-brand-gold bg-white">
          <img className="h-full w-full object-cover" src={preview} alt="Restaurant logo preview" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">
            {file?.name ?? settings.logo?.originalName ?? "Default bundled logo"}
          </p>
          {replaceLogo.isPending && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-soft">
              <div className="h-full bg-brand-red transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {canEdit && (
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-bold text-ink hover:border-brand-gold" htmlFor={inputId}>
                <ImagePlus size={15} /> {settings.logo || file ? "Replace" : "Choose logo"}
              </label>
              <input
                id={inputId}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(event) => {
                  choose(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              {file && (
                <Button size="sm" isLoading={replaceLogo.isPending} loadingLabel="Uploading..." onClick={save}>
                  <Upload size={14} /> Save logo
                </Button>
              )}
              {file && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setFile(null)}>Cancel</Button>}
              {settings.logo && !file && (
                <Button size="sm" variant="ghost" isLoading={removeLogo.isPending} loadingLabel="Removing..." onClick={() => removeLogo.mutate()}>
                  <Trash2 size={14} /> Use default
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
