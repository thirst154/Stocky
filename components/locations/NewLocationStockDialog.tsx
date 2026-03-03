"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";

interface NewLocationStockDialogProps {
  orgId: Id<"organizations">;
  locationId: Id<"locations">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Returns true if all chars of `query` appear in order inside `text`. */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyFilter(items: Doc<"stockItems">[], query: string) {
  if (!query.trim()) return items;
  return items.filter(
    (item) =>
      fuzzyMatch(item.name, query) ||
      fuzzyMatch(item.SKU, query) ||
      fuzzyMatch(item.description, query),
  );
}

export function NewLocationStockDialog({
  orgId,
  locationId,
  open,
  onOpenChange,
}: NewLocationStockDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Doc<"stockItems"> | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [locationInLocation, setLocationInLocation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const stockItems = useQuery(api.stockItems.getStockItems, { orgId });
  const addLocationStock = useMutation(api.locationStocks.addLocationStock);

  const filteredItems = useMemo(
    () => fuzzyFilter(stockItems ?? [], search),
    [stockItems, search],
  );

  function reset() {
    setSearch("");
    setSelectedItem(null);
    setQuantity(0);
    setLocationInLocation("");
    setError("");
  }

  function handleOpenChange(val: boolean) {
    if (!val) reset();
    onOpenChange(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) {
      setError("Please select a stock item.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    setError("");
    try {
      setSaving(true);
      await addLocationStock({
        orgId,
        locationId,
        itemId: selectedItem._id,
        quantity,
        locationInLocation,
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add stock.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Stock to Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          {/* Stock item search */}
          <div className="space-y-1.5">
            <Label>Stock Item</Label>
            {selectedItem ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedItem.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedItem.SKU}</p>
                </div>
                <Badge variant="secondary">{selectedItem.unit}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setSelectedItem(null); setSearch(""); }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by name, SKU, or description…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                  {stockItems === undefined ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Loading…
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No items match your search.
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.SKU}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">{item.unit}</Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="ls-quantity">Quantity at Location</Label>
            <Input
              id="ls-quantity"
              type="number"
              min={0}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          {/* Sub-location */}
          <div className="space-y-1.5">
            <Label htmlFor="ls-sublocation">Sub-location <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="ls-sublocation"
              placeholder="e.g. Shelf A3, Bin 12…"
              value={locationInLocation}
              onChange={(e) => setLocationInLocation(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !selectedItem}>
              {saving ? "Adding…" : "Add to Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
