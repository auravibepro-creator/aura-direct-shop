import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Pencil, Plus, Store, Trash2, Upload } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { fileToCompressedDataUrl } from "@/lib/image-compress";
import { formatPKR } from "@/lib/shop";
import {
  vendorDeleteProduct,
  vendorListProducts,
  vendorLogin,
  vendorSaveProduct,
} from "@/lib/vendor.functions";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor portal — Aura Vibe" },
      {
        name: "description",
        content: "Vendor sign-in to manage products, photos, prices and stock for your category.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Vendor portal — Aura Vibe" },
      { property: "og:description", content: "Manage your assigned Aura Vibe category." },
    ],
  }),
  component: VendorPage,
});

const SESSION_KEY = "auravibe-vendor-session";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  images: string[] | null;
  video_url: string | null;
  variants: string[] | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
};

type Form = {
  id?: string;
  name: string;
  description: string;
  price: string;
  compare_at_price: string;
  images: string[];
  video_url: string;
  variants: string;
  stock: string;
  is_featured: boolean;
  is_active: boolean;
};

const emptyForm: Form = {
  name: "",
  description: "",
  price: "",
  compare_at_price: "",
  images: [],
  video_url: "",
  variants: "",
  stock: "100",
  is_featured: false,
  is_active: true,
};

function VendorPage() {
  const login = useServerFn(vendorLogin);
  const list = useServerFn(vendorListProducts);
  const save = useServerFn(vendorSaveProduct);
  const remove = useServerFn(vendorDeleteProduct);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<{ username: string; password: string } | null>(null);
  const [tabName, setTabName] = useState("");
  const [commission, setCommission] = useState(0);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async (user: string, pass: string) => {
    setBusy(true);
    try {
      const info = await login({ data: { username: user, password: pass } });
      const rows = await list({ data: { username: user, password: pass } });
      setTabName(info.tab?.name ?? "");
      setCommission(Number(info.tab?.commission_percent ?? 0));
      setProducts(rows.products as ProductRow[]);
      setSession({ username: user, password: pass });
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: user, password: pass }));
    } catch (error) {
      window.sessionStorage.removeItem(SESSION_KEY);
      toast.error(error instanceof Error ? error.message : "Invalid vendor login");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { username: string; password: string };
      setUsername(parsed.username);
      void signIn(parsed.username, parsed.password);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (action: () => Promise<unknown>, message: string) => {
    if (!session) return false;
    setBusy(true);
    try {
      await action();
      const rows = await list({ data: session });
      setProducts(rows.products as ProductRow[]);
      toast.success(message);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen">
        <ShopHeader title="Vendor portal" showBack />
        <div className="mx-3 mt-10 rounded-2xl bg-card p-6 card-shadow">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full brand-gradient text-primary-foreground">
            <Store className="size-6" />
          </span>
          <h1 className="mt-3 text-center font-display text-lg font-bold">Vendor sign in</h1>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Use the login your store admin generated for your category.
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn(username.trim(), password);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="vendor-user">Username</Label>
              <Input
                id="vendor-user"
                value={username}
                maxLength={40}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-pass">Password</Label>
              <Input
                id="vendor-pass"
                type="password"
                value={password}
                maxLength={200}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={busy || username.trim().length < 3 || password.length === 0}
              className="w-full brand-gradient text-primary-foreground"
            >
              {busy ? "Checking…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <ShopHeader title={`Vendor · ${tabName}`} showBack />

      <div className="mx-3 mt-3 rounded-xl bg-promo px-3 py-2 text-[12px] font-semibold text-promo-foreground">
        Signed in as {session.username} · {tabName} · commission {commission}%
      </div>

      <div className="flex items-center gap-2 px-3 pt-3">
        <Button
          size="sm"
          className="brand-gradient text-primary-foreground"
          onClick={() => setForm({ ...emptyForm })}
        >
          <Plus className="size-4" /> Add product
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            window.sessionStorage.removeItem(SESSION_KEY);
            setSession(null);
            setPassword("");
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>

      {form ? (
        <div className="mx-3 mt-3 space-y-3 rounded-2xl bg-card p-4 card-shadow">
          <h2 className="text-sm font-bold">{form.id ? "Edit product" : "New product"}</h2>

          <div>
            <Label className="text-xs">Photos</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {form.images.map((image, index) => (
                <button
                  key={`${image.slice(0, 24)}-${index}`}
                  type="button"
                  aria-label="Remove photo"
                  onClick={() =>
                    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
                  }
                  className="size-16 overflow-hidden rounded-lg border border-border bg-muted"
                >
                  <img src={image} alt="" className="size-full object-cover" />
                </button>
              ))}
              <label className="flex size-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-primary">
                <Upload className="size-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const compressed = await fileToCompressedDataUrl(file);
                      setForm((current) =>
                        current ? { ...current, images: [...current.images, compressed] } : current,
                      );
                    } catch {
                      toast.error("Could not process that image");
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Price (PKR)</Label>
              <Input
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Original price</Label>
              <Input
                inputMode="decimal"
                value={form.compare_at_price}
                onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Variants (comma separated)</Label>
              <Input
                value={form.variants}
                onChange={(e) => setForm({ ...form, variants: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock</Label>
              <Input
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Demo video URL</Label>
            <Input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-xs font-semibold">
              Featured
              <Switch
                checked={form.is_featured}
                onCheckedChange={(value) => setForm({ ...form, is_featured: value })}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold">
              Visible
              <Switch
                checked={form.is_active}
                onCheckedChange={(value) => setForm({ ...form, is_active: value })}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 brand-gradient text-primary-foreground"
              disabled={busy || form.name.trim().length === 0}
              onClick={async () => {
                const compare = form.compare_at_price.trim();
                const ok = await run(
                  () =>
                    save({
                      data: {
                        ...session,
                        product: {
                          ...(form.id ? { id: form.id } : {}),
                          name: form.name,
                          description: form.description,
                          price: Number(form.price) || 0,
                          compare_at_price: compare ? Number(compare) : null,
                          images: form.images,
                          video_url: form.video_url.trim() || null,
                          variants: form.variants
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                          stock: Number(form.stock) || 0,
                          is_featured: form.is_featured,
                          is_active: form.is_active,
                        },
                      },
                    }),
                  "Product saved",
                );
                if (ok) setForm(null);
              }}
            >
              Save product
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="mt-3 space-y-2 px-3">
        {products.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No products in your category yet.
          </p>
        ) : null}
        {products.map((product) => (
          <li key={product.id} className="flex gap-3 rounded-2xl bg-card p-3 card-shadow">
            <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-medium">{product.name}</p>
              <p className="text-xs font-bold text-deal">{formatPKR(Number(product.price))}</p>
              <p className="text-[10px] text-muted-foreground">
                Stock {product.stock}
                {product.is_active ? "" : " · Hidden"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                size="icon"
                variant="outline"
                aria-label="Edit product"
                onClick={() =>
                  setForm({
                    id: product.id,
                    name: product.name,
                    description: product.description ?? "",
                    price: String(product.price),
                    compare_at_price:
                      product.compare_at_price == null ? "" : String(product.compare_at_price),
                    images: product.images ?? [],
                    video_url: product.video_url ?? "",
                    variants: (product.variants ?? []).join(", "),
                    stock: String(product.stock),
                    is_featured: product.is_featured,
                    is_active: product.is_active,
                  })
                }
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Delete product"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`Delete “${product.name}”?`)) return;
                  void run(() => remove({ data: { ...session, id: product.id } }), "Product deleted");
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
