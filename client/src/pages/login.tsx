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
import { setToken, isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // If already "logged in", skip the login screen
  useEffect(() => {
    if (isAuthenticated()) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await api.post("/api/auth/login", { password });
      const { token, expiresIn } = response.data as {
        token?: string;
        expiresIn?: number;
      };

      if (!token) {
        throw new Error("No token received from server");
      }

      setToken(token, expiresIn);
      setError("");
      setLocation("/dashboard");
    } catch (err) {
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
