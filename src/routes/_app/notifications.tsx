import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { store, useStoreVersion } from "@/lib/store";
import { DEFAULT_REMINDER_PLAN } from "@/lib/quote-utils";
import type { CrmNotification, NotificationSeverity, NotificationType } from "@/lib/types";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

type ReadFilter = "unread" | "all" | "read";

const typeLabels: Record<NotificationType, string> = {
  alert: "Alert",
  reminder: "Reminder",
  system: "System",
  workflow: "Workflow",
};

const severityLabels: Record<NotificationSeverity, string> = {
  info: "Info",
  warning: "Warning",
  success: "Success",
  critical: "Critical",
};

function severityBadge(severity: NotificationSeverity) {
  if (severity === "critical") return { variant: "destructive" as const };
  if (severity === "success") return { variant: "default" as const };
  if (severity === "warning") return { variant: "secondary" as const };
  return { variant: "outline" as const };
}

function NotificationsPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const notifications = store.notifications();
  const partners = store.partners();
  const reminderRules = store.reminderRules();
  const sync = store.apiSyncStatus();
  const user = store.getUser();
  const canWrite = user?.permissions?.includes("notifications:write") ?? false;

  const [q, setQ] = React.useState("");
  const [readFilter, setReadFilter] = React.useState<ReadFilter>("unread");
  const [type, setType] = React.useState<string>("all");

  const filtered = notifications
    .filter((n) => {
      if (readFilter === "unread") return !n.readAt;
      if (readFilter === "read") return Boolean(n.readAt);
      return true;
    })
    .filter((n) => type === "all" || n.type === type)
    .filter((n) => {
      if (!q) return true;
      const needle = q.toLowerCase();
      return (
        n.title.toLowerCase().includes(needle) ||
        n.message.toLowerCase().includes(needle) ||
        (n.assignedTo ?? "").toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.readAt).length,
    read: notifications.filter((n) => n.readAt).length,
  };
  const criticalCount = notifications.filter((n) => n.severity === "critical").length;
  const warningCount = notifications.filter((n) => n.severity === "warning").length;
  const reminderCount = notifications.filter((n) => n.type === "reminder").length;
  const workflowCount = notifications.filter((n) => n.type === "workflow").length;
  const systemCount = notifications.filter((n) => n.type === "system").length;
  const reminderQuotes = store.quotes().filter((quote) => quote.reminderRules?.length).length;
  const t =
    locale === "es"
      ? {
          title: "Notificaciones",
          subtitle: "Alertas, recordatorios y eventos de flujo generados por el CRM.",
          markAllRead: "Marcar todo como leído",
          unread: "No leídas",
          critical: "Críticas",
          warnings: "Advertencias",
          reminders: "Recordatorios",
          workflow: "Flujo",
          system: "Sistema",
          reminderPlan: "Plan de recordatorios",
          search: "Buscar notificaciones",
          allTypes: "Todos los tipos",
          alertFeed: "Fuente de alertas",
          reminderEngine: "Motor de recordatorios",
          defaultPlan: "Plan por defecto",
          connected: "Conectado",
          offline: "Desconectado",
          openPolicy: "Abrir política de recordatorios",
          backendRead: "El historial de mensajes se está leyendo desde el backend.",
          unknown: "Desconocido",
          unreadCard: "Notificaciones pendientes.",
          criticalCard: "Alertas de alta prioridad.",
          warningsCard: "Recordatorios próximos a vencer.",
          remindersCard: "Eventos de seguimiento de cotizaciones.",
          workflowCard: "Actualizaciones de flujo y progreso de tareas.",
          systemCard: "Avisos del backend o de sincronización.",
          defaultPlanCard: "Reglas de recordatorio por defecto en la base del CRM.",
          alertFeedCopy:
            "Las alertas se muestran desde las notificaciones del CRM y pueden vincularse con empresas, tareas y cotizaciones.",
          reminderEngineCopy:
            "Las cotizaciones usan el plan global, salvo que una cotización lo sobrescriba.",
          defaultPlanCopy:
            "El CRM mantiene una base reutilizable de recordatorios para las cotizaciones.",
          connectedCopy: "Las alertas y recordatorios de notificación se leen desde el backend.",
          offlineCopy: "Usando notificaciones locales de respaldo hasta que la API responda.",
          alertEngineTitle: "Resumen del motor de alertas",
          alertEngineCopy:
            "El CRM mantiene visibles los recordatorios, alertas y eventos de flujo en un solo lugar.",
          policy: "Política",
          typePlaceholder: "Tipo",
          alertsType: "Alertas",
          remindersType: "Recordatorios",
          notification: "Notificación",
          relatedPartner: "Empresa relacionada",
          assignedTo: "Asignado a",
          date: "Fecha",
          noConnected: "No hay notificaciones que coincidan con los filtros.",
          noOffline: "No hay notificaciones disponibles sin conexión.",
          all: "Todas",
          read: "Leídas",
          criticalAlerts: "Alertas críticas",
          days: "días",
          defaultRulesConfigured: "reglas de recordatorio predeterminadas configuradas.",
          quoteRulesApplied: "cotizaciones tienen reglas de recordatorio aplicadas.",
          syncTitle: "Sincronización backend",
          criticalShort: "críticas",
          warningShort: "advertencias",
          reminderShort: "recordatorios",
          quotePolicyShort: "políticas de cotización",
          type: "Tipo",
          severity: "Severidad",
          readAction: "Leída",
          deleteConfirm: "¿Eliminar esta notificación?",
          deleted: "Notificación eliminada.",
        }
      : {
          title: "Notifications",
          subtitle: "Alerts, reminders, and workflow events generated by the CRM.",
          markAllRead: "Mark all read",
          unread: "Unread",
          critical: "Critical",
          warnings: "Warnings",
          reminders: "Reminders",
          workflow: "Workflow",
          system: "System",
          reminderPlan: "Reminder plan",
          search: "Search notifications",
          allTypes: "All types",
          alertFeed: "Alert feed",
          reminderEngine: "Reminder engine",
          defaultPlan: "Default plan",
          connected: "Connected",
          offline: "Offline",
          openPolicy: "Open reminder policy",
          backendRead: "Message history is being read from the backend.",
          unknown: "Unknown",
          unreadCard: "Notifications still waiting.",
          criticalCard: "High-priority alerts.",
          warningsCard: "Due soon reminders.",
          remindersCard: "Quote follow-up events.",
          workflowCard: "Workflow updates and task progress events.",
          systemCard: "Backend or synchronization notices.",
          defaultPlanCard: "Default reminder rules in the CRM baseline.",
          alertFeedCopy:
            "Alerts are surfaced from CRM notifications and can be tied to partners, tasks, and quotes.",
          reminderEngineCopy: "Quote reminders use the global plan unless a quote overrides it.",
          defaultPlanCopy: "The CRM keeps a reusable reminder baseline for quotes.",
          connectedCopy: "Notification alerts and reminders are being read from the backend.",
          offlineCopy: "Using local fallback notifications until the API returns.",
          alertEngineTitle: "Alert engine snapshot",
          alertEngineCopy:
            "The CRM keeps reminders, alerts, and workflow events visible in one place.",
          policy: "Policy",
          typePlaceholder: "Type",
          alertsType: "Alerts",
          remindersType: "Reminders",
          notification: "Notification",
          relatedPartner: "Related partner",
          assignedTo: "Assigned to",
          date: "Date",
          noConnected: "No notifications match the current filters.",
          noOffline: "No notifications are available offline.",
          all: "All",
          read: "Read",
          criticalAlerts: "Critical alerts",
          days: "days",
          defaultRulesConfigured: "default reminder rules configured.",
          quoteRulesApplied: "quotes currently have reminder rules applied.",
          syncTitle: "Backend sync",
          criticalShort: "critical",
          warningShort: "warning",
          reminderShort: "reminders",
          quotePolicyShort: "quote policies",
          type: "Type",
          severity: "Severity",
          readAction: "Read",
          deleteConfirm: "Delete this notification?",
          deleted: "Notification deleted.",
        };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button
          onClick={() => store.markAllNotificationsRead()}
          disabled={!canWrite || counts.unread === 0}
        >
          <CheckCheck className="size-4" /> {t.markAllRead}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.unread}</div>
          <div className="mt-1 text-2xl font-semibold">{counts.unread}</div>
          <div className="text-sm text-muted-foreground">{t.unreadCard}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.critical}</div>
          <div className="mt-1 text-2xl font-semibold">{criticalCount}</div>
          <div className="text-sm text-muted-foreground">{t.criticalCard}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.warnings}</div>
          <div className="mt-1 text-2xl font-semibold">{warningCount}</div>
          <div className="text-sm text-muted-foreground">{t.warningsCard}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.reminders}</div>
          <div className="mt-1 text-2xl font-semibold">{reminderCount}</div>
          <div className="text-sm text-muted-foreground">{t.remindersCard}</div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.workflow}</div>
          <div className="mt-1 text-2xl font-semibold">{workflowCount}</div>
          <div className="text-sm text-muted-foreground">{t.workflowCard}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.system}</div>
          <div className="mt-1 text-2xl font-semibold">{systemCount}</div>
          <div className="text-sm text-muted-foreground">{t.systemCard}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.reminderPlan}
          </div>
          <div className="mt-1 text-2xl font-semibold">{DEFAULT_REMINDER_PLAN.length}</div>
          <div className="text-sm text-muted-foreground">{t.defaultPlanCard}</div>
          <Button
            variant="link"
            className="mt-3 h-auto p-0 text-xs uppercase tracking-wide"
            asChild
          >
            <Link to="/quotes/reminders">{t.policy}</Link>
          </Button>
        </Card>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {[
              { key: "unread", label: t.unread },
              { key: "read", label: t.read },
              { key: "all", label: t.all },
            ].map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={readFilter === item.key ? "default" : "ghost"}
                onClick={() => setReadFilter(item.key as ReadFilter)}
              >
                {item.label}
                <Badge variant="secondary" className="ml-1">
                  {counts[item.key as ReadFilter]}
                </Badge>
              </Button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.search}
                className="w-64 pl-8"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t.typePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                <SelectItem value="alert">{t.alertsType}</SelectItem>
                <SelectItem value="reminder">{t.remindersType}</SelectItem>
                <SelectItem value="workflow">{t.workflow}</SelectItem>
                <SelectItem value="system">{t.system}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-semibold">{t.alertFeed}</div>
          <div className="mt-1 text-sm text-muted-foreground">{t.alertFeedCopy}</div>
          <div className="mt-3 text-xs text-muted-foreground">
            {t.criticalAlerts}: {notifications.filter((n) => n.severity === "critical").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold">{t.reminderEngine}</div>
          <div className="mt-1 text-sm text-muted-foreground">{t.reminderEngineCopy}</div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {reminderRules.slice(0, 3).map((rule) => (
              <div key={rule.id}>
                {rule.label}: {rule.offset} {t.days}, {rule.priority}
              </div>
            ))}
          </div>
          <Link
            to="/quotes/reminders"
            className="mt-3 inline-flex text-xs font-medium uppercase tracking-wide text-primary hover:underline"
          >
            {t.policy}
          </Link>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold">{t.defaultPlan}</div>
          <div className="mt-1 text-sm text-muted-foreground">{t.defaultPlanCopy}</div>
          <div className="mt-3 text-xs text-muted-foreground">
            {DEFAULT_REMINDER_PLAN.length} {t.defaultRulesConfigured}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {reminderQuotes} {t.quoteRulesApplied}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.syncTitle}
            </div>
            <div className="mt-1 text-sm font-medium">
              {sync?.status === "connected" ? t.connected : t.offline}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {sync?.status === "connected" ? t.connectedCopy : (sync?.message ?? t.offlineCopy)}
            </div>
          </div>
          <Badge variant={sync?.status === "connected" ? "default" : "secondary"}>
            {sync?.status === "connected"
              ? t.connected
              : sync?.status === "offline"
                ? t.offline
                : t.unknown}
          </Badge>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t.alertEngineTitle}</div>
            <div className="mt-1 text-sm text-muted-foreground">{t.alertEngineCopy}</div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {criticalCount} {t.criticalShort}
            </span>
            <span>
              {warningCount} {t.warningShort}
            </span>
            <span>
              {reminderCount} {t.reminderShort}
            </span>
            <span>
              {reminderQuotes} {t.quotePolicyShort}
            </span>
            <Button variant="link" className="h-auto p-0 text-xs font-medium text-primary" asChild>
              <Link to="/quotes/reminders">{t.policy}</Link>
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.notification}</TableHead>
              <TableHead>{t.type}</TableHead>
              <TableHead>{t.severity}</TableHead>
              <TableHead>{t.relatedPartner}</TableHead>
              <TableHead>{t.assignedTo}</TableHead>
              <TableHead>{t.date}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((notification) => {
              const partner = notification.partnerId
                ? partners.find((p) => p.id === notification.partnerId)
                : undefined;
              return (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  partnerName={partner?.companyName}
                  canWrite={canWrite}
                  locale={locale}
                  readAction={t.readAction}
                  deleteConfirm={t.deleteConfirm}
                  deleted={t.deleted}
                />
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                  {sync?.status === "connected" ? t.noConnected : t.noOffline}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function NotificationRow({
  notification,
  partnerName,
  canWrite,
  locale,
  readAction,
  deleteConfirm,
  deleted,
}: {
  notification: CrmNotification;
  partnerName?: string;
  canWrite: boolean;
  locale: "en" | "es";
  readAction: string;
  deleteConfirm: string;
  deleted: string;
}) {
  const localizedTypeLabels: Record<NotificationType, string> =
    locale === "es"
      ? {
          alert: "Alerta",
          reminder: "Recordatorio",
          system: "Sistema",
          workflow: "Flujo",
        }
      : typeLabels;
  const localizedSeverityLabels: Record<NotificationSeverity, string> =
    locale === "es"
      ? {
          info: "Info",
          warning: "Advertencia",
          success: "Correcto",
          critical: "Crítica",
        }
      : severityLabels;

  return (
    <TableRow className={notification.readAt ? "opacity-70" : ""}>
      <TableCell>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid size-8 shrink-0 place-content-center rounded-md bg-muted">
            <Bell className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-medium">{notification.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{notification.message}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{localizedTypeLabels[notification.type]}</TableCell>
      <TableCell>
        <Badge {...severityBadge(notification.severity)}>
          {localizedSeverityLabels[notification.severity]}
        </Badge>
      </TableCell>
      <TableCell>
        {notification.partnerId && partnerName ? (
          <Link
            to="/partners/$id"
            params={{ id: notification.partnerId }}
            className="text-primary hover:underline"
          >
            {partnerName}
          </Link>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>{notification.assignedTo ?? "-"}</TableCell>
      <TableCell>{notification.createdAt}</TableCell>
      <TableCell className="text-right space-x-1">
        {canWrite && !notification.readAt && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.markNotificationRead(notification.id)}
          >
            <CheckCheck className="size-4" /> {readAction}
          </Button>
        )}
        {canWrite && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(deleteConfirm)) {
                store.deleteNotification(notification.id);
                toast.success(deleted);
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
