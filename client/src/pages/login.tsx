import { useLocation, Redirect } from "wouter";
import { useState, FormEvent } from "react";
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

  // Synchronous check — no flash, no useEffect delay
  if (isAuthenticated()) {
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await api.post("/api/auth/login", { password });
      const { token, expiresIn, expires_in } = response.data as {
        token?: string;
        expiresIn?: number;
        expires_in?: number;
      };

      if (!token) {
        throw new Error("No token received from server");
      }

      setToken(token, expires_in ?? expiresIn);
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
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.06em" }}>
              FERD<span style={{ color: "#2563eb" }}>AIR</span>
            </div>
          </div>
          <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet" />
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
