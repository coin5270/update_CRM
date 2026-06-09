import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileClock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { store, useStoreVersion } from "@/lib/store";
import type { AuditEvent } from "@/lib/types";

export const Route = createFileRoute("/_app/audit")({
  component: AuditPage,
});

function AuditPage() {
  useStoreVersion();
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const locale = store.getLocale();
  const t =
    locale === "es"
      ? {
          title: "Registro de auditoría",
          subtitle: "Trazabilidad de seguridad y cambios para acciones del backend.",
          refresh: "Actualizar",
          refreshing: "Actualizando",
          events: "Eventos",
          actors: "Actores",
          resources: "Recursos",
          action: "Acción",
          resource: "Recurso",
          actor: "Actor",
          when: "Cuándo",
          details: "Detalles",
          system: "Sistema",
          tracked: "Acciones del backend rastreadas.",
          involved: "Usuarios o servicios involucrados.",
          distinct: "Destinos de auditoría distintos.",
          noEvents: "Aún no se devolvieron eventos de auditoría desde el backend.",
        }
      : {
          title: "Audit Log",
          subtitle: "Security and change trail for backend actions.",
          refresh: "Refresh",
          refreshing: "Refreshing",
          events: "Events",
          actors: "Actors",
          resources: "Resources",
          action: "Action",
          resource: "Resource",
          actor: "Actor",
          when: "When",
          details: "Details",
          system: "System",
          tracked: "Tracked backend actions.",
          involved: "Users or services involved.",
          distinct: "Distinct audit targets.",
          noEvents: "No audit events were returned from the backend yet.",
        };

  const load = React.useCallback(async () => {
    setLoading(true);
    const next = await store.auditEvents();
    setEvents(next);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);
  const actorCount = new Set(events.map((event) => event.actorEmail ?? "system")).size;
  const resourceCount = new Set(events.map((event) => event.resource)).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="size-4" /> {loading ? t.refreshing : t.refresh}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.events}</div>
          <div className="mt-1 text-2xl font-semibold">{events.length}</div>
          <div className="text-sm text-muted-foreground">{t.tracked}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.actors}</div>
          <div className="mt-1 text-2xl font-semibold">{actorCount}</div>
          <div className="text-sm text-muted-foreground">{t.involved}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.resources}</div>
          <div className="mt-1 text-2xl font-semibold">{resourceCount}</div>
          <div className="text-sm text-muted-foreground">{t.distinct}</div>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.action}</TableHead>
              <TableHead>{t.resource}</TableHead>
              <TableHead>{t.actor}</TableHead>
              <TableHead>{t.when}</TableHead>
              <TableHead>{t.details}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileClock className="size-4 text-muted-foreground" />
                    <Badge variant="secondary">{event.action}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{event.resource}</div>
                  <div className="text-xs text-muted-foreground">{event.resourceId ?? "-"}</div>
                </TableCell>
                <TableCell>{event.actorEmail ?? t.system}</TableCell>
                <TableCell>{event.occurredAt}</TableCell>
                <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                  {Object.keys(event.details).length ? JSON.stringify(event.details) : "-"}
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {t.noEvents}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
