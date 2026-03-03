"use client";

import { DataTable } from "@/components/inventory/AbstractStockTable/dataTable";
import { buildLocationStockColumns, type LocationStockRow } from "@/components/locations/LocationStockColumns";
import { NewLocationStockDialog } from "@/components/locations/NewLocationStockDialog";
import { EditQuantityDialog } from "@/components/locations/EditQuantityDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { MapPin, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function LocationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locationId = params.location_id as Id<"locations">;

  const org = useQuery(api.organizations.getOrgBySlug, slug ? { slug } : "skip");
  const locations = useQuery(
    api.locations.getOrgLocations,
    org?._id ? { orgId: org._id } : "skip",
  );
  const location = useMemo(
    () => locations?.find((l) => l._id === locationId),
    [locations, locationId],
  );
  const locationStocks = useQuery(
    api.locationStocks.getLocationStocks,
    org?._id ? { locationId, orgId: org._id } : "skip",
  );

  const removeLocationStock = useMutation(api.locationStocks.removeLocationStock);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<LocationStockRow | null>(null);

  const columns = useMemo(
    () =>
      buildLocationStockColumns(
        (row) => setEditingRow(row),
        (id) => removeLocationStock({ locationStockId: id }),
      ),
    [removeLocationStock],
  );

  const isLoading = org === undefined || location === undefined || locationStocks === undefined;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono capitalize text-sm text-muted-foreground">
          <span className="border rounded p-1">{org?.slug ?? slug}</span>
          <span>/</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Locations
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
        ) : location ? (
          <>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-medium tracking-tight">{location.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {location.code}
              </Badge>
              {location.isDefault && <Badge variant="secondary">Default</Badge>}
              {!location.isActive && <Badge variant="destructive">Inactive</Badge>}
            </div>
            {location.description && (
              <p className="text-muted-foreground">{location.description}</p>
            )}
          </>
        ) : (
          <h1 className="text-3xl font-medium tracking-tight text-muted-foreground">
            Location not found
          </h1>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-end">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Location Inventory
        </p>
        <Button onClick={() => setAddDialogOpen(true)} disabled={!location?.isActive}>
          Add Stock <Plus className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Data table */}
      <div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <DataTable columns={columns} data={locationStocks ?? []} />
        )}
      </div>

      {/* Add stock dialog */}
      {org && location?.isActive && (
        <NewLocationStockDialog
          orgId={org._id}
          locationId={locationId}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      )}

      {/* Edit quantity dialog */}
      <EditQuantityDialog
        row={editingRow}
        onOpenChange={(open) => { if (!open) setEditingRow(null); }}
      />
    </div>
  );
}
