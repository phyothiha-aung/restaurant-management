import type { Addon, Product, ProductCategory } from "@restaurant-management/shared";
import { Edit3, Image as ImageIcon, Power, PowerOff, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { getApiErrorMessage } from "../../../lib/api-error";
import { uploadProductImage, type CreateProductInput } from "../catalog-api";
import {
  useAddon,
  useCreateAddon,
  useCreateProduct,
  useProduct,
  useProductImageAccess,
  useProductImageMutation,
  useUpdateAddon,
  useUpdateProduct,
} from "../catalog-services";
import type { ProductImageChange } from "./ProductImagePicker";
import { ProductForm } from "./ProductForm";
import { AddonForm } from "./AddonForm";

export type DrawerMode = "create" | "view" | "edit";

export function ProductDrawer({ open, mode, productId, canManage, categories, addons, onClose, onEdit, onDeactivate }: { open: boolean; mode: DrawerMode; productId: number | null; canManage: boolean; categories: ProductCategory[]; addons: Addon[]; onClose: () => void; onEdit: () => void; onDeactivate: (value: Product) => void }) {
  const detail = useProduct(mode === "create" || !open ? null : productId);
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);
  const [pendingImage, setPendingImage] = useState<ProductImageChange | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const product = savedProduct ?? detail.data;
  const imageUrl = useProductImageAccess(product?.id ?? null, Boolean(product?.image)).data?.url;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const imageMutation = useProductImageMutation();
  const saving = createMutation.isPending || updateMutation.isPending || imageMutation.isPending;

  const resetAndClose = () => {
    setSavedProduct(null);
    setPendingImage(null);
    setImageError(null);
    setProgress(0);
    onClose();
  };

  const saveImage = async (target: Product, change: ProductImageChange) => {
    if (!change.file && !change.remove) return true;
    try {
      if (change.file) {
        setProgress(0);
        const uploaded = await uploadProductImage(change.file, setProgress);
        await imageMutation.mutateAsync({ productId: target.id, fileId: uploaded.id });
      } else if (change.remove && target.image) await imageMutation.mutateAsync({ productId: target.id, remove: true });
      setImageError(null); setPendingImage(null); setProgress(0); return true;
    } catch (error) {
      setSavedProduct(target); setPendingImage(change);
      setImageError(getApiErrorMessage(error, "Product saved, but the image could not be updated."));
      toast.error("Product saved, but its image could not be updated.");
      return false;
    }
  };
  const submit = async ({ input, image }: { input: CreateProductInput; image: ProductImageChange }) => {
    let saved: Product;
    try {
      saved = product ? await updateMutation.mutateAsync({ id: product.id, input }) : await createMutation.mutateAsync(input);
    } catch {
      return;
    }
    setSavedProduct(saved);
    if (await saveImage(saved, image)) resetAndClose();
  };
  const retryImage = async () => {
    if (product && pendingImage && await saveImage(product, pendingImage)) resetAndClose();
  };
  const close = () => { if (!saving) resetAndClose(); };
  const title = mode === "create" && !savedProduct ? "Add product" : mode === "view" ? "Product details" : "Edit product";

  return <Drawer open={open} size="wide" title={title} description="Manage the central product, variants, reusable add-ons, and optional image." onClose={close} footer={mode === "view" && product ? <div className="flex justify-end gap-2">{canManage && (product.isActive ? <Button variant="danger" onClick={() => onDeactivate(product)}><PowerOff size={16} /> Deactivate</Button> : <Button variant="secondary" onClick={onEdit}><Power size={16} /> Edit to reactivate</Button>)}{canManage && <Button variant="outline" onClick={onEdit}><Edit3 size={16} /> Edit</Button>}</div> : undefined}>
    {imageError && <div className="mb-5 rounded-xl border border-danger/20 bg-brand-red-soft p-4"><p className="text-sm font-bold text-danger">{imageError}</p>{pendingImage && product && <Button className="mt-3" size="sm" variant="outline" isLoading={imageMutation.isPending} onClick={() => void retryImage()}><RotateCcw size={14} /> Retry image</Button>}</div>}
    {progress > 0 && progress < 100 && <div className="mb-4 h-2 overflow-hidden rounded-full bg-line-soft"><div className="h-full bg-brand-gold" style={{ width: `${progress}%` }} /></div>}
    {(mode !== "view" || savedProduct) && canManage ? <ProductForm key={product ? `${product.id}-${product.updatedAt}` : "new"} product={product} categories={categories} addons={addons} currentImageUrl={imageUrl} isLoading={saving} onCancel={close} onSubmit={(value) => void submit(value)} /> : detail.isPending ? <Skeleton /> : detail.isError ? <ErrorBox message={getApiErrorMessage(detail.error, "Could not load product.")} /> : product ? <ProductDetails product={product} imageUrl={imageUrl} /> : null}
  </Drawer>;
}

export function AddonDrawer({ open, mode, addonId, canManage, onClose, onEdit, onDeactivate }: { open: boolean; mode: DrawerMode; addonId: number | null; canManage: boolean; onClose: () => void; onEdit: () => void; onDeactivate: (value: Addon) => void }) {
  const detail = useAddon(mode === "create" || !open ? null : addonId);
  const create = useCreateAddon({ onSuccess: onClose });
  const update = useUpdateAddon({ onSuccess: onClose });
  const addon = detail.data;
  const submit = (input: Parameters<typeof create.mutate>[0]) => mode === "create" ? create.mutate(input) : addonId && update.mutate({ id: addonId, input });
  return <Drawer open={open} title={mode === "create" ? "Add reusable add-on" : mode === "edit" ? "Edit add-on" : "Add-on details"} description="One price shared by every assigned product." onClose={onClose} footer={mode === "view" && addon && canManage ? <div className="flex justify-end gap-2">{addon.isActive ? <Button variant="danger" onClick={() => onDeactivate(addon)}><PowerOff size={16} /> Deactivate</Button> : <Button variant="secondary" onClick={onEdit}><Power size={16} /> Edit to reactivate</Button>}<Button variant="outline" onClick={onEdit}><Edit3 size={16} /> Edit</Button></div> : undefined}>
    {mode === "create" ? <AddonForm isLoading={create.isPending} onCancel={onClose} onSubmit={submit} /> : detail.isPending ? <Skeleton /> : detail.isError ? <ErrorBox message={getApiErrorMessage(detail.error, "Could not load add-on.")} /> : addon && mode === "edit" ? <AddonForm addon={addon} isLoading={update.isPending} onCancel={onClose} onSubmit={submit} /> : addon ? <div className="grid gap-4"><div className="rounded-2xl bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted">Add-on</p><h3 className="mt-1 text-xl font-extrabold">{addon.name}</h3><p className="mt-2 font-bold text-brand-red">{Number(addon.unitPrice).toLocaleString()} MMK</p></div><p className="text-sm text-muted">Assigned to {addon.productCount} product{addon.productCount === 1 ? "" : "s"}.</p></div> : null}
  </Drawer>;
}

function ProductDetails({ product, imageUrl }: { product: Product; imageUrl?: string }) { return <div className="grid gap-5"><div className="grid gap-4 rounded-2xl bg-surface p-5 sm:grid-cols-[8rem_1fr]"><div className="grid h-28 place-items-center overflow-hidden rounded-xl bg-white">{imageUrl ? <img className="h-full w-full object-cover" src={imageUrl} alt={product.name} /> : <ImageIcon className="text-muted" />}</div><div><p className="text-xs font-bold uppercase tracking-wider text-muted">{product.category.name}</p><h3 className="mt-1 text-2xl font-extrabold">{product.name}</h3><p className="mt-2 text-sm text-muted">{product.description ?? "No description"}</p></div></div><section><h4 className="mb-2 font-bold">Variants</h4><div className="grid gap-2">{product.variants.map((variant) => <div className="flex justify-between rounded-xl border border-line p-3 text-sm" key={variant.id}><span>{variant.name}{variant.isActive ? "" : " (Inactive)"}</span><strong>{Number(variant.price).toLocaleString()} MMK</strong></div>)}</div></section><section><h4 className="mb-2 font-bold">Add-ons</h4><div className="grid gap-2">{product.addons.map((addon) => <div className="flex justify-between rounded-xl border border-line p-3 text-sm" key={addon.id}><span>{addon.name} · max {addon.maxQuantity}</span><strong>{Number(addon.unitPrice).toLocaleString()} MMK</strong></div>)}{product.addons.length === 0 && <p className="text-sm text-muted">No add-ons assigned.</p>}</div></section></div>; }
function Skeleton() { return <div className="animate-pulse space-y-3"><div className="h-32 rounded-2xl bg-line-soft" /><div className="h-20 rounded-xl bg-line-soft" /><div className="h-20 rounded-xl bg-line-soft" /></div>; }
function ErrorBox({ message }: { message: string }) { return <div className="rounded-xl bg-brand-red-soft p-4 text-sm font-semibold text-danger">{message}</div>; }
