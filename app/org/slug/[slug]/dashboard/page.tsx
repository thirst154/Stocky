"use client";

import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const slug = params.slug as string | undefined;
  const org = useQuery(
    api.organizations.getOrgBySlug,
    slug ? { slug } : "skip",
  );

  const users = useQuery(
    api.organizations.getOrganizationUsers,
    org?._id ? { orgId: org._id } : "skip",
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header*/}
      <div className="flex flex-col gap-2">
        {/* Org Badges*/}
        <div className="flex items-center gap-2 font-mono capitalize text-sm text-muted-foreground">
          <span className="border rounded p-1">{org?.slug}</span>
          <span className="border rounded p-1 bg-primary/10 text-primary">
            users: {users?.length ?? "…"}
          </span>
          {org?.currency && (
            <span className="border rounded p-1 bg-blue-500/10 text-blue-500">
              Currency: {org?.currency}
            </span>
          )}
          {org?.timezone && (
            <span className="border rounded p-1 bg-orange-500/10 text-orange-500">
              Timezone: {org?.timezone}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
      </div>
    </div>
  );
}
