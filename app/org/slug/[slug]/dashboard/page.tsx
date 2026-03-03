"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  MapPin,
  Package,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description: string;
  icon: React.ElementType;
  accent?: "default" | "warning" | "success" | "muted";
  href?: string;
}

function StatCard({ label, value, description, icon: Icon, accent = "default", href }: StatCardProps) {
  const iconClass = cn("h-5 w-5 shrink-0", {
    "text-primary": accent === "default",
    "text-amber-500": accent === "warning",
    "text-emerald-500": accent === "success",
    "text-muted-foreground": accent === "muted",
  });

  const inner = (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <Icon className={iconClass} />
      </div>
      <p className={cn("text-3xl font-semibold tracking-tight", {
        "text-amber-500": accent === "warning",
        "text-emerald-500": accent === "success",
      })}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block hover:shadow-sm transition-shadow">
        {inner}
      </Link>
    );
  }
  return inner;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string | undefined;

  const org = useQuery(api.organizations.getOrgBySlug, slug ? { slug } : "skip");
  const stats = useQuery(
    api.dashboard.getDashboardStats,
    org?._id ? { orgId: org._id } : "skip",
  );

  const isLoading = org === undefined || stats == null;
  const currency = stats?.currency ?? org?.currency ?? "USD";
  const locationsHref = `/org/slug/${slug}/dashboard/locations`;
  const inventoryHref = `/org/slug/${slug}/dashboard/inventory`;

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <span className="border rounded px-1.5 py-0.5">{org?.slug ?? slug}</span>
          {org?.currency && (
            <span className="border rounded px-1.5 py-0.5 bg-blue-500/10 text-blue-500">
              {org.currency}
            </span>
          )}
          {org?.timezone && (
            <span className="border rounded px-1.5 py-0.5 bg-orange-500/10 text-orange-500">
              {org.timezone}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          A live overview of your inventory, locations, and team.
        </p>
      </div>

      {/* ── Stat grid ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Active SKUs"
              value={formatNumber(stats.totalActiveItems)}
              description="Distinct active products in your catalog. Inactive items are excluded."
              icon={Package}
              href={inventoryHref}
            />
            <StatCard
              label="Inventory Cost Value"
              value={formatCurrency(stats.totalCostValue, currency)}
              description="Total value of all stocked units at cost price across every location."
              icon={Boxes}
            />
            <StatCard
              label="Potential Revenue"
              value={formatCurrency(stats.totalSellingValue, currency)}
              description="What your current stock would earn if sold at full selling price."
              icon={TrendingUp}
              accent="success"
            />
            <StatCard
              label="Gross Margin on Hand"
              value={formatCurrency(stats.potentialMargin, currency)}
              description="Potential selling value minus total cost — the gross margin sitting in your warehouse."
              icon={TrendingUp}
              accent={stats.potentialMargin >= 0 ? "success" : "warning"}
            />
            <StatCard
              label="Low Stock Alerts"
              value={formatNumber(stats.lowStockItems.length)}
              description="Items where total stock across all locations is at or below the reorder point."
              icon={AlertTriangle}
              accent={stats.lowStockItems.length > 0 ? "warning" : "muted"}
            />
            <StatCard
              label="Active Locations"
              value={`${formatNumber(stats.activeLocationCount)} / ${formatNumber(stats.totalLocationCount)}`}
              description="Active warehouse or storage locations out of all locations configured."
              icon={MapPin}
              href={locationsHref}
            />
            <StatCard
              label="Stock Placements"
              value={formatNumber(stats.totalLocationStockEntries)}
              description="Total item-location assignments — how many distinct SKUs are placed across all locations."
              icon={Warehouse}
              accent="muted"
            />
            <StatCard
              label="Team Members"
              value={formatNumber(stats.memberCount)}
              description="Total users with access to this organisation, including the owner."
              icon={Users}
              href={`/org/slug/${slug}/dashboard/organization/members`}
              accent="muted"
            />
            <StatCard
              label="Inactive SKUs"
              value={formatNumber(stats.totalInactiveItems)}
              description="Products in the catalog that are marked inactive and not tracked in stock."
              icon={Package}
              accent="muted"
              href={inventoryHref}
            />
          </>
        )}
      </div>

      <Separator />

      {/* ── Two-column lower section ─────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">

        {/* Low Stock Alerts */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Low Stock Alerts</SectionLabel>
            {!isLoading && stats.lowStockItems.length > 0 && (
              <Link
                href={inventoryHref}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : stats.lowStockItems.length === 0 ? (
            <div className="rounded-xl border border-dashed px-5 py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">All items are well stocked</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Nothing is at or below its reorder point.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
              {stats.lowStockItems.map((item) => {
                const pct = item.reorderPoint > 0
                  ? Math.min((item.currentQty / item.reorderPoint) * 100, 100)
                  : 100;
                const isEmpty = item.currentQty === 0;

                return (
                  <div key={item._id} className="px-4 py-3 flex items-center gap-3 bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {isEmpty && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                            Out of stock
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">{item.SKU}</p>
                      {/* Stock fill bar */}
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", {
                            "bg-destructive": pct === 0,
                            "bg-amber-500": pct > 0 && pct <= 50,
                            "bg-yellow-400": pct > 50,
                          })}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-semibold tabular-nums", {
                        "text-destructive": isEmpty,
                        "text-amber-500": !isEmpty,
                      })}>
                        {formatNumber(item.currentQty)}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">
                          {item.unit}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        reorder at {formatNumber(item.reorderPoint)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Location Breakdown */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Locations Breakdown</SectionLabel>
            {!isLoading && (
              <Link
                href={locationsHref}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : stats.locationStats.length === 0 ? (
            <div className="rounded-xl border border-dashed px-5 py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">No active locations</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add a location to start tracking stock by place.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
              {stats.locationStats.map((loc) => (
                <Link
                  key={loc._id}
                  href={`${locationsHref}/${loc._id}`}
                  className="group px-4 py-3 flex items-center gap-3 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{loc.name}</p>
                      {loc.isDefault && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{loc.code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatNumber(loc.totalQty)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">units</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(loc.itemCount)}{" "}
                      {loc.itemCount === 1 ? "SKU" : "SKUs"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Top stocked items ───────────────────────────────────── */}
      {(isLoading || (stats?.topItems?.length ?? 0) > 0) && (
        <>
          <Separator />
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionLabel>Top Stocked Items</SectionLabel>
              <Link
                href={inventoryHref}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {stats.topItems.map((item, i) => (
                  <div
                    key={item._id}
                    className="rounded-xl border bg-card px-4 py-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground/60">#{i + 1}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{item.SKU}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xl font-semibold tabular-nums">
                      {formatNumber(item.totalQty)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">{item.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}
