import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Appointments from "@/pages/appointments";
import Invoices from "@/pages/invoices";
import Quotes from "@/pages/quotes";
import Inventory from "@/pages/inventory";
import NotFound from "@/pages/not-found";
import BookingPortal from "@/pages/book";
import LandingPage from "@/pages/landing";
import SignPage from "@/pages/sign";
import { isAuthenticated } from "@/lib/auth";
function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  const isAuthed = isAuthenticated();
  if (!isAuthed) {
    return <Redirect to="/admin" />;
  }
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Sidebar — hidden on mobile, visible on desktop */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b bg-background">
            {/* Desktop: sidebar toggle */}
            <div className="hidden md:block">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            {/* Mobile: logo */}
            <div className="md:hidden flex items-center gap-2">
              <img
                src="/ferdair_professional_logo.png"
                alt="FerdAir"
                className="h-8 w-auto object-contain"
              />
            </div>
            <h2 className="text-sm font-medium text-muted-foreground">
              FerdAir Manager
            </h2>
          </header>
          {/* Page content — extra bottom padding on mobile for nav bar */}
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto">
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/customers" component={Customers} />
                <Route path="/appointments" component={Appointments} />
                <Route path="/invoices" component={Invoices} />
                <Route path="/quotes" component={Quotes} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/">
                  {() => <Redirect to="/dashboard" />}
                </Route>
              </Switch>
            </div>
          </main>
        </div>
      </div>
      {/* Mobile bottom nav — only on mobile */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          {/* Admin login — must come before / to prevent wouter prefix-match swallowing /admin */}
          <Route path="/admin" component={Login} />

          {/* Public customer routes */}
          <Route path="/book" component={BookingPortal} />
          <Route path="/sign/:token" component={SignPage} />

          {/* Root → customer landing; any other path → admin app */}
          <Route path="/:rest*">
            {(params: { rest?: string }) =>
              params?.rest ? <AppLayout /> : <LandingPage />
            }
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;
