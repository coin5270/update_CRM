import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Pencil, Play, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { AutomationDialog } from "@/components/AutomationDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { automationStatusLabels, statusBadge } from "@/lib/crm-labels";
import { store, useStoreVersion } from "@/lib/store";
import type { AutomationEvent } from "@/lib/types";

export const Route = createFileRoute("/_app/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const automations = store.automations();
  const sync = store.apiSyncStatus();
  const user = store.getUser();
  const canRun = user?.permissions?.includes("automations:write") ?? false;
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AutomationEvent | null>(null);
  const enabled = automations.filter((automation) => automation.status === "enabled").length;
  const paused = automations.filter((automation) => automation.status === "paused").length;
  const failed = automations.filter((automation) => automation.status === "failed").length;
  const reminderCount = store
    .notifications()
    .filter((notification) => notification.type === "reminder").length;
  const alertCount = store
    .notifications()
    .filter((notification) => notification.type === "alert").length;
  const workflowCount = store
    .notifications()
    .filter((notification) => notification.type === "workflow").length;
  const t =
    locale === "es"
      ? {
          title: "Automatizaciones CRM",
          subtitle: "Generación automática de tareas, recordatorios, flujos y alertas.",
          running: "Ejecutando",
          runNow: "Ejecutar ahora",
          enabled: "Habilitadas",
          paused: "Pausadas",
          failed: "Fallidas",
          reminders: "Recordatorios",
          alerts: "Alertas",
          workflows: "Flujos",
          backendSync: "Sincronización backend",
          connected: "Conectado",
          offline: "Desconectado",
          unknown: "Desconocido",
          automation: "Automatización",
          trigger: "Disparador",
          action: "Acción",
          status: "Estado",
          lastRun: "Última ejecución",
          nextRun: "Próxima ejecución",
          resume: "Reanudar",
          pause: "Pausar",
          edit: "Editar",
          noRulesBackend: "Aún no se devolvieron reglas de automatización desde el backend.",
          noRulesOffline: "No hay reglas de automatización disponibles sin conexión.",
          runSummaryFailed: "La ejecución de automatizaciones falló.",
          enabledCopy: "Listas para generar recordatorios y alertas.",
          pausedCopy: "Reglas suspendidas temporalmente.",
          failedCopy: "Reglas que requieren atención.",
          remindersCopy: "Notificaciones de recordatorio actualmente en cola.",
          alertsCopy: "Alertas críticas y de advertencia generadas por automatización.",
          workflowsCopy: "Notificaciones de flujo generadas por automatización.",
          backendRead: "Las reglas de automatización se están leyendo desde el backend.",
          offlineCopy: "Usando reglas locales de respaldo hasta que responda la API.",
          deleteConfirm: "¿Eliminar esta automatización?",
          deleted: "Automatización eliminada.",
        }
      : {
          title: "CRM Automations",
          subtitle: "Automatic task, reminder, workflow, and alert generation.",
          running: "Running",
          runNow: "Run now",
          enabled: "Enabled",
          paused: "Paused",
          failed: "Failed",
          reminders: "Reminders",
          alerts: "Alerts",
          workflows: "Workflows",
          backendSync: "Backend sync",
          connected: "Connected",
          offline: "Offline",
          unknown: "Unknown",
          automation: "Automation",
          trigger: "Trigger",
          action: "Action",
          status: "Status",
          lastRun: "Last run",
          nextRun: "Next run",
          resume: "Resume",
          pause: "Pause",
          edit: "Edit",
          noRulesBackend: "No automation rules were returned from the backend yet.",
          noRulesOffline: "No automation rules available offline.",
          runSummaryFailed: "Automation run failed.",
          enabledCopy: "Ready to generate reminders and alerts.",
          pausedCopy: "Temporarily suspended rules.",
          failedCopy: "Rules needing attention.",
          remindersCopy: "Reminder notifications currently in the queue.",
          alertsCopy: "Critical and warning alerts surfaced by automation.",
          workflowsCopy: "Automation-driven workflow notifications.",
          backendRead: "Automation rules are being read from the backend.",
          offlineCopy: "Using local fallback automation rules until the API returns.",
          deleteConfirm: "Delete this automation?",
          deleted: "Automation deleted.",
        };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {canRun && (
          <Button
            onClick={async () => {
              setRunning(true);
              setResult(null);
              try {
                const summary = await store.runAutomations();
                setResult(
                  `${summary.created_tasks} tasks, ${summary.created_notifications} notifications, ${summary.created_history} history events`,
                );
              } catch {
                setResult(t.runSummaryFailed);
              } finally {
                setRunning(false);
              }
            }}
            disabled={running}
          >
            <Play className="size-4" /> {running ? t.running : t.runNow}
          </Button>
        )}
      </div>
      {result && <div className="text-sm text-muted-foreground">{result}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.enabled}</div>
          <div className="mt-1 text-2xl font-semibold">{enabled}</div>
          <div className="mt-2 text-xs text-muted-foreground">{t.enabledCopy}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.paused}</div>
          <div className="mt-1 text-2xl font-semibold">{paused}</div>
          <div className="mt-2 text-xs text-muted-foreground">{t.pausedCopy}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.failed}</div>
          <div className="mt-1 text-2xl font-semibold">{failed}</div>
          <div className="mt-2 text-xs text-muted-foreground">{t.failedCopy}</div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.reminders}</div>
          <div className="mt-1 text-2xl font-semibold">{reminderCount}</div>
          <div className="text-sm text-muted-foreground">{t.remindersCopy}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.alerts}</div>
          <div className="mt-1 text-2xl font-semibold">{alertCount}</div>
          <div className="text-sm text-muted-foreground">{t.alertsCopy}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.workflows}</div>
          <div className="mt-1 text-2xl font-semibold">{workflowCount}</div>
          <div className="text-sm text-muted-foreground">{t.workflowsCopy}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.backendSync}
            </div>
            <div className="mt-1 text-sm font-medium">
              {sync?.status === "connected" ? t.connected : t.offline}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {sync?.status === "connected" ? t.backendRead : (sync?.message ?? t.offlineCopy)}
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.automation}</TableHead>
              <TableHead>{t.trigger}</TableHead>
              <TableHead>{t.action}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.lastRun}</TableHead>
              <TableHead>{t.nextRun}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {automations.map((automation) => (
              <TableRow key={automation.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-content-center rounded-md bg-muted">
                      <Zap className="size-4 text-muted-foreground" />
                    </div>
                    <div className="font-medium">{automation.name}</div>
                  </div>
                </TableCell>
                <TableCell>{automation.trigger}</TableCell>
                <TableCell>{automation.action}</TableCell>
                <TableCell>
                  <Badge {...statusBadge(automation.status)}>
                    {automationStatusLabels[automation.status]}
                  </Badge>
                </TableCell>
                <TableCell>{automation.lastRunAt}</TableCell>
                <TableCell>{automation.nextRunAt ?? "-"}</TableCell>
                <TableCell className="text-right space-x-1">
                  {canRun && (
                    <>
                      {automation.status === "paused" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            store.upsertAutomation({ ...automation, status: "enabled" })
                          }
                        >
                          <Play className="size-4" /> {t.resume}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            store.upsertAutomation({ ...automation, status: "paused" })
                          }
                        >
                          <Pause className="size-4" /> {t.pause}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(automation);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="size-4" /> {t.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(t.deleteConfirm)) {
                            store.deleteAutomation(automation.id);
                            toast.success(t.deleted);
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {automations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {sync?.status === "connected" ? t.noRulesBackend : t.noRulesOffline}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <AutomationDialog open={editOpen} onOpenChange={setEditOpen} initial={editing} />
    </div>
  );
}
