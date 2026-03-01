"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
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

interface CreateLocationDialogProps {
  orgId: Id<"organizations">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLocationDialog({
  orgId,
  open,
  onOpenChange,
}: CreateLocationDialogProps) {
  const createLocation = useMutation(api.locations.createLocation);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setCode("");
    setDescription("");
    setIsDefault(false);
    setNameError(null);
    setCodeError(null);
    setSubmitError(null);
  }

  function handleOpenChange(val: boolean) {
    if (!val) resetForm();
    onOpenChange(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;
    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (!trimmedName) {
      setNameError("Name is required.");
      valid = false;
    }

    if (!trimmedCode) {
      setCodeError("Code is required.");
      valid = false;
    } else if (!/^[A-Z0-9][A-Z0-9\-_]*$/.test(trimmedCode)) {
      setCodeError("Only uppercase letters, numbers, hyphens, and underscores allowed.");
      valid = false;
    } else if (trimmedCode.length > 16) {
      setCodeError("Code must be 16 characters or fewer.");
      valid = false;
    }

    if (!valid) return;

    setSubmitError(null);
    setCreating(true);
    try {
      await createLocation({
        orgId,
        name: trimmedName,
        code: trimmedCode,
        description: description.trim() || undefined,
        isDefault: isDefault || undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create location.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add location</DialogTitle>
        </DialogHeader>
        <form
          id="create-location-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 pt-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="loc-name">Name</Label>
            <Input
              id="loc-name"
              placeholder="Main Warehouse"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              autoFocus
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-code">Code</Label>
            <Input
              id="loc-code"
              placeholder="WH-01"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(null); }}
              className="font-mono"
              aria-invalid={!!codeError}
            />
            {codeError ? (
              <p className="text-xs text-destructive">{codeError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Short unique identifier (e.g. MAIN, WH-01, LON-DC).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-desc">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="loc-desc"
              placeholder="Primary storage warehouse"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Set as default location
          </label>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="create-location-form" type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
