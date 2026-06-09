import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Database,
  Download,
  RefreshCw,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionWarningDialog } from "@/components/PermissionWarningDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { store, useStoreVersion } from "@/lib/store";
import type { ApiConnectionStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/integration")({
  component: IntegrationPage,
});

function IntegrationPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const connections = store.apiConnections();
  const sync = store.apiSyncStatus();
  const user = store.getUser();
  const canWrite = user?.permissions?.includes("integration:write") ?? false;
  const [editing, setEditing] = React.useState<ApiConnectionStatus | null>(null);
  const [syncing, setSyncing] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [warningOpen, setWarningOpen] = React.useState(false);
  const t =
    locale === "es"
      ? {
          title: "Estado de integración",
          subtitle:
            "Preparación de API, fuente de permisos y sincronización con el sistema externo.",
          activeConnections: "Conexiones activas",
          configuredSystems: "Sistemas API configurados.",
          syncMode: "Modo de sincronización",
          currentMode: "Modo de integración actual.",
          backend: "Backend",
          liveBackend: "La interfaz está leyendo datos reales del backend.",
          fallbackBackend: "La interfaz está usando registros de respaldo.",
          connected: "Conectadas",
          degraded: "Degradadas",
          offline: "Sin conexión",
          readyForSync: "Sistemas listos para sincronización.",
          partialCoverage: "Sistemas con cobertura parcial.",
          waitingRecovery: "Sistemas esperando recuperación.",
          apiLayer: "Capa API REST",
          apiLayerCopy: "La interfaz sincroniza desde FastAPI y escribe cambios con bearer auth.",
          permissions: "Permisos",
          permissionsCopy: "Los permisos del usuario se modelan desde el sistema externo.",
          alertEngine: "Motor de alertas",
          alertEngineCopy:
            "Las reglas de recordatorio, notificaciones y automatizaciones tienen recursos backend explícitos.",
          reminderCoverage: "Cobertura de recordatorios y alertas",
          reminderCoverageCopy:
            "La UI expone por separado el plan de recordatorios y el feed de alertas.",
          notifications: "notificaciones",
          backendSync: "Sincronización backend",
          backendSyncCopy:
            "La configuración y cobertura reflejan la sincronización API cuando está conectada.",
          bootstrapped: "La app se inicializó desde el backend y ahora prefiere registros reales.",
          usingFallback: "Usando datos locales de respaldo hasta que el backend responda.",
          settings: "Configuración API SDC Cargo",
          settingsCopy: "Configuración local de integración y simulación de sincronización.",
          save: "Guardar",
          syncNow: "Sincronizar ahora",
          syncing: "Sincronizando",
          saved: "Configuración de integración guardada.",
          syncCompleted: (system: string, partners: number, operations: number) =>
            `${system} sincronizado: ${partners} empresas, ${operations} operaciones.`,
          syncFailed: "La sincronización de integración falló.",
          systemName: "Nombre del sistema",
          tenantKey: "Clave de tenant",
          baseUrl: "URL base",
          permissionsSource: "Fuente de permisos",
          syncModeLabel: "Modo de sincronización",
          connectionStatus: "Estado de conexión",
          apiKeyConfigured: "Clave API configurada",
          apiKeyConfiguredCopy:
            "Indica si las credenciales externas están listas para sincronizar.",
          noConnectionsConnected:
            "No se devolvieron conexiones de integración desde el backend aún.",
          noConnectionsOffline: "No hay conexiones de integración disponibles sin conexión.",
          backupRestore: "Backup y restaurar",
          backupRestoreCopy: "Exporta o restaura datos CRM para despliegues locales.",
          export: "Exportar",
          import: "Importar",
          exportDeniedTitle: "Usuario sin permiso",
          exportDeniedCopy: "Este usuario no tiene permiso para exportar datos CRM.",
          importDeniedCopy: "Este usuario no tiene permiso para restaurar datos CRM.",
          ok: "OK",
          exported: "Datos CRM exportados.",
          exportFailed: "La exportación de CRM falló.",
          imported: "Datos CRM importados.",
          importFailed: "La importación de CRM falló.",
          system: "Sistema",
          base: "URL base",
          status: "Estado",
          lastSync: "Última sincronización",
          permissionsSourceTable: "Fuente de permisos",
          tenant: "Tenant",
          noConnections: "Aún no se configuraron conexiones de integración.",
        }
      : {
          title: "Integration Status",
          subtitle: "API readiness, permission source, and external management system sync.",
          activeConnections: "Active connections",
          configuredSystems: "Configured API systems.",
          syncMode: "Sync mode",
          currentMode: "Current integration mode.",
          backend: "Backend",
          liveBackend: "The frontend is reading live backend data.",
          fallbackBackend: "The frontend is using fallback records.",
          connected: "Connected",
          degraded: "Degraded",
          offline: "Offline",
          readyForSync: "Systems ready for sync.",
          partialCoverage: "Systems with partial coverage.",
          waitingRecovery: "Systems waiting for recovery.",
          apiLayer: "REST API Layer",
          apiLayerCopy: "The frontend syncs from FastAPI and writes changes back with bearer auth.",
          permissions: "Permissions",
          permissionsCopy:
            "User permissions are modeled as coming from the external management system.",
          alertEngine: "Alert Engine",
          alertEngineCopy:
            "Reminder rules, notifications, and automation events are represented in the CRM domain and now have explicit backend resources.",
          reminderCoverage: "Reminder & alert coverage",
          reminderCoverageCopy:
            "The UI now surfaces the default reminder plan and alert feed separately.",
          notifications: "notifications",
          backendSync: "Backend sync",
          backendSyncCopy:
            "Integration settings and coverage reflect live API sync when connected.",
          bootstrapped: "The app has bootstrapped from the backend and now prefers live records.",
          usingFallback: "Using local fallback data until the backend is reachable.",
          settings: "SDC Cargo API Settings",
          settingsCopy: "Local integration configuration and sync simulation.",
          save: "Save",
          syncNow: "Sync now",
          syncing: "Syncing",
          saved: "Integration settings saved.",
          syncCompleted: (system: string, partners: number, operations: number) =>
            `${system} sync completed: ${partners} partners, ${operations} operations.`,
          syncFailed: "Integration sync failed.",
          systemName: "System name",
          tenantKey: "Tenant key",
          baseUrl: "Base URL",
          permissionsSource: "Permissions source",
          syncModeLabel: "Sync mode",
          connectionStatus: "Connection status",
          apiKeyConfigured: "API key configured",
          apiKeyConfiguredCopy:
            "Signals whether the external system credentials are ready for sync.",
          noConnectionsConnected: "No integration connections were returned from the backend yet.",
          noConnectionsOffline: "No integration connections available offline.",
          backupRestore: "Backup & Restore",
          backupRestoreCopy: "Export or restore CRM data for local deployments.",
          export: "Export",
          import: "Import",
          exportDeniedTitle: "Permission required",
          exportDeniedCopy: "This user does not have permission to export CRM data.",
          importDeniedCopy: "This user does not have permission to restore CRM data.",
          ok: "OK",
          exported: "CRM data exported.",
          exportFailed: "CRM export failed.",
          imported: "CRM data imported.",
          importFailed: "CRM import failed.",
          system: "System",
          base: "Base URL",
          status: "Status",
          lastSync: "Last sync",
          permissionsSourceTable: "Permissions source",
          tenant: "Tenant",
          noConnections: "No integration connections have been configured yet.",
        };
  const [warningTitle, setWarningTitle] = React.useState(t.exportDeniedTitle);
  const [warningDescription, setWarningDescription] = React.useState(t.exportDeniedCopy);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setEditing((current) => current ?? connections[0] ?? null);
  }, [connections]);

  const connectedConnections = connections.filter((item) => item.status === "connected").length;
  const degradedConnections = connections.filter((item) => item.status === "degraded").length;
  const offlineConnections = connections.filter((item) => item.status === "offline").length;

  const updateEditing = <K extends keyof ApiConnectionStatus>(
    key: K,
    value: ApiConnectionStatus[K],
  ) => {
    setEditing((current) => (current ? { ...current, [key]: value } : current));
  };

  const showWarning = (title: string, description: string) => {
    setWarningTitle(title);
    setWarningDescription(description);
    setWarningOpen(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.activeConnections}
          </div>
          <div className="mt-1 text-2xl font-semibold">{connections.length}</div>
          <div className="text-sm text-muted-foreground">{t.configuredSystems}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.syncMode}</div>
          <div className="mt-1 text-2xl font-semibold">{editing?.syncMode ?? "simulation"}</div>
          <div className="text-sm text-muted-foreground">{t.currentMode}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.backend}</div>
          <div className="mt-1 text-2xl font-semibold capitalize">{sync?.status ?? "unknown"}</div>
          <div className="text-sm text-muted-foreground">
            {sync?.status === "connected" ? t.liveBackend : t.fallbackBackend}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.connected}</div>
          <div className="mt-1 text-2xl font-semibold">{connectedConnections}</div>
          <div className="text-sm text-muted-foreground">{t.readyForSync}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.degraded}</div>
          <div className="mt-1 text-2xl font-semibold">{degradedConnections}</div>
          <div className="text-sm text-muted-foreground">{t.partialCoverage}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.offline}</div>
          <div className="mt-1 text-2xl font-semibold">{offlineConnections}</div>
          <div className="text-sm text-muted-foreground">{t.waitingRecovery}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.apiLayer}</CardTitle>
            <Database className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t.apiLayerCopy}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.permissions}</CardTitle>
            <ShieldCheck className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t.permissionsCopy}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.alertEngine}</CardTitle>
            <CheckCircle2 className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t.alertEngineCopy}</CardContent>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t.reminderCoverage}</h2>
            <p className="text-sm text-muted-foreground">{t.reminderCoverageCopy}</p>
          </div>
          <Badge variant="secondary">
            {store.notifications().length} {t.notifications}
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {store
            .reminderRules()
            .slice(0, 3)
            .map((rule) => (
              <div key={rule.id} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{rule.label}</div>
                <div className="text-xs text-muted-foreground">
                  {locale === "es"
                    ? `Desfase ${rule.offset} días, prioridad ${rule.priority}`
                    : `Offset ${rule.offset} days, priority ${rule.priority}`}
                </div>
              </div>
            ))}
        </div>
        {sync?.status !== "connected" && (
          <div className="mt-3 text-sm text-muted-foreground">
            After deploying the backend, set `VITE_CRM_API_URL` in Cloudflare to your Render URL.
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t.backendSync}</h2>
            <p className="text-sm text-muted-foreground">{t.backendSyncCopy}</p>
          </div>
          <Badge variant={sync?.status === "connected" ? "default" : "secondary"}>
            {sync?.status ?? "unknown"}
          </Badge>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {sync?.status === "connected" ? t.bootstrapped : (sync?.message ?? t.usingFallback)}
        </div>
      </Card>

      {editing && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{t.settings}</h2>
              <p className="text-sm text-muted-foreground">{t.settingsCopy}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!canWrite}
                onClick={() => {
                  store.upsertApiConnection(editing);
                  setMessage(t.saved);
                }}
              >
                <Save className="size-4" /> {t.save}
              </Button>
              <Button
                disabled={!canWrite || syncing === editing.id}
                onClick={async () => {
                  setSyncing(editing.id);
                  setMessage(null);
                  try {
                    const result = await store.syncApiConnection(editing.id);
                    setMessage(
                      t.syncCompleted(
                        result.system_name,
                        result.imported_partners,
                        result.imported_operations,
                      ),
                    );
                  } catch {
                    setMessage(t.syncFailed);
                  } finally {
                    setSyncing(null);
                  }
                }}
              >
                <RefreshCw className="size-4" /> {syncing === editing.id ? t.syncing : t.syncNow}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t.systemName}</Label>
              <Input
                value={editing.systemName}
                disabled={!canWrite}
                onChange={(event) => updateEditing("systemName", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.tenantKey}</Label>
              <Input
                value={editing.tenantKey}
                disabled={!canWrite}
                onChange={(event) => updateEditing("tenantKey", event.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>{t.baseUrl}</Label>
              <Input
                value={editing.baseUrl}
                disabled={!canWrite}
                onChange={(event) => updateEditing("baseUrl", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.permissionsSource}</Label>
              <Input
                value={editing.permissionsSource}
                disabled={!canWrite}
                onChange={(event) => updateEditing("permissionsSource", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.syncModeLabel}</Label>
              <Select
                value={editing.syncMode ?? "simulation"}
                disabled={!canWrite}
                onValueChange={(value) => updateEditing("syncMode", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simulation">Simulation</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.connectionStatus}</Label>
              <Select
                value={editing.status}
                disabled={!canWrite}
                onValueChange={(value) =>
                  updateEditing("status", value as ApiConnectionStatus["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">{t.connected}</SelectItem>
                  <SelectItem value="degraded">{t.degraded}</SelectItem>
                  <SelectItem value="offline">{t.offline}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">{t.apiKeyConfigured}</div>
                <div className="text-xs text-muted-foreground">{t.apiKeyConfiguredCopy}</div>
              </div>
              <Switch
                checked={editing.apiKeyConfigured ?? false}
                disabled={!canWrite}
                onCheckedChange={(checked) => updateEditing("apiKeyConfigured", checked)}
              />
            </div>
          </div>
          {message && <div className="mt-4 text-sm text-muted-foreground">{message}</div>}
        </Card>
      )}

      {connections.length === 0 && (
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">
            {sync?.status === "connected" ? t.noConnectionsConnected : t.noConnectionsOffline}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t.backupRestore}</h2>
            <p className="text-sm text-muted-foreground">{t.backupRestoreCopy}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (!user?.permissions?.includes("integration:read")) {
                  showWarning(t.exportDeniedTitle, t.exportDeniedCopy);
                  return;
                }
                setMessage(null);
                try {
                  const data = await store.exportData();
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `sales-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                  setMessage(t.exported);
                } catch {
                  setMessage(t.exportFailed);
                }
              }}
            >
              <Download className="size-4" /> {t.export}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!canWrite) {
                  showWarning(t.exportDeniedTitle, t.importDeniedCopy);
                  return;
                }
                fileInputRef.current?.click();
              }}
            >
              <Upload className="size-4" /> {t.import}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  const data = JSON.parse(await file.text()) as Record<string, unknown>;
                  await store.importData(data);
                  setMessage(t.imported);
                } catch {
                  setMessage(t.importFailed);
                }
              }}
            />
          </div>
        </div>
      </Card>

      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{warningTitle}</AlertDialogTitle>
            <AlertDialogDescription>{warningDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t.ok}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.system}</TableHead>
                <TableHead>{t.base}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.lastSync}</TableHead>
                <TableHead>{t.permissionsSourceTable}</TableHead>
                <TableHead>{t.tenant}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection.id} onClick={() => setEditing(connection)}>
                  <TableCell className="font-medium">{connection.systemName}</TableCell>
                  <TableCell className="font-mono text-xs">{connection.baseUrl}</TableCell>
                  <TableCell>
                    <Badge variant={connection.status === "connected" ? "default" : "secondary"}>
                      {connection.status === "connected"
                        ? t.connected
                        : connection.status === "degraded"
                          ? t.degraded
                          : t.offline}
                    </Badge>
                  </TableCell>
                  <TableCell>{connection.lastSyncAt}</TableCell>
                  <TableCell>{connection.permissionsSource}</TableCell>
                  <TableCell>{connection.tenantKey}</TableCell>
                </TableRow>
              ))}
              {connections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {t.noConnections}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
