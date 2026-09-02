import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Lock, Pencil, Plus, Trash2, RefreshCw, LogOut } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorefrontTabsPanel } from "@/components/admin/StorefrontTabsPanel";
import { VendorsPanel } from "@/components/admin/VendorsPanel";
import { TickerStylePanel } from "@/components/admin/TickerStylePanel";
import { OverlayPanel } from "@/components/admin/OverlayPanel";
import { formatPKR } from "@/lib/shop";
import {
  adminDeleteAnnouncement,
  adminDeleteCategory,
  adminDeleteProduct,
  adminListAll,
  adminLogin,
  adminSaveAnnouncement,
  adminSaveCategory,
  adminSaveProduct,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Store admin — Aura Vibe" },
      { name: "description", content: "Manage Aura Vibe products, categories, prices and announcements." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Store admin — Aura Vibe" },
      { property: "og:description", content: "Private dashboard for managing the Aura Vibe store." },
    ],
  }),
  component: AdminPage,
});

const STORAGE_KEY = "auravibe-admin-pw";

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
  category_id: string | null;
};
type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  is_hot: boolean;
  sort_order: number;
};
type AnnouncementRow = { id: string; message: string; is_active: boolean; sort_order: number };

type ProductForm = {
  id?: string;
  name: string;
  description: string;
  price: string;
  compare_at_price: string;
  images: string;
  video_url: string;
  variants: string;
  stock: string;
  is_featured: boolean;
  is_active: boolean;
  category_id: string;
};

const emptyProduct: ProductForm = {
  name: "",
  description: "",
  price: "",
  compare_at_price: "",
  images: "",
  video_url: "",
  variants: "",
  stock: "100",
  is_featured: false,
  is_active: true,
  category_id: "",
};

function AdminPage() {
  const login = useServerFn(adminLogin);
  const listAll = useServerFn(adminListAll);
  const saveProduct = useServerFn(adminSaveProduct);
  const deleteProduct = useServerFn(adminDeleteProduct);
  const saveCategory = useServerFn(adminSaveCategory);
  const deleteCategory = useServerFn(adminDeleteCategory);
  const saveAnnouncement = useServerFn(adminSaveAnnouncement);
  const deleteAnnouncement = useServerFn(adminDeleteAnnouncement);

  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);

  const [productForm, setProductForm] = useState<ProductForm | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<CategoryRow> | null>(null);
  const [tickerForm, setTickerForm] = useState<Partial<AnnouncementRow> | null>(null);

  const refresh = async (pw: string) => {
    const data = await listAll({ data: { password: pw } });
    setProducts(data.products as ProductRow[]);
    setCategories(data.categories as CategoryRow[]);
    setAnnouncements(data.announcements as AnnouncementRow[]);
  };

  const signIn = async (pw: string) => {
    setBusy(true);
    try {
      await login({ data: { password: pw } });
      await refresh(pw);
      setAuthed(true);
      window.sessionStorage.setItem(STORAGE_KEY, pw);
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      toast.error("Incorrect admin password");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPassword(saved);
      void signIn(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      await refresh(password);
      toast.success(message);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen">
        <ShopHeader title="Admin dashboard" showBack />
        <div className="mx-3 mt-10 rounded-2xl bg-card p-6 card-shadow">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full brand-gradient text-primary-foreground">
            <Lock className="size-6" />
          </span>
          <h1 className="mt-3 text-center font-display text-lg font-bold">Store admin</h1>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Enter the admin password to manage products.
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn(password);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                maxLength={200}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={busy || password.length === 0}
              className="w-full brand-gradient text-primary-foreground"
            >
              {busy ? "Checking…" : "Unlock dashboard"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <ShopHeader title="Admin dashboard" showBack />

      <div className="flex items-center gap-2 px-3 pt-3">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void refresh(password)}>
          <RefreshCw className="size-4" /> Refresh
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            window.sessionStorage.removeItem(STORAGE_KEY);
            setAuthed(false);
            setPassword("");
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="products" className="mt-3 px-3">
        <TabsList className="no-scrollbar w-full overflow-x-auto">
          <TabsTrigger value="products" className="flex-1">
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-1">
            Categories
          </TabsTrigger>
          <TabsTrigger value="ticker" className="flex-1">
            Ticker
          </TabsTrigger>
          <TabsTrigger value="storefront" className="flex-1">
            Tabs
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex-1">
            Vendors
          </TabsTrigger>
        </TabsList>

        {/* MASTER ADMIN: storefront tabs + vendor logins */}
        <TabsContent value="storefront">
          <StorefrontTabsPanel password={password} />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorsPanel password={password} />
        </TabsContent>

        {/* PRODUCTS */}
        <TabsContent value="products" className="space-y-3">
          <Button
            className="w-full brand-gradient text-primary-foreground"
            onClick={() => setProductForm({ ...emptyProduct })}
          >
            <Plus className="size-4" /> Add product
          </Button>

          {productForm ? (
            <div className="space-y-3 rounded-2xl bg-card p-4 card-shadow">
              <h2 className="text-sm font-bold">{productForm.id ? "Edit product" : "New product"}</h2>
              <Field label="Name">
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (PKR)">
                  <Input
                    inputMode="decimal"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </Field>
                <Field label="Original price (optional)">
                  <Input
                    inputMode="decimal"
                    value={productForm.compare_at_price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, compare_at_price: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Image URLs (one per line)">
                <Textarea
                  rows={3}
                  value={productForm.images}
                  placeholder={"/images/cosmetics-1.jpg\nhttps://…"}
                  onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                />
              </Field>
              <Field label="Demo video URL (optional)">
                <Input
                  value={productForm.video_url}
                  placeholder="https://…/demo.mp4"
                  onChange={(e) => setProductForm({ ...productForm, video_url: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Variants (comma separated)">
                  <Input
                    value={productForm.variants}
                    placeholder="White, Green"
                    onChange={(e) => setProductForm({ ...productForm, variants: e.target.value })}
                  />
                </Field>
                <Field label="Stock">
                  <Input
                    inputMode="numeric"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Category">
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-6">
                <ToggleRow
                  label="Featured"
                  checked={productForm.is_featured}
                  onChange={(value) => setProductForm({ ...productForm, is_featured: value })}
                />
                <ToggleRow
                  label="Visible"
                  checked={productForm.is_active}
                  onChange={(value) => setProductForm({ ...productForm, is_active: value })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setProductForm(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={busy}
                  className="flex-1 brand-gradient text-primary-foreground"
                  onClick={async () => {
                    const compare = productForm.compare_at_price.trim();
                    const ok = await run(
                      () =>
                        saveProduct({
                          data: {
                            password,
                            product: {
                              ...(productForm.id ? { id: productForm.id } : {}),
                              name: productForm.name,
                              description: productForm.description,
                              price: Number(productForm.price) || 0,
                              compare_at_price: compare ? Number(compare) : null,
                              images: productForm.images
                                .split("\n")
                                .map((line) => line.trim())
                                .filter(Boolean),
                              video_url: productForm.video_url.trim() || null,
                              variants: productForm.variants
                                .split(",")
                                .map((value) => value.trim())
                                .filter(Boolean),
                              stock: Number(productForm.stock) || 0,
                              is_featured: productForm.is_featured,
                              is_active: productForm.is_active,
                              category_id: productForm.category_id || null,
                            },
                          },
                        }),
                      "Product saved",
                    );
                    if (ok) setProductForm(null);
                  }}
                >
                  Save product
                </Button>
              </div>
            </div>
          ) : null}

          <ul className="space-y-2">
            {products.map((product) => (
              <li key={product.id} className="flex gap-3 rounded-2xl bg-card p-3 card-shadow">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" loading="lazy" className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-medium">{product.name}</p>
                  <p className="text-xs font-bold text-deal">{formatPKR(Number(product.price))}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Stock {product.stock}
                    {product.is_featured ? " · Featured" : ""}
                    {product.is_active ? "" : " · Hidden"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Edit product"
                    onClick={() =>
                      setProductForm({
                        id: product.id,
                        name: product.name,
                        description: product.description ?? "",
                        price: String(product.price),
                        compare_at_price:
                          product.compare_at_price == null ? "" : String(product.compare_at_price),
                        images: (product.images ?? []).join("\n"),
                        video_url: product.video_url ?? "",
                        variants: (product.variants ?? []).join(", "),
                        stock: String(product.stock),
                        is_featured: product.is_featured,
                        is_active: product.is_active,
                        category_id: product.category_id ?? "",
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
                      void run(
                        () => deleteProduct({ data: { password, id: product.id } }),
                        "Product deleted",
                      );
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>

        {/* CATEGORIES */}
        <TabsContent value="categories" className="space-y-3">
          <Button
            className="w-full brand-gradient text-primary-foreground"
            onClick={() =>
              setCategoryForm({ name: "", slug: "", icon: "✨", is_hot: false, sort_order: 0 })
            }
          >
            <Plus className="size-4" /> Add category
          </Button>

          {categoryForm ? (
            <div className="space-y-3 rounded-2xl bg-card p-4 card-shadow">
              <Field label="Name">
                <Input
                  value={categoryForm.name ?? ""}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      name: e.target.value,
                      slug: categoryForm.id
                        ? (categoryForm.slug ?? "")
                        : e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, ""),
                    })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Slug">
                  <Input
                    value={categoryForm.slug ?? ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  />
                </Field>
                <Field label="Emoji icon">
                  <Input
                    value={categoryForm.icon ?? ""}
                    maxLength={8}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 items-end gap-3">
                <Field label="Sort order">
                  <Input
                    inputMode="numeric"
                    value={String(categoryForm.sort_order ?? 0)}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <ToggleRow
                  label="HOT badge"
                  checked={Boolean(categoryForm.is_hot)}
                  onChange={(value) => setCategoryForm({ ...categoryForm, is_hot: value })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCategoryForm(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={busy}
                  className="flex-1 brand-gradient text-primary-foreground"
                  onClick={async () => {
                    const ok = await run(
                      () =>
                        saveCategory({
                          data: {
                            password,
                            category: {
                              ...(categoryForm.id ? { id: categoryForm.id } : {}),
                              name: categoryForm.name ?? "",
                              slug: categoryForm.slug ?? "",
                              icon: categoryForm.icon || "✨",
                              is_hot: Boolean(categoryForm.is_hot),
                              sort_order: categoryForm.sort_order ?? 0,
                            },
                          },
                        }),
                      "Category saved",
                    );
                    if (ok) setCategoryForm(null);
                  }}
                >
                  Save category
                </Button>
              </div>
            </div>
          ) : null}

          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 card-shadow">
                <span className="text-2xl">{category.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {category.name}
                    {category.is_hot ? " 🔥" : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">/{category.slug}</p>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Edit category"
                  onClick={() => setCategoryForm(category)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Delete category"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Delete “${category.name}”?`)) return;
                    void run(
                      () => deleteCategory({ data: { password, id: category.id } }),
                      "Category deleted",
                    );
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        {/* TICKER */}
        <TabsContent value="ticker" className="space-y-3">
          <TickerStylePanel
            password={password}
            previewMessages={announcements.filter((a) => a.is_active).map((a) => a.message)}
          />
          <OverlayPanel password={password} />
          <Button
            className="w-full brand-gradient text-primary-foreground"
            onClick={() => setTickerForm({ message: "", is_active: true, sort_order: 0 })}
          >
            <Plus className="size-4" /> Add announcement
          </Button>

          {tickerForm ? (
            <div className="space-y-3 rounded-2xl bg-card p-4 card-shadow">
              <Field label="Message">
                <Input
                  value={tickerForm.message ?? ""}
                  maxLength={240}
                  onChange={(e) => setTickerForm({ ...tickerForm, message: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 items-end gap-3">
                <Field label="Sort order">
                  <Input
                    inputMode="numeric"
                    value={String(tickerForm.sort_order ?? 0)}
                    onChange={(e) =>
                      setTickerForm({ ...tickerForm, sort_order: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <ToggleRow
                  label="Active"
                  checked={Boolean(tickerForm.is_active)}
                  onChange={(value) => setTickerForm({ ...tickerForm, is_active: value })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setTickerForm(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={busy}
                  className="flex-1 brand-gradient text-primary-foreground"
                  onClick={async () => {
                    const ok = await run(
                      () =>
                        saveAnnouncement({
                          data: {
                            password,
                            announcement: {
                              ...(tickerForm.id ? { id: tickerForm.id } : {}),
                              message: tickerForm.message ?? "",
                              is_active: Boolean(tickerForm.is_active),
                              sort_order: tickerForm.sort_order ?? 0,
                            },
                          },
                        }),
                      "Announcement saved",
                    );
                    if (ok) setTickerForm(null);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : null}

          <ul className="space-y-2">
            {announcements.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 card-shadow">
                <p className="min-w-0 flex-1 text-xs">
                  {item.message}
                  {item.is_active ? "" : " (hidden)"}
                </p>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Edit announcement"
                  onClick={() => setTickerForm(item)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Delete announcement"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm("Delete this announcement?")) return;
                    void run(
                      () => deleteAnnouncement({ data: { password, id: item.id } }),
                      "Announcement deleted",
                    );
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
