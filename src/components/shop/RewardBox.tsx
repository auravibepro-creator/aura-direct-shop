import { useEffect, useState } from "react";
import { Gift, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const SEEN_KEY = "auravibe-reward-seen";

/** Launch animation: a 3D rotating reward box that reveals a welcome coupon. */
export function RewardBox() {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    const id = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  function close() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 px-6 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-xs rounded-3xl bg-card p-5 text-center card-shadow">
        <button
          type="button"
          onClick={close}
          aria-label="Close reward"
          className="ml-auto flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="scene-3d mx-auto mt-1 flex h-32 w-32 items-center justify-center">
          <div
            className={`preserve-3d relative size-20 ${opened ? "animate-lift" : "animate-spin-box"}`}
          >
            {[
              "translateZ(40px)",
              "rotateY(180deg) translateZ(40px)",
              "rotateY(90deg) translateZ(40px)",
              "rotateY(-90deg) translateZ(40px)",
              "rotateX(90deg) translateZ(40px)",
              "rotateX(-90deg) translateZ(40px)",
            ].map((transform) => (
              <span
                key={transform}
                style={{ transform }}
                className="absolute inset-0 flex items-center justify-center rounded-lg deal-gradient text-deal-foreground opacity-95"
              >
                <Gift className="size-7" />
              </span>
            ))}
          </div>
        </div>

        {opened ? (
          <>
            <h2 className="font-display text-xl font-bold text-deal">You unlocked Rs. 300 off</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Use code <span className="font-bold text-foreground">AURA300</span> at WhatsApp
              checkout on orders over Rs. 2,500.
            </p>
            <Button className="mt-4 w-full brand-gradient text-primary-foreground" onClick={close}>
              Start shopping
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-lg font-bold">Your welcome reward</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap the box to reveal today&apos;s surprise discount.
            </p>
            <Button
              className="mt-4 w-full deal-gradient text-deal-foreground"
              onClick={() => setOpened(true)}
            >
              <Sparkles className="size-4" /> Open the box
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
