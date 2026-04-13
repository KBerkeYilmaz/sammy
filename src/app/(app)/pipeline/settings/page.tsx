"use client";

import { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function SettingsPage() {
  const utils = api.useUtils();
  const profile = api.pipeline.getScoringProfile.useQuery();
  const update = api.pipeline.updateScoringProfile.useMutation({
    onSuccess: () => void utils.pipeline.getScoringProfile.invalidate(),
  });
  const rescoreAll = api.pipeline.runPipeline.useMutation();

  const [form, setForm] = useState({
    targetNaics: "",
    targetDepartments: "",
    preferredSetAsides: "",
    keywords: "",
    minContractValue: "",
    pursueThreshold: "70",
    watchThreshold: "40",
  });

  useEffect(() => {
    if (profile.data) {
      setForm({
        targetNaics: (profile.data.targetNaics as string[]).join(", "),
        targetDepartments: (profile.data.targetDepartments as string[]).join(", "),
        preferredSetAsides: (profile.data.preferredSetAsides as string[]).join(", "),
        keywords: (profile.data.keywords as string[]).join(", "),
        minContractValue: profile.data.minContractValue?.toString() ?? "",
        pursueThreshold: profile.data.pursueThreshold.toString(),
        watchThreshold: profile.data.watchThreshold.toString(),
      });
    }
  }, [profile.data]);

  function handleSave() {
    if (!profile.data) return;
    update.mutate({
      id: profile.data.id,
      targetNaics: form.targetNaics.split(",").map((s) => s.trim()).filter(Boolean),
      targetDepartments: form.targetDepartments.split(",").map((s) => s.trim()).filter(Boolean),
      preferredSetAsides: form.preferredSetAsides.split(",").map((s) => s.trim()).filter(Boolean),
      keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      minContractValue: form.minContractValue ? Number(form.minContractValue) : null,
      pursueThreshold: Number(form.pursueThreshold),
      watchThreshold: Number(form.watchThreshold),
    });
  }

  if (profile.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading scoring profile...
      </div>
    );
  }

  if (!profile.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">
          No scoring profile found. Run the pipeline once to create a default profile.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scoring Profile</h2>
        <p className="text-xs text-muted-foreground">
          {profile.data.name}
        </p>
      </div>

      <div className="space-y-5 rounded-lg border p-5">
        <Field
          label="Target NAICS Codes"
          hint="Comma-separated (e.g. 541512, 541519)"
          value={form.targetNaics}
          onChange={(v) => setForm({ ...form, targetNaics: v })}
        />
        <Field
          label="Target Departments"
          hint="Comma-separated"
          value={form.targetDepartments}
          onChange={(v) => setForm({ ...form, targetDepartments: v })}
        />
        <Field
          label="Preferred Set-Asides"
          hint="Comma-separated (e.g. SBA, Total Small Business)"
          value={form.preferredSetAsides}
          onChange={(v) => setForm({ ...form, preferredSetAsides: v })}
        />
        <Field
          label="Keywords"
          hint="Comma-separated"
          value={form.keywords}
          onChange={(v) => setForm({ ...form, keywords: v })}
        />
        <div>
          <Label className="text-xs font-medium">Minimum Contract Value ($)</Label>
          <Input
            type="number"
            value={form.minContractValue}
            onChange={(e) => setForm({ ...form, minContractValue: e.target.value })}
            placeholder="100000"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="space-y-5 rounded-lg border p-5">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Recommendation Thresholds</h3>
          <p className="text-[10px] text-muted-foreground">
            Opportunities with a fit score at or above the pursue threshold are recommended for pursuit.
            Scores between watch and pursue are watchlisted. Below watch threshold are skipped.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium">Pursue Threshold</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.pursueThreshold}
              onChange={(e) => setForm({ ...form, pursueThreshold: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Watch Threshold</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.watchThreshold}
              onChange={(e) => setForm({ ...form, watchThreshold: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save Profile
        </Button>
        <Button
          variant="outline"
          onClick={() => rescoreAll.mutate({ rescore: true })}
          disabled={rescoreAll.isPending}
        >
          {rescoreAll.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : null}
          Save &amp; Re-score All
        </Button>
      </div>

      {update.isSuccess && (
        <p className="text-xs text-emerald-600">Profile saved successfully.</p>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <p className="text-[10px] text-muted-foreground mb-1.5">{hint}</p>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
