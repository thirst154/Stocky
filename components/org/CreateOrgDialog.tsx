"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface CreateOrgDialogProps {
  /** Element rendered as the dialog trigger */
  trigger: React.ReactNode;
  /** Called with the new org's slug after successful creation */
  onSuccess?: (slug: string) => void;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateName(value: string): string | null {
  if (!value.trim()) return "Organization name is required.";
  if (value.trim().length < 2) return "Name must be at least 2 characters.";
  if (value.trim().length > 80) return "Name must be 80 characters or fewer.";
  return null;
}

function validateSlug(value: string): string | null {
  if (!value.trim()) return "URL slug is required.";
  if (value.length < 2) return "Slug must be at least 2 characters.";
  if (value.length > 48) return "Slug must be 48 characters or fewer.";
  if (!SLUG_REGEX.test(value))
    return "Slug may only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.";
  return null;
}

function mapServerError(message: string): { name?: string; slug?: string } {
  const lower = message.toLowerCase();
  if (lower.includes("slug") && lower.includes("taken"))
    return { slug: "This slug is already taken. Please choose another." };
  if (lower.includes("slug"))
    return { slug: "Invalid slug. Please check and try again." };
  if (lower.includes("name"))
    return { name: "This name is already in use. Please choose another." };
  return { slug: message }; // fallback: show under slug
}

export function CreateOrgDialog({ trigger, onSuccess }: CreateOrgDialogProps) {
  const router = useRouter();
  const createOrg = useMutation(api.organizations.createOrganization);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  function reset() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setNameError(null);
    setSlugError(null);
    setIsSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nErr = validateName(name);
    const sErr = validateSlug(slug);
    setNameError(nErr);
    setSlugError(sErr);
    if (nErr || sErr) return;

    setIsSubmitting(true);

    try {
      await createOrg({ name: name.trim(), slug: slug.trim() });
      setOpen(false);
      reset();
      if (onSuccess) {
        onSuccess(slug.trim());
      } else {
        router.push(`/org/slug/${slug.trim()}/dashboard`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      const mapped = mapServerError(message);
      setNameError(mapped.name ?? null);
      setSlugError(mapped.slug ?? null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create an organization</DialogTitle>
          <DialogDescription>
            Give your organization a name and a unique URL slug.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              aria-invalid={!!nameError}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-slug">URL slug</Label>
            <div
              className={`flex items-center rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] ${
                slugError
                  ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/20 dark:focus-within:ring-destructive/40"
                  : "border-input focus-within:border-ring focus-within:ring-ring/50"
              }`}
            >
              <span className="select-none border-r border-input px-3 py-1 text-sm text-muted-foreground">
                stocky.app/org/slug/
              </span>
              <input
                id="org-slug"
                className="h-9 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="acme-inc"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                  if (slugError) setSlugError(null);
                }}
              />
            </div>
            {slugError ? (
              <p className="text-xs text-destructive">{slugError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            )}
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
