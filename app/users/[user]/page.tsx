"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Boxes } from "lucide-react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";

export default function Page() {
  const user = useQuery(api.users.getCurrentUser);
  const params = useParams();
  if (!user) redirect("/");
  if (params.user != user._id) redirect("/");
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">Stocky</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" variant="outline" asChild>
              <Link href="/org/">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight">
            {user?.name || user?.email || user?._id}&apos;s Settings
          </h1>
        </div>
      </main>
    </div>
  );
}
