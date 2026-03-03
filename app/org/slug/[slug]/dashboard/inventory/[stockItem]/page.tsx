"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Barcode,
  Building2,
  Package,
  PencilIcon,
  Tag,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EditStockItemSheet } from "@/components/inventory/EditStockItemSheet";
import { cn } from "@/lib/utils";

function InfoTile({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ElementType;
  accent?: "success" | "warning" | "default";
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && (
          <Icon
            className={cn("h-3.5 w-3.5 shrink-0", {
              "text-emerald-500": accent === "success",
              "text-amber-500": accent === "warning",
              "text-muted-foreground": !accent || accent === "default",
            })}
          />
        )}
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn("text-2xl font-semibold tracking-tight", {
          "text-emerald-500": accent === "success",
          "text-amber-500": accent === "warning",
        })}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function StockItemDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const stockItemId = params.stockItem as Id<"stockItems">;

  const org = useQuery(api.organizations.getOrgBySlug, slug ? { slug } : "skip");
  const item = useQuery(
    api.stockItems.getStockItemById,
    org?._id ? { itemId: stockItemId, orgId: org._id } : "skip",
  );
  const locationStocks = useQuery(
    api.locationStocks.getItemLocationStocks,
    org?._id ? { itemId: stockItemId, orgId: org._id } : "skip",
  );

  const [editOpen, setEditOpen] = useState(false);

  const isLoading = org === undefined || item === undefined;
  const currency = org?.currency ?? "USD";
  const totalStock = (locationStocks ?? []).reduce((sum, ls) => sum + ls.quantity, 0);
  const margin = item ? item.sellingPrice - item.costPrice : 0;
  const marginPct = item?.costPrice ? (margin / item.costPrice) * 100 : 0;

  function fmt(n: number) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/org/slug/${slug}/dashboard/inventory`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Inventory
        </Link>
        <span>/</span>
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="text-foreground font-medium">{item?.name ?? "Not found"}</span>
        )}
      </div>

      {/* Header */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
      ) : !item ? (
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-muted-foreground">
            Item not found
          </h1>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-medium tracking-tight">{item.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">{item.SKU}</Badge>
              {item.barcode && (
                <Badge variant="secondary" className="font-mono text-xs gap-1">
                  <Barcode className="h-3 w-3" />
                  {item.barcode}
                </Badge>
              )}
              {item.isActive ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            {item.description && (
              <p className="text-muted-foreground max-w-2xl">{item.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setEditOpen(true)}
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
      )}

      <Separator />

      {/* Metrics grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : item ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile
            label="Total Stock"
            value={`${totalStock.toLocaleString()} ${item.unit}`}
            sub={`Across ${(locationStocks ?? []).length} location${(locationStocks ?? []).length !== 1 ? "s" : ""}`}
            icon={Package}
            accent={totalStock <= item.reorderPoint && item.reorderPoint > 0 ? "warning" : "default"}
          />
          <InfoTile
            label="Cost Price"
            value={fmt(item.costPrice)}
            sub={`per ${item.unit}`}
            icon={Tag}
          />
          <InfoTile
            label="Selling Price"
            value={fmt(item.sellingPrice)}
            sub={`per ${item.unit}`}
            icon={TrendingUp}
            accent="success"
          />
          <InfoTile
            label="Gross Margin"
            value={`${marginPct.toFixed(1)}%`}
            sub={`${fmt(margin)} per unit`}
            icon={TrendingUp}
            accent={margin >= 0 ? "success" : "warning"}
          />
          <InfoTile
            label="Reorder Point"
            value={item.reorderPoint.toLocaleString()}
            sub={totalStock <= item.reorderPoint && item.reorderPoint > 0 ? "⚠ Reorder needed" : "Stock level OK"}
            icon={TriangleAlert}
            accent={totalStock <= item.reorderPoint && item.reorderPoint > 0 ? "warning" : "default"}
          />
          <InfoTile
            label="Unit Size"
            value={`${item.quantity} ${item.unit}`}
            sub="Pack / unit size"
          />
          <InfoTile
            label="Inventory Value"
            value={fmt(totalStock * item.costPrice)}
            sub="Total cost at current stock"
          />
          <InfoTile
            label="Revenue Potential"
            value={fmt(totalStock * item.sellingPrice)}
            sub="If all stock sold at list price"
            accent="success"
          />
        </div>
      ) : null}

      <Separator />

      {/* Location breakdown */}
      <section className="flex flex-col gap-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Stock by Location
        </p>

        {locationStocks == null ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : locationStocks.length === 0 ? (
          <div className="rounded-xl border border-dashed px-5 py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Not stocked at any location
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add this item to a location from the Locations page.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
            {locationStocks.map((ls) => (
              <Link
                key={ls._id}
                href={`/org/slug/${slug}/dashboard/locations/${ls.locationID}`}
                className="group px-4 py-3 flex items-center gap-3 bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {ls.location?.name ?? "Unknown location"}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-muted-foreground">
                      {ls.location?.code}
                    </p>
                    {ls.locationInLocation && (
                      <p className="text-xs text-muted-foreground">
                        · {ls.locationInLocation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {ls.quantity.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {item?.unit}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Edit sheet */}
      {item && (
        <EditStockItemSheet
          item={editOpen ? item : null}
          onOpenChange={(open) => { if (!open) setEditOpen(false); }}
        />
      )}
    </div>
  );
}
