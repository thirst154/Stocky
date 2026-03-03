"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import UnitSelect from "./UnitSelect";

interface EditStockItemSheetProps {
  item: Doc<"stockItems"> | null;
  onOpenChange: (open: boolean) => void;
}

export function EditStockItemSheet({
  item,
  onOpenChange,
}: EditStockItemSheetProps) {
  const updateItem = useMutation(api.stockItems.updateStockItem);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [SKU, setSKU] = useState("");
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");
  const [reorderPoint, setReorderPoint] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when item changes
  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setDescription(item.description);
    setSKU(item.SKU);
    setBarcode(item.barcode ?? "");
    setQuantity(item.quantity);
    setUnit(item.unit);
    setReorderPoint(item.reorderPoint);
    setCostPrice(item.costPrice);
    setSellingPrice(item.sellingPrice);
    setIsActive(item.isActive);
    setError(null);
    setSaved(false);
  }, [item]);

  function handleClose() {
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setError(null);
    setSaving(true);
    try {
      await updateItem({
        itemId: item._id,
        name,
        description,
        SKU,
        barcode,
        quantity,
        unit,
        reorderPoint,
        costPrice,
        sellingPrice,
        isActive,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={!!item}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-5">
        <SheetHeader>
          <SheetTitle>Edit Stock Item</SheetTitle>
        </SheetHeader>

        {item && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 px-1 pt-2 pb-6"
          >
            {/* Identity */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Identity
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="e-name">Name</Label>
                <Input
                  id="e-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-desc">Description</Label>
                <Textarea
                  id="e-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-sku">SKU</Label>
                  <Input
                    id="e-sku"
                    value={SKU}
                    onChange={(e) => setSKU(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-barcode">Barcode</Label>
                  <Input
                    id="e-barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Quantity & unit */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Unit
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-qty">Unit Size</Label>
                  <Input
                    id="e-qty"
                    type="number"
                    min={0}
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <UnitSelect value={unit} onValueChange={setUnit} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-reorder">Reorder Point</Label>
                <Input
                  id="e-reorder"
                  type="number"
                  min={0}
                  step={1}
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when total stock across all locations falls to this
                  level.
                </p>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Pricing
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-cost">Cost Price</Label>
                  <Input
                    id="e-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-sell">Selling Price</Label>
                  <Input
                    id="e-sell"
                    type="number"
                    min={0}
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive items are hidden from stock tracking.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : saved ? (
                <p className="text-sm font-mono text-primary">Changes saved.</p>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
