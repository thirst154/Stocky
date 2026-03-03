"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import { Boxes, Building2, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export default function UserSettingsPage() {
  const params = useParams();
  const user = useQuery(api.users.getCurrentUser);
  const orgs = useQuery(api.organizations.getUserOrganizations);
  const updateUser = useMutation(api.users.updateCurrentUser);
  const { signIn } = useAuthActions();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  // Guard: only the current user can view their own settings
  if (user === null) redirect("/");
  if (user && params.user !== user._id) redirect("/");

  const isLoading = user === undefined;

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaving(true);
    try {
      await updateUser({ name, phone });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setResetError(null);
    setResetSending(true);
    try {
      await signIn("password", { email: user.email, flow: "reset" });
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setResetSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">Stocky</span>
          </Link>
          <Button size="sm" variant="outline" asChild>
            <Link href="/org">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-10">
        {/* Page title + avatar */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <>
              <Skeleton className="size-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="size-14">
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
                  {initials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {user?.name || user?.email || "Account"}
                </h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* ── Profile ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionLabel>Profile</SectionLabel>
          <form
            id="profile-form"
            onSubmit={handleProfileSave}
            className="grid gap-4 sm:grid-cols-2"
          >
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="user-name">Display Name</Label>
                  <Input
                    id="user-name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-phone">Phone</Label>
                  <Input
                    id="user-phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}
          </form>
          {!isLoading && (
            <div className="flex items-center justify-between">
              {profileError ? (
                <p className="text-sm text-destructive">{profileError}</p>
              ) : profileSaved ? (
                <p className="text-sm font-mono text-primary">Changes saved.</p>
              ) : (
                <span />
              )}
              <Button
                form="profile-form"
                type="submit"
                size="sm"
                disabled={profileSaving}
              >
                {profileSaving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}
        </section>

        <Separator />

        {/* ── Account ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionLabel>Account</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))
            ) : (
              <>
                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Email
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{user?.email ?? "—"}</span>
                    {user?.emailVerificationTime ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-xs font-normal text-green-600 dark:text-green-400"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : user?.email ? (
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        Unverified
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {/* Member since */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Member Since
                  </Label>
                  <p className="text-sm">
                    {user?._creationTime
                      ? new Date(user._creationTime).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        <Separator />

        {/* ── Security ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionLabel>Security</SectionLabel>
          <div className="rounded-lg border p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Send a password reset link to <strong>{user?.email}</strong>.
                </p>
                {resetSent && (
                  <p className="mt-1 text-sm font-mono text-primary">
                    Reset email sent — check your inbox.
                  </p>
                )}
                {resetError && (
                  <p className="mt-1 text-sm text-destructive">{resetError}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={resetSending || resetSent || !user?.email || isLoading}
              onClick={handlePasswordReset}
            >
              {resetSending ? "Sending…" : resetSent ? "Email sent" : "Reset password"}
            </Button>
          </div>
        </section>

        <Separator />

        {/* ── Organizations ────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionLabel>Organizations</SectionLabel>

          {orgs === undefined || orgs === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Owned */}
              {orgs.owned.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground font-medium">Owner</p>
                  {orgs.owned.map((org) => (
                    <Link
                      key={org._id}
                      href={`/org/slug/${org.slug}/dashboard`}
                      className="group rounded-lg border px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{org.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{org.slug}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">Owner</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Member */}
              {orgs.member.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground font-medium">Member</p>
                  {orgs.member.filter(Boolean).map((org) => org && (
                    <Link
                      key={org._id}
                      href={`/org/slug/${org.slug}/dashboard`}
                      className="group rounded-lg border px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{org.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{org.slug}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">Member</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              )}

              {orgs.owned.length === 0 && orgs.member.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  You are not a member of any organizations yet.
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
