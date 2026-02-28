"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "CNY", label: "CNY — Chinese Yuan" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "BRL", label: "BRL — Brazilian Real" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Sao_Paulo", label: "Brazil (BRT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "Africa/Lagos", label: "West Africa (WAT)" },
  { value: "Africa/Johannesburg", label: "South Africa (SAST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </Label>
      <p className="text-sm">
        {value || (
          <span className="italic text-muted-foreground/50">Not set</span>
        )}
      </p>
    </div>
  );
}

export default function OrganizationPage() {
  const params = useParams();
  const slug = params.slug as string | undefined;

  const org = useQuery(api.organizations.getOrgBySlug, slug ? { slug } : "skip");
  const user = useQuery(api.users.getCurrentUser);
  const update = useMutation(api.organizations.updateOrganization);

  const isLoading = org === undefined || user === undefined;
  const isOwner = !!(org && user && org.ownerID === user._id);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setEmail(org.email);
    setPhone(org.phone);
    setAddress(org.address);
    setCurrency(org.currency);
    setTimezone(org.timezone);
  }, [org]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setError(null);
    setSaving(true);
    try {
      await update({ orgId: org._id, name, email, phone, address, currency, timezone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSave} id="org-form" className="flex flex-col gap-6">
        {/* General section */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            General
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))
            ) : isOwner ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="org-name">Name</Label>
                  <Input
                    id="org-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="contact@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-phone">Phone</Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-address">Address</Label>
                  <Input
                    id="org-address"
                    placeholder="123 Main St, City, Country"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <ReadonlyField label="Name" value={org?.name} />
                <ReadonlyField label="Email" value={org?.email} />
                <ReadonlyField label="Phone" value={org?.phone} />
                <ReadonlyField label="Address" value={org?.address} />
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Preferences section */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Preferences
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))
            ) : isOwner ? (
              <>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <ReadonlyField label="Currency" value={org?.currency} />
                <ReadonlyField label="Timezone" value={org?.timezone} />
              </>
            )}
          </div>
        </div>
      </form>

      {/* Save row */}
      {isOwner && !isLoading && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : saved ? (
              <p className="font-mono text-sm text-primary">Changes saved.</p>
            ) : (
              <span />
            )}
            <Button form="org-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </>
      )}

    </div>
  );
}
