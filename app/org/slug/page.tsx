"use client";

import { redirect, usePathname } from "next/navigation";

export default function Page() {
  const pathname = usePathname();
  // Redirect to /dashboard
  redirect("/org");
  return <div> ... Redirecting </div>;
}
