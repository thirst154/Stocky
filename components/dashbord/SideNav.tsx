"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  ChevronsUpDown,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = (slug: string) => [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: `/org/slug/${slug}/dashboard`,
    exact: true,
  },
  {
    label: "Inventory",
    icon: Package,
    href: `/org/slug/${slug}/dashboard/inventory`,
  },
  {
    label: "Locations",
    icon: MapPin,
    href: `/org/slug/${slug}/dashboard/locations`,
  },
  {
    label: "Organization",
    icon: Settings,
    href: `/org/slug/${slug}/dashboard/organization`,
  },
];

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

export default function SideNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();

  const org = useQuery(
    api.organizations.getOrgBySlug,
    slug ? { slug } : "skip",
  );
  const user = useQuery(api.users.getCurrentUser);

  const items = navItems(slug);

  function isActive(item: (typeof items)[number]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <Sidebar
      collapsible="icon"
      className="[&_[data-slot='sidebar-inner']]:[background:linear-gradient(160deg,color-mix(in_oklch,var(--sidebar)_88%,var(--primary))_0%,var(--sidebar)_50%)]"
    >
      {/* Header — org name */}
      <SidebarHeader className="pb-4 pt-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={org?.name ?? slug}>
              <Link href="/org">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary/15">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="truncate text-base font-semibold">
                    {org?.name ?? slug}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {slug}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-1">
        <SidebarGroup className="gap-1">
          <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive(item)}
                    tooltip={item.label}
                    className="h-11 rounded-lg px-3 text-base font-medium [&>svg]:size-5"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user account */}
      <SidebarFooter className="pb-4 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-11 rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={user?.name ?? user?.email ?? "Account"}
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                      {initials(user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="truncate text-sm font-semibold">
                      {user?.name ?? "Account"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                      {initials(user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold">
                      {user?.name ?? "Account"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={handleSignOut}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
