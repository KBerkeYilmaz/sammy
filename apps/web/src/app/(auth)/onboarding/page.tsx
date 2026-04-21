"use client";

import { useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const STEP_TITLES = [
  "Company Name",
  "NAICS Codes",
  "Target Agencies",
  "Set-Asides",
  "Keywords",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [naics, setNaics] = useState("");
  const [departments, setDepartments] = useState("");
  const [setAsides, setSetAsides] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return null;
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          targetNaics: naics.split(",").map((s) => s.trim()).filter(Boolean),
          targetDepartments: departments.split(",").map((s) => s.trim()).filter(Boolean),
          preferredSetAsides: setAsides.split(",").map((s) => s.trim()).filter(Boolean),
          keywords: keywords.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        toast.success("Company profile created!");
        router.push("/");
      } else {
        toast.error("Failed to create company profile. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canAdvance = () => {
    if (step === 0) return companyName.trim().length > 0;
    if (step === 1) return naics.trim().length > 0;
    if (step === 4) return keywords.trim().length > 0;
    return true; // departments and set-asides are optional
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-lg font-bold">S</span>
        </div>
        <CardTitle className="text-xl">Set up your company</CardTitle>
        <CardDescription>
          Step {step + 1} of {STEP_TITLES.length} — {STEP_TITLES[step]}
        </CardDescription>
        {/* Progress bar */}
        <div className="mt-3 flex gap-1.5">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 0 && (
          <div className="space-y-2">
            <Label htmlFor="company">What&apos;s your company name?</Label>
            <Input
              id="company"
              placeholder="e.g. Acme Defense Solutions"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="naics">NAICS codes (comma-separated)</Label>
            <Input
              id="naics"
              placeholder="e.g. 541512, 541519, 541330"
              value={naics}
              onChange={(e) => setNaics(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Common: 541512 (Cybersecurity), 541519 (IT Services), 541330 (Engineering)
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor="depts">Target agencies (comma-separated, optional)</Label>
            <Input
              id="depts"
              placeholder="e.g. DoD, DHS, VA, GSA"
              value={departments}
              onChange={(e) => setDepartments(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <Label htmlFor="setasides">Set-aside eligibility (comma-separated, optional)</Label>
            <Input
              id="setasides"
              placeholder="e.g. Small Business, 8(a), SDVOSB"
              value={setAsides}
              onChange={(e) => setSetAsides(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            <Label htmlFor="keywords">Capability keywords (comma-separated)</Label>
            <Input
              id="keywords"
              placeholder="e.g. cloud migration, zero trust, DevSecOps"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              autoFocus
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            Back
          </Button>
        )}
        {step < STEP_TITLES.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={!canAdvance() || loading}
            className="flex-1"
          >
            {loading ? "Setting up..." : "Finish setup"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
