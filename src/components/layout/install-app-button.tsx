"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true); // default true so nothing flashes before we know
  const [isIOS, setIsIOS] = useState(false);
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    setDismissed(localStorage.getItem("hideInstallPrompt") === "true");

    function handler(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!installEvent && !isIOS) return null; // nothing we can offer on this browser

  async function handleClick() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstallEvent(null);
    } else if (isIOS) {
      setIosInstructionsOpen(true);
    }
  }

  function dismiss() {
    localStorage.setItem("hideInstallPrompt", "true");
    setDismissed(true);
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleClick} className="h-8">
          <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add to Home Screen</span>
        </Button>
        <button
          onClick={dismiss}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Dismiss"
          title="Don't show this again"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <Dialog open={iosInstructionsOpen} onOpenChange={setIosInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
            <DialogDescription>iOS doesn't let apps trigger this automatically — three quick taps:</DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">1</span>
              Tap the <Share className="mx-1 inline h-4 w-4" /> Share button in Safari's toolbar
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">2</span>
              Scroll down and tap <strong>"Add to Home Screen"</strong>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">3</span>
              Tap <strong>Add</strong> — the app icon appears on your home screen
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
