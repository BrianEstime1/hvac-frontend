import { useLocation } from "wouter";
import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";

// Single shared access code for the app
const APP_PASSWORD =
  import.meta.env.VITE_APP_PASSWORD || "";

export default function Login() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // If already "logged in", skip the login screen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authed = localStorage.getItem("ferdair_auth") === "ok";
      if (authed) {
        setLocation("/dashboard");
      }
    }
  }, [setLocation]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password === APP_PASSWORD) {
      localStorage.setItem("ferdair_auth", "ok");
      setError("");
      setLocation("/dashboard");
    } else {
      setError("Incorrect password. Try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-6">
          <div className="flex justify-center">
            <img
              src="/ferdair-logo.png"
              alt="FerdAir Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-xl font-semibold">
              FerdAir Manager
            </CardTitle>
            <CardDescription>
              Enter the access code to open the dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Access code</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              data-testid="button-login"
            >
              Access Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
