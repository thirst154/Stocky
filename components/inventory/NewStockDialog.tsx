"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import UnitSelect from "./UnitSelect";
import { Switch } from "../ui/switch";

interface NewStockDialogProps {
  orgId: Id<"organizations">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStockDialog({
  orgId,
  open,
  onOpenChange,
}: NewStockDialogProps) {
  const [name, setName] = useState("");
  const [SKU, setSKU] = useState("");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");
  const [reorderPoint, setReorderPoint] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [SKUError, setSKUError] = useState("");
  const [barcodeError, setBarcodeError] = useState("");

  const [creating, setCreating] = useState(false);

  const org = useQuery(api.organizations.getOrgByID, { id: orgId });
  const newStock = useMutation(api.stockItems.newStockItem);

  function resetForm() {
    setName("");
    setSKU("");
    setDescription("");
    setBarcode("");
    setQuantity(0);
    setUnit("");
    setReorderPoint(0);
    setCostPrice(0);
    setSellingPrice(0);
    setIsActive(true);
    setSKUError("");
    setBarcodeError("");
  }

  function handleOpenChange(val: boolean) {
    if (!val) resetForm();
    onOpenChange(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let hasError = false;
    if (!SKU.trim()) {
      setSKUError("SKU is required");
      hasError = true;
    } else {
      setSKUError("");
    }
    if (!barcode.trim()) {
      setBarcodeError("Barcode is required");
      hasError = true;
    } else {
      setBarcodeError("");
    }

    if (hasError) return;

    try {
      setCreating(true);
      await newStock({
        orgId,
        name,
        SKU: SKU.trim(),
        description,
        barcode: barcode.trim(),
        quantity,
        unit,
        reorderPoint,
        costPrice,
        sellingPrice,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stock Primative</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 pt-2"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              placeholder="New Item Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description text area*/}
          <div className="space-y-1.5">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            {/* SKU */}
            <div className="space-y-1.5">
              <Label htmlFor="item-sku">SKU</Label>
              <Input
                id="item-sku"
                placeholder="SKU"
                value={SKU}
                onChange={(e) => setSKU(e.target.value)}
              />
              {SKUError && (
                <p className="text-sm text-destructive">{SKUError}</p>
              )}
            </div>
            {/* Barcode */}
            <div className="space-y-1.5">
              <Label htmlFor="item-barcode">Barcode</Label>
              <Input
                id="item-barcode"
                placeholder="Barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              {barcodeError && (
                <p className="text-sm text-destructive">{barcodeError}</p>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            {/* Unit */}
            <div className="space-y-1.5">
              <Label htmlFor="item-unit">Unit</Label>
              <UnitSelect value={unit} onValueChange={setUnit} />
            </div>
          </div>

          <div className="flex gap-4">
            {/* Reorder Point */}
            <div className="space-y-1.5">
              <Label htmlFor="item-reorder-point">Reorder Point</Label>
              <Input
                id="item-reorder-point"
                type="number"
                placeholder="Reorder Point"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(Number(e.target.value))}
              />
            </div>
            {/* Cost Price */}
            <div className="space-y-1.5">
              <Label htmlFor="item-cost-price">
                Cost Price ({org?.currency})
              </Label>
              <Input
                id="item-cost-price"
                type="number"
                placeholder="Cost Price"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
              />
            </div>
            {/* Selling Price */}
            <div className="space-y-1.5">
              <Label htmlFor="item-selling-price">
                Selling Price ({org?.currency})
              </Label>
              <Input
                id="item-selling-price"
                type="number"
                placeholder="Selling Price"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Label htmlFor="item-is-active">Is Active</Label>
            <Switch
              id="item-is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create Stock Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
