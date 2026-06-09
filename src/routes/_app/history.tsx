import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { historyTypeLabels } from "@/lib/crm-labels";
import { store, useStoreVersion } from "@/lib/store";
import type { HistoryEventType } from "@/lib/types";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const events = store.historyEvents();
  const partners = store.partners();
  const sync = store.apiSyncStatus();
  const t =
    locale === "es"
      ? {
          title: "Historial comercial",
          subtitle:
            "Auditoría de cambios de registros, estados, cotizaciones, tareas, operaciones, interacciones y automatizaciones.",
          events: "Eventos",
          totalAudit: "Entradas de auditoría.",
          quotes: "Cotizaciones",
          quoteChanges: "Cambios de estado de cotización.",
          tasks: "Seguimientos",
          taskChanges: "Actualizaciones del ciclo de seguimiento.",
          operations: "Operaciones",
          operationChanges: "Cambios de registros operativos.",
          automation: "Automatización",
          automationChanges: "Acciones de flujo generadas automáticamente.",
          partners: "Empresas",
          uniquePartners: "Empresas únicas representadas.",
          backendSync: "Sincronización backend",
          connected: "Conectado",
          offline: "Desconectado",
          unknown: "Desconocido",
          readFromBackend: "El historial se lee desde el backend.",
          localFallback: "Usando historial local de respaldo hasta que la API esté disponible.",
          latestEvent: "Último evento",
          noEvents: "Aún no hay eventos de historial",
          latestQuoteEvent: "Último evento de cotización",
          noQuoteEvents: "No hay eventos de cotización",
          quoteChangesAppear: "Los cambios de cotización aparecen aquí.",
          latestOperationEvent: "Último evento de operación",
          noOperationEvents: "No hay eventos de operación",
          operationChangesAppear: "Los cambios de operación aparecen aquí.",
          traceDepth: "Profundidad de trazabilidad",
          traceDepthText:
            "La auditoría abarca cotizaciones, tareas, operaciones, automatización y actividad de empresas.",
          search: "Buscar historial",
          allTypes: "Todos los tipos de evento",
        }
      : {
          title: "Commercial Audit Trail",
          subtitle:
            "Audit trail for record changes, status transitions, quotes, tasks, operations, interactions, and automations.",
          events: "Events",
          totalAudit: "Total audit entries.",
          quotes: "Quotes",
          quoteChanges: "Quote status changes.",
          tasks: "Tasks",
          taskChanges: "Task lifecycle updates.",
          operations: "Operations",
          operationChanges: "Operational record changes.",
          automation: "Automation",
          automationChanges: "Auto-generated workflow actions.",
          partners: "Partners",
          uniquePartners: "Unique partners represented.",
          backendSync: "Backend sync",
          connected: "Connected",
          offline: "Offline",
          unknown: "Unknown",
          readFromBackend: "History is being read from the backend.",
          localFallback: "Using local fallback history until the API is reachable.",
          latestEvent: "Latest event",
          noEvents: "No history events yet",
          latestQuoteEvent: "Latest quote event",
          noQuoteEvents: "No quote events",
          quoteChangesAppear: "Quote changes appear here.",
          latestOperationEvent: "Latest operation event",
          noOperationEvents: "No operation events",
          operationChangesAppear: "Operation changes appear here.",
          traceDepth: "Trace depth",
          traceDepthText:
            "The audit trail spans quotes, tasks, operations, automation, and partner activity.",
          search: "Search history",
          allTypes: "All event types",
        };

  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<string>("all");

  const filtered = events
    .filter((event) => type === "all" || event.type === (type as HistoryEventType))
    .filter((event) => {
      if (!q) return true;
      const partner = partners.find((p) => p.id === event.partnerId);
      const needle = q.toLowerCase();
      return (
        event.title.toLowerCase().includes(needle) ||
        event.description.toLowerCase().includes(needle) ||
        event.actor.toLowerCase().includes(needle) ||
        (partner?.companyName ?? "").toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const latestEvent = filtered[0] ?? null;
  const quotedEvents = events.filter((event) => event.type === "quote").length;
  const taskEvents = events.filter((event) => event.type === "task").length;
  const operationEvents = events.filter((event) => event.type === "operation").length;
  const automationEvents = events.filter((event) => event.type === "automation").length;
  const touchedPartners = new Set(events.map((event) => event.partnerId).filter(Boolean)).size;
  const latestOperationEvent = filtered.find((event) => event.operationId) ?? null;
  const latestQuoteEvent = filtered.find((event) => event.quoteId) ?? null;

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6 print:hidden">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.events}</div>
          <div className="mt-1 text-2xl font-semibold">{events.length}</div>
          <div className="text-sm text-muted-foreground">{t.totalAudit}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.quotes}</div>
          <div className="mt-1 text-2xl font-semibold">{quotedEvents}</div>
          <div className="text-sm text-muted-foreground">{t.quoteChanges}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.tasks}</div>
          <div className="mt-1 text-2xl font-semibold">{taskEvents}</div>
          <div className="text-sm text-muted-foreground">{t.taskChanges}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.operations}
          </div>
          <div className="mt-1 text-2xl font-semibold">{operationEvents}</div>
          <div className="text-sm text-muted-foreground">{t.operationChanges}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.automation}
          </div>
          <div className="mt-1 text-2xl font-semibold">{automationEvents}</div>
          <div className="text-sm text-muted-foreground">{t.automationChanges}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.partners}</div>
          <div className="mt-1 text-2xl font-semibold">{touchedPartners}</div>
          <div className="text-sm text-muted-foreground">{t.uniquePartners}</div>
        </Card>
      </div>

      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.backendSync}
            </div>
            <div className="mt-1 text-sm font-medium">
              {sync?.status === "connected" ? t.connected : t.offline}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {sync?.status === "connected"
                ? t.readFromBackend
                : (sync?.message ?? t.localFallback)}
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

      <Card className="p-4 print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.latestEvent}
            </div>
            <div className="mt-1 text-sm font-medium">
              {latestEvent ? latestEvent.title : t.noEvents}
            </div>
          </div>
          {latestEvent && (
            <Badge variant="outline" className="capitalize">
              {latestEvent.type}
            </Badge>
          )}
        </div>
        {latestEvent && (
          <div className="mt-2 text-sm text-muted-foreground">
            {latestEvent.description} {latestEvent.occurredAt}.
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3 print:hidden">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.latestQuoteEvent}
          </div>
          <div className="mt-1 text-sm font-medium">
            {latestQuoteEvent ? latestQuoteEvent.title : t.noQuoteEvents}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {latestQuoteEvent ? latestQuoteEvent.description : t.quoteChangesAppear}
          </div>
          {latestQuoteEvent?.quoteId && (
            <Link
              to="/quotes/$id"
              params={{ id: latestQuoteEvent.quoteId }}
              className="mt-3 inline-flex text-xs font-medium uppercase tracking-wide text-primary hover:underline"
            >
              {locale === "es" ? "Abrir cotización" : "Open quote"}
            </Link>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.latestOperationEvent}
          </div>
          <div className="mt-1 text-sm font-medium">
            {latestOperationEvent ? latestOperationEvent.title : t.noOperationEvents}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {latestOperationEvent ? latestOperationEvent.description : t.operationChangesAppear}
          </div>
          {latestOperationEvent?.operationId && (
            <Link
              to="/operations/$id"
              params={{ id: latestOperationEvent.operationId }}
              className="mt-3 inline-flex text-xs font-medium uppercase tracking-wide text-primary hover:underline"
            >
              {locale === "es" ? "Abrir operación" : "Open operation"}
            </Link>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.traceDepth}
          </div>
          <div className="mt-1 text-sm font-medium">
            {touchedPartners} {locale === "es" ? "empresas tocadas" : "partners touched"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{t.traceDepthText}</div>
        </Card>
      </div>

      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t.search}
              className="pl-8"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t.allTypes} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTypes}</SelectItem>
              <SelectItem value="created">{locale === "es" ? "Creado" : "Created"}</SelectItem>
              <SelectItem value="status_change">
                {locale === "es" ? "Cambios de estado" : "Status changes"}
              </SelectItem>
              <SelectItem value="quote">{locale === "es" ? "Cotizaciones" : "Quotes"}</SelectItem>
              <SelectItem value="task">{locale === "es" ? "Seguimientos" : "Tasks"}</SelectItem>
              <SelectItem value="operation">
                {locale === "es" ? "Operaciones" : "Operations"}
              </SelectItem>
              <SelectItem value="interaction">
                {locale === "es" ? "Interacciones" : "Interactions"}
              </SelectItem>
              <SelectItem value="automation">
                {locale === "es" ? "Automatizaciones" : "Automations"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="print:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{locale === "es" ? "Evento" : "Event"}</TableHead>
              <TableHead>{locale === "es" ? "Empresa" : "Partner"}</TableHead>
              <TableHead>{locale === "es" ? "Tipo" : "Type"}</TableHead>
              <TableHead>{locale === "es" ? "Fecha" : "Date"}</TableHead>
              <TableHead>{locale === "es" ? "Autor" : "Actor"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((event) => {
              const partner = partners.find((p) => p.id === event.partnerId);
              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid size-8 shrink-0 place-content-center rounded-md bg-muted">
                        <History className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-muted-foreground">{event.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner ? (
                      <Link
                        to="/partners/$id"
                        params={{ id: partner.id }}
                        className="text-primary hover:underline"
                      >
                        {partner.companyName}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{historyTypeLabels[event.type]}</Badge>
                  </TableCell>
                  <TableCell>{event.occurredAt}</TableCell>
                  <TableCell>{event.actor}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {sync?.status === "connected"
                    ? locale === "es"
                      ? "El backend no devolvió eventos de historial que coincidan."
                      : "No matching history events were returned from the backend."
                    : locale === "es"
                      ? "No hay eventos de historial coincidentes disponibles sin conexión."
                      : "No matching history events available offline."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
