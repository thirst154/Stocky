"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateLocationDialog } from "@/components/dashbord/CreateLocationDialog";

type Location = {
  _id: Id<"locations">;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
};

function LocationRow({
  location,
  isOwner,
  onToggleActive,
  onSetDefault,
  onDelete,
}: {
  location: Location;
  isOwner: boolean;
  onToggleActive: (id: Id<"locations">, active: boolean) => void;
  onSetDefault: (id: Id<"locations">) => void;
  onDelete: (id: Id<"locations">) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <MapPin className="size-4 text-muted-foreground" />
      </div>

      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium truncate">{location.name}</span>
          <span className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs">
            {location.code}
          </span>
          {location.isDefault && (
            <span className="shrink-0 rounded px-1.5 py-0.5 font-mono text-xs bg-primary/10 text-primary">
              default
            </span>
          )}
          {!location.isActive && (
            <span className="shrink-0 rounded px-1.5 py-0.5 font-mono text-xs bg-muted text-muted-foreground">
              inactive
            </span>
          )}
        </div>
        {location.description && (
          <span className="text-xs text-muted-foreground truncate">
            {location.description}
          </span>
        )}
      </div>

      {isOwner && (
        <div className="flex shrink-0 items-center gap-1">
          {confirming ? (
            <>
              <span className="text-xs text-muted-foreground pr-1">Delete?</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => { onDelete(location._id); setConfirming(false); }}
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {!location.isDefault && location.isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => onSetDefault(location._id)}
                >
                  Set default
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => onToggleActive(location._id, !location.isActive)}
              >
                {location.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function LocationsPage() {
  const params = useParams();
  const slug = params.slug as string | undefined;

  const org = useQuery(
    api.organizations.getOrgBySlug,
    slug ? { slug } : "skip",
  );
  const user = useQuery(api.users.getCurrentUser);
  const locations = useQuery(
    api.locations.getOrgLocations,
    org?._id ? { orgId: org._id } : "skip",
  );

  const updateLocation = useMutation(api.locations.updateLocation);
  const deleteLocation = useMutation(api.locations.deleteLocation);

  const isLoading =
    org === undefined || user === undefined || locations === undefined;
  const isOwner = !!(org && user && org.ownerID === user._id);

  const [open, setOpen] = useState(false);

  async function handleToggleActive(id: Id<"locations">, active: boolean) {
    await updateLocation({ locationId: id, isActive: active });
  }

  async function handleSetDefault(id: Id<"locations">) {
    await updateLocation({ locationId: id, isDefault: true });
  }

  async function handleDelete(id: Id<"locations">) {
    await deleteLocation({ locationId: id });
  }

  const active = locations?.filter((l) => l.isActive) ?? [];
  const inactive = locations?.filter((l) => !l.isActive) ?? [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground capitalize">
          {isLoading ? (
            <Skeleton className="h-6 w-20 rounded" />
          ) : (
            <span className="border rounded p-1">{org?.slug}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-medium tracking-tight">Locations</h1>
          {isOwner && !isLoading && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Add location
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Active locations */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Locations
        </p>

        {isLoading ? (
          <div className="flex flex-col divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : active.length > 0 ? (
          <div className="flex flex-col divide-y">
            {active.map((loc) => (
              <LocationRow
                key={loc._id}
                location={loc}
                isOwner={isOwner}
                onToggleActive={handleToggleActive}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed px-6 py-10 text-center">
            <MapPin className="mx-auto mb-2 size-5 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No locations yet
            </p>
            {isOwner && (
              <p className="mt-1 text-xs text-muted-foreground/60">
                Click &ldquo;Add location&rdquo; to create your first one.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Inactive locations */}
      {!isLoading && inactive.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Inactive
            </p>
            <div className="flex flex-col divide-y">
              {inactive.map((loc) => (
                <LocationRow
                  key={loc._id}
                  location={loc}
                  isOwner={isOwner}
                  onToggleActive={handleToggleActive}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {org && (
        <CreateLocationDialog
          orgId={org._id}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </div>
  );
}
