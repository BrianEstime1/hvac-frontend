import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, AlertTriangle, DollarSign, Bell, BellOff } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardStats } from "@shared/schema";

const avatarColors = ["#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const recentInvoices = [...(invoices as any[])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const statCards = [
    {
      label: "Clients",
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: "#0EA5E9",
      bg: "#0EA5E915",
      testId: "text-customer-count",
      link: "/customers",
    },
    {
      label: "Upcoming",
      value: stats?.upcomingAppointments ?? 0,
      icon: Calendar,
      color: "#F59E0B",
      bg: "#F59E0B15",
      testId: "text-appointment-count",
      link: "/appointments",
    },
    {
      label: "Low Stock",
      value: stats?.lowStockItems?.length ?? 0,
      icon: AlertTriangle,
      color: "#EF4444",
      bg: "#EF444415",
      testId: "text-lowstock-count",
      link: "/inventory",
    },
    {
      label: "Unpaid",
      value: `$${((stats?.unpaidTotal ?? 0) / 1000).toFixed(1)}k`,
      icon: DollarSign,
      color: "#10B981",
      bg: "#10B98115",
      testId: "text-unpaid-invoices",
      link: "/invoices",
      subtitle: `${stats?.unpaidCount ?? 0} invoices`,
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid": return { bg: "#10B98115", color: "#10B981" };
      case "sent": return { bg: "#F59E0B15", color: "#F59E0B" };
      default: return { bg: "#64748B15", color: "#64748B" };
    }
  };


  const [notifStatus, setNotifStatus] = useState<'default'|'granted'|'denied'>('default');
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifStatus(Notification.permission as any);
    }
  }, []);

  async function enableNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported on this browser.');
      return;
    }
    setNotifLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission as any);
      if (permission !== 'granted') { setNotifLoading(false); return; }

      const reg = await navigator.serviceWorker.ready;
      // Get VAPID public key from backend
      const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || 'https://hvac-management-api.onrender.com';
      const keyRes = await fetch(apiBase + '/api/push/vapid-public-key');
      const { publicKey } = await keyRes.json();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiRequest('POST', '/api/push/subscribe', sub.toJSON());
      setNotifStatus('granted');
    } catch (e) {
      console.error('Push subscription failed:', e);
    }
    setNotifLoading(false);
  }

  async function disableNotifications() {
    setNotifLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiRequest('POST', '/api/push/unsubscribe', sub.toJSON());
        await sub.unsubscribe();
      }
      setNotifStatus('default');
    } catch (e) {
      console.error('Unsubscribe failed:', e);
    }
    setNotifLoading(false);
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  }

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome,</p>
          <h1 className="text-2xl font-bold text-foreground">FERDAIR</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's your business overview</p>
        </div>
        <button
          onClick={notifStatus === 'granted' ? disableNotifications : enableNotifications}
          disabled={notifLoading || notifStatus === 'denied'}
          title={notifStatus === 'granted' ? 'Notifications on — tap to disable' : notifStatus === 'denied' ? 'Notifications blocked in browser settings' : 'Enable push notifications'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none', cursor: notifStatus === 'denied' ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em',
            background: notifStatus === 'granted' ? '#10B98120' : '#2563eb20',
            color: notifStatus === 'granted' ? '#10B981' : notifStatus === 'denied' ? '#64748B' : '#2563eb',
            transition: 'all 0.2s',
          }}
        >
          {notifStatus === 'granted' ? <Bell style={{width:'14px',height:'14px'}} /> : <BellOff style={{width:'14px',height:'14px'}} />}
          {notifLoading ? '...' : notifStatus === 'granted' ? 'Notifs ON' : notifStatus === 'denied' ? 'Blocked' : 'Enable Notifs'}
        </button>
      </div>

      {/* Stat grid */}
      <div className="mobile-stat-grid">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="mobile-stat-card cursor-pointer"
            style={{ borderColor: `${card.color}30` }}
            onClick={() => setLocation(card.link)}
            data-testid={card.testId}
          >
            <div className="mobile-stat-icon" style={{ background: card.bg }}>
              <card.icon size={16} style={{ color: card.color }} />
            </div>
            <div className="mobile-stat-label">{card.label}</div>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="mobile-stat-value" style={{ color: card.color }}>
                {card.value}
              </div>
            )}
            {card.subtitle && (
              <div className="mobile-stat-meta">{card.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Recent Invoices</h2>
          <button
            className="text-sm font-medium"
            style={{ color: "hsl(var(--primary))" }}
            onClick={() => setLocation("/invoices")}
          >
            See all →
          </button>
        </div>

        <div className="mobile-card-list">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
          ) : recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No invoices yet
            </div>
          ) : (
            recentInvoices.map((inv: any) => {
              const st = getStatusStyle(inv.status);
              return (
                <div
                  key={inv.id}
                  className="mobile-card"
                  onClick={() => setLocation("/invoices")}
                >
                  <div className="mobile-card-top">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="mobile-avatar"
                        style={{ background: `linear-gradient(135deg, ${getColor(inv.customerName || "")}, ${getColor(inv.customerName || "")}99)` }}
                      >
                        {getInitials(inv.customerName || "?")}
                      </div>
                      <div className="min-w-0">
                        <div className="mobile-card-title truncate">{inv.customerName}</div>
                        <div className="mobile-card-date">{inv.date}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="mobile-card-amount">
                        ${Number(inv.labor_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                  {inv.description && (
                    <div className="mobile-card-desc">{inv.description}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {!isLoading && stats?.lowStockItems && stats.lowStockItems.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">⚠️ Low Stock Alert</h2>
          <div className="mobile-card-list">
            {stats.lowStockItems.map((item: any) => (
              <div
                key={item.id}
                className="mobile-card"
                data-testid={`item-lowstock-${item.id}`}
              >
                <div className="mobile-card-top">
                  <div>
                    <div className="mobile-card-title">{item.name}</div>
                    {item.category && (
                      <div className="mobile-card-date">{item.category}</div>
                    )}
                  </div>
                  <Badge variant="destructive" data-testid={`badge-quantity-${item.id}`}>
                    {item.quantity} left
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
