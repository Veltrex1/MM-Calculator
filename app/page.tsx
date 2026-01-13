"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "basic" | "advanced";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
];

type CalculationResult =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "ready";
      marriedMore: DateTime;
      age: { years: number; months: number };
      weddingFuture: boolean;
    };

const ageLabel = (years: number, months: number) => {
  const parts = [];
  if (years) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
  }
  if (months || (!years && !months)) {
    parts.push(`${months} month${months === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
};

const explainMarriedMoreDate = ({
  birth,
  wedding,
}: {
  birth: DateTime;
  wedding: DateTime;
}): CalculationResult => {
  if (!birth.isValid || !wedding.isValid) {
    return {
      status: "error",
      message: "Double-check that each calendar entry is complete.",
    };
  }

  if (wedding <= birth) {
    return {
      status: "error",
      message:
        "Your wedding must happen after your birthdate. Please adjust the earlier entry.",
    };
  }

  const durationBeforeMarriage = wedding.diff(birth, ["milliseconds"]);
  const marriedMore = wedding.plus(durationBeforeMarriage);
  const totalMonths = Math.floor(
    marriedMore.diff(birth, ["months"]).months ?? 0
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const weddingFuture = wedding > DateTime.now();

  return {
    status: "ready",
    marriedMore,
    age: { years, months },
    weddingFuture,
  };
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("basic");
  const [birthDate, setBirthDate] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [advancedBirth, setAdvancedBirth] = useState("");
  const [advancedWedding, setAdvancedWedding] = useState("");
  const [birthTimezone, setBirthTimezone] = useState(TIMEZONES[0]);
  const [weddingTimezone, setWeddingTimezone] = useState(TIMEZONES[0]);
  const [copyLabel, setCopyLabel] = useState("Copy result");
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const result = useMemo(() => {
    if (mode === "basic") {
      if (!birthDate || !weddingDate) {
        return {
          status: "idle",
          message: "Enter both dates to reveal your MarriedMore moment.",
        };
      }

      const birth = DateTime.fromISO(birthDate, { zone: "UTC" }).startOf(
        "day"
      );
      const wedding = DateTime.fromISO(weddingDate, { zone: "UTC" }).startOf(
        "day"
      );
      return explainMarriedMoreDate({ birth, wedding });
    }

    if (!advancedBirth || !advancedWedding) {
      return {
        status: "idle",
        message: "Add the date, time, and timezone for both birth and wedding.",
      };
    }

    const birth = DateTime.fromISO(advancedBirth, {
      zone: birthTimezone,
    });
    const wedding = DateTime.fromISO(advancedWedding, {
      zone: weddingTimezone,
    });
    return explainMarriedMoreDate({ birth, wedding });
  }, [
    mode,
    birthDate,
    weddingDate,
    advancedBirth,
    advancedWedding,
    birthTimezone,
    weddingTimezone,
  ]);

  const marriedMoreLabel =
    result.status === "ready"
      ? mode === "advanced"
        ? result.marriedMore
            .setZone(weddingTimezone)
            .toLocaleString(DateTime.DATETIME_FULL)
        : result.marriedMore.toLocaleString(DateTime.DATE_FULL)
      : "—";

  const ageDetail =
    result.status === "ready" && result.age
      ? ageLabel(result.age.years, result.age.months)
      : "—";

  const copyDisabled = result.status !== "ready";

  const handleCopy = useCallback(async () => {
    if (copyDisabled || result.status !== "ready") {
      return;
    }

    const explanation = [
      `MarriedMore Date: ${marriedMoreLabel}`,
      `You’ll be married more than not married at: ${ageDetail} old`,
      "At this moment, married time becomes greater than unmarried time.",
    ];

    if (result.weddingFuture) {
      explanation.push(
        "Wedding is still in the future, so this milestone also lives ahead until your ceremony."
      );
    }

    try {
      await navigator.clipboard.writeText(explanation.join("\n"));
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Copy failed");
    }

    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
    }

    copyTimeout.current = setTimeout(() => {
      setCopyLabel("Copy result");
    }, 2000);
  }, [ageDetail, copyDisabled, marriedMoreLabel, result]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-14 sm:py-20">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            MarriedMore
          </p>
          <h1 className="text-4xl font-serif italic text-slate-900">
            Building stronger partnerships
          </h1>
        </div>
        <Card className="w-full bg-white/80 backdrop-blur">
          <CardHeader className="flex flex-col gap-2 px-6 pb-1">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold">
                When will you be MarriedMore?
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter the dates that define your story and we’ll surface the
                exact moment married time eclipses unmarried time.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-6 pb-4 pt-2">
            <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <TabsList className="w-full max-w-[24rem]">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="basic">
                <div className="grid gap-6 pt-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="birth-date">Birth date</Label>
                    <Input
                      id="birth-date"
                      type="date"
                      value={birthDate}
                      onChange={(event) => setBirthDate(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Date only—time is assumed to be midnight UTC for this mode.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="wedding-date">Wedding date</Label>
                    <Input
                      id="wedding-date"
                      type="date"
                      value={weddingDate}
                      onChange={(event) => setWeddingDate(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Keep this date accurate; we derive the landmark from twice
                      the wedding span.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="advanced">
                <div className="grid gap-6 pt-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="birth-datetime">Birth date &amp; time</Label>
                      <Input
                        id="birth-datetime"
                        type="datetime-local"
                        value={advancedBirth}
                        onChange={(event) =>
                          setAdvancedBirth(event.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="birth-timezone">Birth timezone</Label>
                      <Select
                        value={birthTimezone}
                        onValueChange={(value) => setBirthTimezone(value)}
                      >
                        <SelectTrigger id="birth-timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="wedding-datetime">
                        Wedding date &amp; time
                      </Label>
                      <Input
                        id="wedding-datetime"
                        type="datetime-local"
                        value={advancedWedding}
                        onChange={(event) =>
                          setAdvancedWedding(event.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="wedding-timezone">
                        Wedding timezone
                      </Label>
                      <Select
                        value={weddingTimezone}
                        onValueChange={(value) => setWeddingTimezone(value)}
                      >
                        <SelectTrigger id="wedding-timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <p className="pt-4 text-xs text-muted-foreground">
                  Advanced mode accounts for the precise time and location of
                  each milestone, so the moment you hit MarriedMore carries the
                  exact zone you expect.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-6 pt-0 pb-6">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                MarriedMore Date
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {marriedMoreLabel}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                You’ll be married more than not married at:{" "}
                <span className="font-medium text-slate-900">{ageDetail}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                At this moment, married time becomes greater than unmarried
                time.
              </p>
              {result.status === "ready" && result.weddingFuture && (
                <p className="text-xs text-muted-foreground">
                  This date stays in the future because your wedding is still
                  planned; the milestone always follows the ceremony.
                </p>
              )}
              {result.status === "error" && (
                <p className="text-sm text-destructive">{result.message}</p>
              )}
              {result.status === "idle" && (
                <p className="text-sm text-muted-foreground">
                  {result.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {mode === "advanced"
                  ? "Precise to the minute."
                  : "Days only, for a quicker read."}
              </div>
              <Button
                onClick={handleCopy}
                disabled={copyDisabled}
                className="w-full sm:w-auto"
              >
                {copyLabel}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
