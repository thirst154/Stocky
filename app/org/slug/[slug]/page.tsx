"use client";

import { redirect, usePathname } from "next/navigation";

export default function Page() {
  const pathname = usePathname();
  // Redirect to /dashboard
  redirect(pathname + "/dashboard");
  return <div> ... Redirecting </div>;
}
