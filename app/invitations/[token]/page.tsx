"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Boxes, Loader2 } from "lucide-react";

export default function InvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const data = useQuery(api.invitations.getInvitationByToken, { token });
  const acceptInvitation = useMutation(api.invitations.acceptInvitation);

  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  async function handleAccept() {
    setAcceptError(null);
    setAccepting(true);
    try {
      const result = await acceptInvitation({ token });
      if (result.alreadyMember) {
        setAlreadyMember(true);
        setTimeout(() => {
          router.replace(`/org/slug/${result.slug}/dashboard`);
        }, 1500);
      } else {
        router.replace(`/org/slug/${result.slug}/dashboard`);
      }
    } catch (err) {
      setAcceptError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setAccepting(false);
    }
  }

  // Loading state
  if (authLoading || data === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Invalid token
  if (data === null) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>This invitation link is invalid or no longer exists.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/org">Go to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  const { invitation, org, invitedBy } = data;

  // Revoked
  if (!invitation.isActive) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invitation revoked</CardTitle>
            <CardDescription>This invitation has been revoked by the organization admin.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/org">Go to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  // Expired
  if (invitation.expiresAt && Date.now() > invitation.expiresAt) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>This invitation link has expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/org">Go to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  // Max uses reached
  if (invitation.maxUses !== undefined && invitation.uses >= invitation.maxUses) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
            <CardDescription>This invitation link is no longer available.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/org">Go to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>You&apos;re invited to {org.name}</CardTitle>
            <CardDescription>
              {invitedBy.name} has invited you to join {org.name} on Stocky.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign in or create an account to accept this invitation.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/signin?redirect=/invitations/${token}`}>
                Sign in to accept
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  // Already a member state
  if (alreadyMember) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Already a member</CardTitle>
            <CardDescription>You&apos;re already a member of {org.name}. Redirecting you now…</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // Valid + logged in — acceptance card
  return (
    <PageShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join {org.name}</CardTitle>
          <CardDescription>
            {invitedBy.name} has invited you to join {org.name} on Stocky.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {acceptError && <p className="text-sm text-destructive">{acceptError}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleAccept} disabled={accepting}>
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining…
              </>
            ) : (
              `Join ${org.name}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Boxes className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">Stocky</span>
      </Link>
      {children}
    </div>
  );
}
