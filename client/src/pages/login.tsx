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
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">HVAC Management System</CardTitle>
            <CardDescription>Professional management for your HVAC business</CardDescription>
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
