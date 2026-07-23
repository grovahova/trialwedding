"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import type { ShoppingItem } from "@/lib/types";

export function ReceiptUploadButton({ item }: { item: ShoppingItem }) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const path = `${item.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("shopping_items").update({ receipt_url: path }).eq("id", item.id);
      if (error) throw error;
      toast.success("Photo uploaded");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function viewReceipt(e: React.MouseEvent) {
    e.stopPropagation();
    if (!item.receipt_url) return;
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(item.receipt_url, 60);
    if (error || !data) return toast.error("Could not open photo");
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {item.receipt_url ? (
        <button
          type="button"
          onClick={viewReceipt}
          title="View receipt photo"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Snap a photo of the receipt"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}
