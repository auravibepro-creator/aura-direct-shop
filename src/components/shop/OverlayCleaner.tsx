import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { DEFAULT_OVERLAY_SETTINGS, fetchOverlaySettings } from "@/lib/shop";

const BADGE_SELECTORS = [
  "#lovable-badge",
  "[id*='lovable-badge']",
  "[class*='lovable-badge']",
  "a[href*='lovable.dev']",
  "a[href*='lovable.app/?utm']",
];

const BANNER_SELECTORS = [
  "[id*='appsgeyser' i]",
  "[class*='appsgeyser' i]",
  "iframe[src*='appsgeyser' i]",
  "iframe[src*='googlesyndication']",
  "iframe[src*='doubleclick']",
  "ins.adsbygoogle",
  "[id*='banner_ad' i]",
  "[class*='ad-banner' i]",
  "body > iframe",
  "body > ins",
  "body > [id*='banner' i]",
  "body > [class*='banner' i]",
];

/**
 * Removes any fixed/sticky bottom-anchored node injected directly into <body>
 * outside the app layout wrapper — covers wrappers with randomised ids/classes
 * that no static selector can match.
 */
function sweepStrayFixedNodes() {
  const viewportBottom = window.innerHeight;
  Array.from(document.body.children).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.hasAttribute("data-app-root")) return;
    if (/^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE)$/.test(node.tagName)) return;
    const style = window.getComputedStyle(node);
    if (style.position !== "fixed" && style.position !== "sticky") return;
    const rect = node.getBoundingClientRect();
    if (rect.height === 0) return;
    const anchoredBottom = rect.bottom >= viewportBottom - 4;
    if (anchoredBottom || node.tagName === "IFRAME") node.remove();
  });
}

function hide(selectors: string[]) {
  for (const selector of selectors) {
    let nodes: NodeListOf<Element>;
    try {
      nodes = document.querySelectorAll(selector);
    } catch {
      continue;
    }
    nodes.forEach((node) => {
      const el = node as HTMLElement;
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("pointer-events", "none", "important");
      el.setAttribute("aria-hidden", "true");
      el.remove();
    });
  }
}

/**
 * Admin-controlled cleanup of third-party floating overlays (AppsGeyser bottom
 * banner, "Edit with Lovable" badge). Purely presentational: it hides/removes
 * injected DOM nodes and keeps watching for late injections.
 */
export function OverlayCleaner() {
  const { data } = useQuery({
    queryKey: ["overlay-settings"],
    queryFn: fetchOverlaySettings,
    staleTime: 60_000,
  });
  const settings = data ?? DEFAULT_OVERLAY_SETTINGS;

  useEffect(() => {
    const selectors = [
      ...(settings.hide_lovable_badge ? BADGE_SELECTORS : []),
      ...(settings.hide_appsgeyser_banner ? BANNER_SELECTORS : []),
    ];
    if (selectors.length === 0) return;

    let frame = 0;
    const sweep = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => hide(selectors));
    };

    sweep();
    const observer = new MutationObserver(sweep);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(sweep, 2000);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.cancelAnimationFrame(frame);
    };
  }, [settings.hide_lovable_badge, settings.hide_appsgeyser_banner]);

  return null;
}
