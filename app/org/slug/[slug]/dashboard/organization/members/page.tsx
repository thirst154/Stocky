"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function MembersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const org = useQuery(
    api.organizations.getOrgBySlug,
    slug ? { slug } : "skip",
  );
  const user = useQuery(api.users.getCurrentUser);
  const members = useQuery(
    api.organizations.getOrganizationUsers,
    org?._id ? { orgId: org._id } : "skip",
  );
  const invitations = useQuery(
    api.invitations.getOrgInvitations,
    org?._id ? { orgId: org._id } : "skip",
  );
  const createInvitation = useMutation(api.invitations.createInvitation);
  const revokeInvitation = useMutation(api.invitations.revokeInvitation);

  const isLoading =
    org === undefined || user === undefined || members === undefined;
  const isOwner = !!(org && user && org.ownerID === user._id);

  const [inviteLabel, setInviteLabel] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleGenerateInvite() {
    if (!org) return;
    setInviteError(null);
    setGeneratingInvite(true);
    setNewInviteUrl(null);
    try {
      const result = await createInvitation({
        orgId: org._id,
        label: inviteLabel || undefined,
      });
      setNewInviteUrl(`${window.location.origin}/invitations/${result.token}`);
      setInviteLabel("");
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to generate invite link.",
      );
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleRevoke(invitationId: Id<"invitations">) {
    try {
      await revokeInvitation({ invitationId });
    } catch {
      // silently fail; user will see status update
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Invitations section (owner only) */}
      {isOwner && !isLoading && (
        <>
          <div className="flex flex-col gap-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Invitations
            </p>

            {/* Generate invite row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="invite-label">Label (optional)</Label>
                <Input
                  id="invite-label"
                  placeholder="e.g. Warehouse team"
                  value={inviteLabel}
                  onChange={(e) => setInviteLabel(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleGenerateInvite}
                disabled={generatingInvite}
              >
                {generatingInvite ? "Generating…" : "Generate link"}
              </Button>
            </div>

            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}

            {newInviteUrl && (
              <div className="flex items-center gap-2 rounded border bg-muted/40 px-3 py-2 text-sm font-mono">
                <span className="truncate flex-1">{newInviteUrl}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(newInviteUrl, "new")}
                >
                  {copiedId === "new" ? "Copied!" : "Copy"}
                </Button>
              </div>
            )}

            {/* Existing invitations list */}
            {invitations && invitations.length > 0 && (
              <div className="flex flex-col gap-2">
                {invitations.map((inv) => {
                  const url = `${window.location.origin}/invitations/${inv.token}`;
                  const usageLabel = `${inv.uses}${inv.maxUses ? `/${inv.maxUses}` : ""}`;
                  return (
                    <div
                      key={inv._id}
                      className="flex flex-wrap items-center gap-2 rounded border px-3 py-2 text-sm"
                    >
                      <span className="flex-1 truncate text-muted-foreground">
                        {inv.label || "Invite link"}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {usageLabel} uses
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-mono ${
                          inv.isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {inv.isActive ? "Active" : "Revoked"}
                      </span>
                      {inv.expiresAt && (
                        <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-xs font-mono text-orange-500">
                          expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(url, inv._id)}
                      >
                        {copiedId === inv._id ? "Copied!" : "Copy URL"}
                      </Button>
                      {inv.isActive && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRevoke(inv._id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Members list */}
      <div className="flex flex-col gap-3">
        <Separator />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Members
        </p>

        {isLoading ? (
          <div className="flex flex-col divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="flex flex-col divide-y">
            {members.map((m) => (
              <div
                key={m.membershipId ?? m.user._id}
                className="flex items-center gap-3 py-3"
              >
                <Avatar className="size-8 rounded-lg shrink-0">
                  <AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                    {initials(
                      (m.user as { name?: string | null }).name,
                      (m.user as { email?: string | null }).email,
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {(m.user as { name?: string | null }).name ??
                      (m.user as { email?: string | null }).email}
                  </span>
                  {(m.user as { name?: string | null }).name && (
                    <span className="text-xs text-muted-foreground truncate">
                      {(m.user as { email?: string | null }).email}
                    </span>
                  )}
                </div>
                {m.isOwner && (
                  <span className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs bg-primary/10 text-primary">
                    owner
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No members yet.
          </p>
        )}
      </div>
    </div>
  );
}
