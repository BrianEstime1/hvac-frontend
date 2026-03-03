import { Link, useLocation } from "wouter";
import { Home, Users, Calendar, FileText, Package, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home",      url: "/dashboard",    icon: Home },
  { title: "Clients",   url: "/customers",    icon: Users },
  { title: "Invoices",  url: "/invoices",     icon: FileText },
  { title: "Appts",     url: "/appointments", icon: Calendar },
  { title: "Quotes",    url: "/quotes",       icon: ClipboardList },
  { title: "Parts",     url: "/inventory",    icon: Package },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const active = location === item.url;
        return (
          <Link key={item.url} href={item.url}>
            <button className={cn("mobile-nav-item", active && "active")}>
              <item.icon className="mobile-nav-icon" strokeWidth={active ? 2.5 : 1.8} />
              <span className="mobile-nav-label">{item.title}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
