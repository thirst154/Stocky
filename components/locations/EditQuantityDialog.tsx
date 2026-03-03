"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState, useEffect } from "react";
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
import type { LocationStockRow } from "./LocationStockColumns";

interface EditQuantityDialogProps {
  row: LocationStockRow | null;
  onOpenChange: (open: boolean) => void;
}

export function EditQuantityDialog({ row, onOpenChange }: EditQuantityDialogProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateQty = useMutation(api.locationStocks.updateLocationStockQuantity);

  // Sync input when the target row changes
  useEffect(() => {
    if (row) setQuantity(row.quantity);
  }, [row]);

  function handleClose() {
    setError(null);
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;
    if (quantity < 0) {
      setError("Quantity cannot be negative.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateQty({ locationStockId: row._id, quantity });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!row} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Quantity</DialogTitle>
        </DialogHeader>

        {row && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
            {/* Item context */}
            <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-0.5">
              <p className="text-sm font-medium">{row.item?.name ?? "Unknown item"}</p>
              <p className="text-xs font-mono text-muted-foreground">{row.item?.SKU}</p>
              {row.locationInLocation && (
                <p className="text-xs text-muted-foreground">
                  Sub-location: {row.locationInLocation}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-qty">
                Quantity
                {row.item?.unit && (
                  <span className="ml-1 text-muted-foreground font-normal">({row.item.unit})</span>
                )}
              </Label>
              <Input
                id="edit-qty"
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
