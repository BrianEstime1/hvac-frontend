import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = import.meta.env.VITE_API_URL || "https://hvac-management-api.onrender.com";

const SERVICE_TYPES = [
  "AC Repair",
  "AC Replacement",
  "Heating Repair",
  "Heating Replacement",
  "Ductwork",
  "Maintenance / Tune-Up",
  "New Installation",
  "Free Evaluation",
  "Other",
];

const TIME_SLOTS = [
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
];

type Step = "info" | "service" | "confirm" | "done";

export default function BookingPortal() {
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    service_type: "",
    preferred_date: "",
    preferred_time: "",
    notes: "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedInfo =
    form.name.trim() && form.phone.trim() && form.address.trim();
  const canProceedService =
    form.service_type && form.preferred_date && form.preferred_time;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet" />
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <a href="/" style={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
               onMouseOver={e => (e.currentTarget.style.color = "#fff")}
               onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
              <ArrowLeft style={{ width: "18px", height: "18px" }} />
            </a>
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--foreground)" }}>
                FERD<span style={{ color: "#2563eb" }}>AIR</span>
              </div>
              <div className="text-xs text-muted-foreground">Book a Service</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Progress indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-8">
            {(["info", "service", "confirm"] as Step[]).map((s, i) => {
              const steps: Step[] = ["info", "service", "confirm"];
              const currentIdx = steps.indexOf(step);
              const isActive = s === step;
              const isDone = steps.indexOf(s) < currentIdx;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: isDone
                        ? "hsl(var(--primary))"
                        : isActive
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted))",
                      color: isDone || isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className="flex-1 h-0.5 rounded transition-all"
                      style={{ background: isDone ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: Contact Info */}
        {step === "info" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Info</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us how to reach you and where the service is needed.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Full Name *</label>
                <Input
                  placeholder="John Smith"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="min-h-12 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Phone Number *</label>
                <Input
                  type="tel"
                  placeholder="(561) 555-0100"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="min-h-12 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email (optional)</label>
                <Input
                  type="email"
                  placeholder="john@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="min-h-12 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Service Address *</label>
                <Input
                  placeholder="123 Main St, West Palm Beach FL"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="min-h-12 text-base"
                />
              </div>
            </div>
            <Button
              className="w-full min-h-12 text-base"
              onClick={() => setStep("service")}
              disabled={!canProceedInfo}
            >
              Continue →
            </Button>
          </div>
        )}

        {/* Step 2: Service */}
        {step === "service" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Service Details</h1>
              <p className="text-sm text-muted-foreground mt-1">
                What do you need done, and when works for you?
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Service Type *</label>
                <Select value={form.service_type} onValueChange={(v) => set("service_type", v)}>
                  <SelectTrigger className="min-h-12 text-base">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Preferred Date *</label>
                <div style={{ position: "relative" }}>
                  <Input
                    type="date"
                    min={minDate}
                    value={form.preferred_date}
                    onChange={(e) => set("preferred_date", e.target.value)}
                    className="min-h-12 text-base"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#2563eb", fontSize: "1rem" }}>📅</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Preferred Time *</label>
                <Select value={form.preferred_time} onValueChange={(v) => set("preferred_time", v)}>
                  <SelectTrigger className="min-h-12 text-base">
                    <SelectValue placeholder="Select a time window" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Additional Notes</label>
                <Textarea
                  placeholder="Describe the issue, unit type, anything helpful..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className="min-h-24 text-base resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 min-h-12" onClick={() => setStep("info")}>
                ← Back
              </Button>
              <Button className="flex-1 min-h-12 text-base" onClick={() => setStep("confirm")} disabled={!canProceedService}>
                Review →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Confirm Booking</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review your details before submitting.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Name", value: form.name },
                { label: "Phone", value: form.phone },
                { label: "Email", value: form.email || "Not provided" },
                { label: "Address", value: form.address },
                { label: "Service", value: form.service_type },
                { label: "Date", value: form.preferred_date },
                { label: "Time", value: form.preferred_time },
                { label: "Notes", value: form.notes || "None" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-start py-3 border-b border-border/50"
                >
                  <span className="text-sm font-medium text-muted-foreground w-20 flex-shrink-0">{label}</span>
                  <span className="text-sm text-foreground text-right flex-1 ml-4">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              📞 We'll call you to confirm your appointment within a few hours.
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 min-h-12" onClick={() => setStep("service")}>
                ← Back
              </Button>
              <Button className="flex-1 min-h-12 text-base" onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Confirm Booking ✓"}
              </Button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">✅</div>
            <h1 className="text-2xl font-bold text-foreground">You're booked!</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We received your request for <strong>{form.service_type}</strong> on <strong>{form.preferred_date}</strong>.
              We'll call <strong>{form.phone}</strong> to confirm your appointment.
            </p>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground max-w-sm mx-auto">
              Questions? Call us at <a href="tel:+15615775327" className="font-semibold text-foreground underline">(561) 577-5327</a>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setStep("info");
                setForm({ name: "", phone: "", email: "", address: "", service_type: "", preferred_date: "", preferred_time: "", notes: "" });
              }}
            >
              Book Another Service
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
