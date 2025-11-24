import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-6">
          <div className="flex justify-center">
            <img 
              src="/ferdair-logo.jpg" 
              alt="FerdAir Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="text-center space-y-2">
            <CardDescription>Professional HVAC management for your business</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleLogin}
            data-testid="button-login"
          >
            Access Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
