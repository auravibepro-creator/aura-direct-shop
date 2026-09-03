import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { BiometricLoginButton } from "@/components/auth/BiometricButtons";
import { Pencil, Upload, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { adminLogin, adminSaveProduct } from "@/lib/admin.functions";
import { fileToCompressedDataUrl } from "@/lib/image-compress";
import { discountPercent, formatPKR, type Product } from "@/lib/shop";

const PASSWORD_KEY = "auravibe-admin-pass";

type AdminModeContextValue = {
  unlocked: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  openEditor: (product: Product) => void;
  lock: () => void;
};

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error("useAdminMode must be used inside AdminModeProvider");
  return ctx;
}

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [password, setPassword] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Restore an unlocked session for this tab.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(PASSWORD_KEY);
      if (saved) {
        setPassword(saved);
        setEditMode(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Secret gesture: double-tap with 5 fingers.
  const lastFiveTap = useRef(0);
  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length < 5) return;
      const now = Date.now();
      if (now - lastFiveTap.current < 800) {
        lastFiveTap.current = 0;
        setPromptOpen(true);
      } else {
        lastFiveTap.current = now;
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      // Desktop fallback for the same secret entry point.
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setPromptOpen(true);
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Voice trigger: saying "login please" opens the same prompt.
  useEffect(() => {
    const Recognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!Recognition) return;

    let stopped = false;
    const recognition = new (Recognition as new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      onresult: ((event: unknown) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    })();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: unknown) => {
      const results = (event as { results: ArrayLike<ArrayLike<{ transcript: string }>> }).results;
      for (let i = 0; i < results.length; i += 1) {
        const text = results[i]?.[0]?.transcript?.toLowerCase() ?? "";
        if (text.includes("login please") || text.includes("log in please")) {
          setPromptOpen((open) => open || true);
        }
      }
    };
    // Chrome ends the session periodically. Restart on a timer with a hard cap so a
    // permanently failing microphone can never spin into a tight restart loop.
    let restarts = 0;
    let restartTimer: number | undefined;
    recognition.onend = () => {
      if (stopped || restarts >= 20) return;
      restarts += 1;
      restartTimer = window.setTimeout(() => {
        try {
          recognition.start();
        } catch {
          /* ignore */
        }
      }, 1500);
    };
    recognition.onerror = () => {
      /* microphone unavailable or permission denied — ignore silently */
    };

    try {
      recognition.start();
    } catch {
      /* ignore */
    }

    return () => {
      stopped = true;
      if (restartTimer) window.clearTimeout(restartTimer);
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const lock = useCallback(() => {
    setPassword(null);
    setEditMode(false);
    try {
      window.sessionStorage.removeItem(PASSWORD_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AdminModeContextValue>(
    () => ({
      unlocked: Boolean(password),
      editMode: Boolean(password) && editMode,
      setEditMode,
      openEditor: (product) => setEditing(product),
      lock,
    }),
    [password, editMode, lock],
  );

  return (
    <AdminModeContext.Provider value={value}>
      {children}

      <PasswordPrompt
        open={promptOpen}
        onOpenChange={setPromptOpen}
        onUnlocked={(value) => {
          setPassword(value);
          setEditMode(true);
          try {
            window.sessionStorage.setItem(PASSWORD_KEY, value);
          } catch {
            /* ignore */
          }
        }}
      />

      {password && editMode ? <EditModeBar /> : null}

      {password && editing ? (
        <ProductQuickEditor
          product={editing}
          password={password}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </AdminModeContext.Provider>
  );
}

function PasswordPrompt({
  open,
  onOpenChange,
  onUnlocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: (password: string) => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await adminLogin({ data: { password: value } });
      onUnlocked(value);
      setValue("");
      onOpenChange(false);
      toast.success("Admin Edit Mode enabled");
    } catch {
      toast.error("Incorrect password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-2xl">
        <DialogHeader>
          <DialogTitle>Secret admin access</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="password"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Admin password"
          />
          <Button type="submit" disabled={busy || !value} className="w-full">
            {busy ? "Checking…" : "Unlock edit mode"}
          </Button>
        </form>
        <BiometricLoginButton
          scope="admin"
          label="Unlock with fingerprint"
          disabled={busy}
          onSuccess={(result) => {
            onUnlocked(result.password);
            onOpenChange(false);
            toast.success("Admin Edit Mode enabled");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditModeBar() {
  const { editMode, setEditMode, lock } = useAdminMode();

  return (
    <div className="fixed top-0 left-0 z-50 flex w-full items-center gap-2 bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
      <Pencil className="size-3.5" />
      Admin Edit Mode
      <div className="ml-auto flex items-center gap-2">
        <Switch checked={editMode} onCheckedChange={setEditMode} aria-label="Toggle edit mode" />
        <button type="button" onClick={lock} aria-label="Exit admin mode">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ProductQuickEditor({
  product,
  password,
  onClose,
}: {
  product: Product;
  password: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [images, setImages] = useState<string[]>(product.images);
  const [price, setPrice] = useState(String(product.price));
  const [compare, setCompare] = useState(
    product.compare_at_price == null ? "" : String(product.compare_at_price),
  );
  const [featured, setFeatured] = useState(product.is_featured);
  const [busy, setBusy] = useState(false);

  const priceNumber = Number(price) || 0;
  const compareNumber = compare.trim() === "" ? null : Number(compare) || 0;
  const off = discountPercent({ price: priceNumber, compare_at_price: compareNumber });

  async function pickImage(file: File | undefined) {
    if (!file) return;
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setImages((prev) => [compressed, ...prev.slice(1)]);
    } catch {
      toast.error("Could not process that image");
    }
  }

  function applyDiscount(percent: number) {
    const base = compareNumber ?? priceNumber;
    setCompare(String(Math.round(base)));
    setPrice(String(Math.round((base * (100 - percent)) / 100)));
    setFeatured(true);
  }

  async function save() {
    setBusy(true);
    try {
      await adminSaveProduct({
        data: {
          password,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: priceNumber,
            compare_at_price: compareNumber,
            images,
            video_url: product.video_url,
            variants: product.variants,
            stock: product.stock,
            is_featured: featured,
            is_active: product.is_active,
            category_id: product.category_id,
          },
        },
      });
      await queryClient.invalidateQueries();
      toast.success("Product updated");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[88vh] max-w-sm overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="line-clamp-1 text-left text-sm">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Product image</Label>
            <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-2">
              <span className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {images[0] ? (
                  <img src={images[0]} alt="" className="size-full object-cover" />
                ) : null}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Upload className="size-4" />
                Choose from device
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => pickImage(event.target.files?.[0])}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Price (PKR)</Label>
              <Input
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs">Original price</Label>
              <Input
                inputMode="decimal"
                value={compare}
                onChange={(event) => setCompare(event.target.value)}
                placeholder="Optional"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Quick discount</Label>
            <div className="mt-1.5 flex gap-2">
              {[10, 20, 30, 50].map((percent) => (
                <Button
                  key={percent}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => applyDiscount(percent)}
                >
                  -{percent}%
                </Button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Now {formatPKR(priceNumber)}
              {off ? ` · ${off}% off` : ""}
            </p>
          </div>

          <label className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
            <span className="text-xs font-semibold">Show in Flash deals</span>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </label>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
