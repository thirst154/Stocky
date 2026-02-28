"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  Crown,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrgDialog } from "@/components/org/CreateOrgDialog";

function OrgCard({
  name,
  slug,
  role,
}: {
  name: string;
  slug: string;
  role: "owner" | "member";
}) {
  return (
    <Link href={`/org/slug/${slug}/dashboard`}>
      <Card className="group cursor-pointer border-border/50 transition-colors hover:border-primary/50 hover:bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                role === "owner"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {role === "owner" ? (
                <Crown className="h-3 w-3" />
              ) : (
                <Users className="h-3 w-3" />
              )}
              {role === "owner" ? "Owner" : "Member"}
            </span>
          </div>
          <CardTitle className="mt-1 text-base">{name}</CardTitle>
          <CardDescription className="font-mono text-xs">{slug}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-end text-muted-foreground transition-colors group-hover:text-primary">
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OrgCardSkeleton() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-end">
          <Skeleton className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgPage() {
  const orgs = useQuery(api.organizations.getUserOrganizations);

  const isLoading = orgs === undefined;
  const isEmpty =
    !isLoading && orgs && orgs.owned.length === 0 && orgs.member.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">Stocky</span>
          </Link>
          <CreateOrgDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Organization
              </Button>
            }
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Your Organizations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select an organization to open its dashboard.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrgCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold">No organizations yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Create your first organization to start tracking inventory.
            </p>
            <CreateOrgDialog
              trigger={
                <Button className="mt-6 gap-1.5">
                  <Plus className="h-4 w-4" />
                  Create Organization
                </Button>
              }
            />
          </div>
        )}

        {/* Owned orgs */}
        {!isLoading && orgs && orgs.owned.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Owned
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.owned.map((org) => (
                <OrgCard
                  key={org._id}
                  name={org.name}
                  slug={org.slug}
                  role="owner"
                />
              ))}
            </div>
          </section>
        )}

        {/* Member orgs */}
        {!isLoading && orgs && orgs.member.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Member of
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.member.map((org) =>
                org ? (
                  <OrgCard
                    key={org._id}
                    name={org.name}
                    slug={org.slug}
                    role="member"
                  />
                ) : null,
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
