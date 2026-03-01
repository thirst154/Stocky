"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string;
  const pathname = usePathname();

  const org = useQuery(
    api.organizations.getOrgBySlug,
    slug ? { slug } : "skip",
  );
  const user = useQuery(api.users.getCurrentUser);

  const isLoading = org === undefined || user === undefined;
  const isOwner = !!(org && user && org.ownerID === user._id);

  const base = `/org/slug/${slug}/dashboard/organization`;
  const tabs = [
    { label: "General", href: base, exact: true },
    { label: "Members", href: `${base}/members` },
    { label: "Roles", href: `${base}/roles` },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground capitalize">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-6 w-28 rounded" />
            </>
          ) : (
            <>
              <span className="border rounded p-1">{org?.slug}</span>
              {org?.currency && (
                <span className="border rounded p-1 bg-blue-500/10 text-blue-500">
                  {org.currency}
                </span>
              )}
              {org?.timezone && (
                <span className="border rounded p-1 bg-orange-500/10 text-orange-500">
                  {org.timezone}
                </span>
              )}
              {isOwner && (
                <span className="border rounded p-1 bg-primary/10 text-primary">
                  owner
                </span>
              )}
            </>
          )}
        </div>
        <h1 className="text-3xl font-medium tracking-tight">Organization</h1>
      </div>

      {/* Tab nav */}
      <div className="flex gap-0 border-b">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
