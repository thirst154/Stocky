"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { redirect, useParams } from "next/navigation";

export default function Page() {
  const user = useQuery(api.users.getCurrentUser);
  const params = useParams();
  if (!user) redirect("/");
  if (params.user != user._id) redirect("/");
  return (
    <div className="flex flex-col p-10">
      {/* Header*/}
      <div className="flex flex-col gap-2">
        {/* Org Badges*/}
        <div className="flex items-center gap-2 font-mono capitalize text-sm text-muted-foreground">
          <span className="border rounded p-1">{user?._id}</span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight">
          {user?.name || user?.email}&apos;s Settings
        </h1>
      </div>
    </div>
  );
}
