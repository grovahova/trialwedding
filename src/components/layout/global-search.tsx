"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

type Result = { id: string; label: string; sublabel: string; href: string };

export function GlobalSearch() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const [tasks, guests, vendors] = await Promise.all([
        supabase.from("tasks").select("id, name, category").ilike("name", `%${query}%`).limit(5),
        supabase.from("guests").select("id, name, guest_group").ilike("name", `%${query}%`).limit(5),
        supabase.from("vendors").select("id, name, category").ilike("name", `%${query}%`).limit(5),
      ]);

      setResults([
        ...(tasks.data ?? []).map((t: any) => ({
          id: t.id,
          label: t.name,
          sublabel: `Task · ${t.category ?? "General"}`,
          href: "/tasks",
        })),
        ...(guests.data ?? []).map((g: any) => ({
          id: g.id,
          label: g.name,
          sublabel: `Guest · ${g.guest_group}`,
          href: "/guests",
        })),
        ...(vendors.data ?? []).map((v: any) => ({
          id: v.id,
          label: v.name,
          sublabel: `Vendor · ${v.category}`,
          href: "/vendors",
        })),
      ]);
      setOpen(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, supabase]);

  return (
    <div ref={boxRef} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search tasks, guests, vendors…"
        className="pl-9 pr-8"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {query && (
        <button
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => {
            setQuery("");
            setResults([]);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-md border border-border bg-card shadow-soft-lg">
          {results.map((r) => (
            <Link
              key={r.href + r.id}
              href={r.href}
              className="block px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.sublabel}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
