"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { redirect } from "next/navigation";

export default function Page() {
  const user = useQuery(api.users.getCurrentUser);
  if (user === undefined) {
    return null; // or a loading spinner
  }

  // 2️⃣ Loaded, but no user
  if (user === null) {
    redirect("/signin");
  }

  // 3️⃣ Loaded and user exists
  redirect("/users/" + user._id);
}
