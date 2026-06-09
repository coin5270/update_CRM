import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Plane, Plus, Search, Ship, Truck, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { statusBadge } from "@/lib/crm-labels";
import { formatMoney, quoteStatusBadge } from "@/lib/quote-utils";
import { store, useStoreVersion } from "@/lib/store";
import { OperationDialog } from "@/components/OperationDialog";
import type { Operation, OperationStatus, TrafficMode } from "@/lib/types";
import type { OperationsAnalytics } from "@/lib/api";

export const Route = createFileRoute("/_app/operations")({
  component: OperationsPage,
});

function OperationsPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const operations = store.operations();
  const partners = store.partners();
  const navigate = useNavigate();
  const user = store.getUser();
  const canWriteOperations = user?.permissions?.includes("operations:write") ?? false;
  const [analytics, setAnalytics] = React.useState<OperationsAnalytics | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [mode, setMode] = React.useState<string>("all");

  const filtered = operations
    .filter((operation) => status === "all" || operation.status === (status as OperationStatus))
    .filter((operation) => mode === "all" || operation.trafficMode === (mode as TrafficMode))
    .filter((operation) => {
      if (!q) return true;
      const partner = partners.find((p) => p.id === operation.partnerId);
      const needle = q.toLowerCase();
      return (
        operation.number.toLowerCase().includes(needle) ||
        operation.origin.toLowerCase().includes(needle) ||
        operation.destination.toLowerCase().includes(needle) ||
        (partner?.companyName ?? "").toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));

  const active = operations.filter((operation) => operation.status === "active").length;
  const completed = operations.filter((operation) => operation.status === "completed").length;
  const totalRevenue = operations.reduce((sum, operation) => sum + operation.revenue, 0);
  const linkedQuotes = operations.filter((operation) => operation.quoteId).length;
  const touchedPartners = new Set(operations.map((operation) => operation.partnerId)).size;
  const latestLinkedOperation = operations
    .slice()
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    .find((operation) => operation.quoteId);
  const latestQuote = store
    .quotes()
    .slice()
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];

  React.useEffect(() => {
    void store.operationsAnalytics().then(setAnalytics);
  }, [operations.length]);

  const summary = analytics ?? {
    operation_count: operations.length,
    active_operations: active,
    completed_operations: completed,
    total_revenue: totalRevenue,
    last_operation: operations[0] ?? null,
    operations_by_traffic: Object.entries(
      operations.reduce<Record<string, number>>((acc, operation) => {
        acc[operation.trafficMode] = (acc[operation.trafficMode] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([traffic_mode, count]) => ({ traffic_mode, count })),
    quote_operation_ratio: operations.length
      ? Number((linkedQuotes / Math.max(1, store.quotes().length)).toFixed(2))
      : 0,
    operational_history_count: store
      .historyEvents()
      .filter((event) => event.type === "operation" || Boolean(event.operationId)).length,
    recent_history: store
      .historyEvents()
      .filter((event) => event.type === "operation" || Boolean(event.operationId))
      .slice(0, 5),
  };
  const latestOperationalEvent = summary.recent_history[0] ?? null;
  const openNewOperationDialog = React.useCallback(() => {
    setEditingId(null);
    setOpen(true);
  }, []);
  const openEditOperationDialog = React.useCallback(
    (operationId: string) => {
      navigate({ to: "/operations/$id", params: { id: operationId } });
    },
    [navigate],
  );
  const editing = editingId
    ? (operations.find((operation) => operation.id === editingId) ?? null)
    : null;
  const t =
    locale === "es"
      ? {
          title: "Reservas",
          subtitle: "Actividad de reservas vinculada a cotizaciones y empresas.",
          newBooking: "Nueva reserva",
          active: "Activas",
          completed: "Completadas",
          revenue: "Ingresos registrados",
          ratio: "Relación cotización-reserva",
          coverage: "Cobertura de empresas",
          traffic: "Reservas por tráfico",
          trafficMix: "Mezcla de tráfico",
          noTraffic: "No hay tráfico de reservas registrado.",
          latestBooking: "Última reserva",
          noBookings: "No se encontraron reservas.",
          recentHistory: "Historial reciente de reservas",
          noRecent: "No hay historial reciente.",
          bookingCoverage: "Cobertura de reservas",
          activeVsCompleted: "Activas vs completadas",
          linkedQuotes: "Cotizaciones vinculadas",
          historyEvents: "Eventos de historial",
          operationalHistoryEvents: "eventos de historial operativo",
          opened: "Abierta",
          latestQuoteStatus: "Estado de última cotización",
          noQuotes: "Sin cotizaciones",
          lastLinkedQuote: "Última cotización vinculada",
          noLinkedQuoteLatest: "Sin cotización vinculada en la última operación",
          quoteOperationTrace: "Trazabilidad cotización / operación",
          linkedOperationsAcross: (linked: number, quotes: number) =>
            `${linked} operaciones vinculadas en ${quotes} cotizaciones`,
          traceShortcuts: "Accesos de trazabilidad",
          latestOperationalEvent: "Último evento operativo",
          noLinkedQuote: "Sin cotización vinculada",
          noOperationalHistory: "Sin historial operativo",
          searchOperations: "Buscar operaciones",
          allStatuses: "Todos los estados",
          allTraffic: "Todo el tráfico",
          onHold: "En pausa",
          cancelled: "Canceladas",
          air: "Aéreo",
          ocean: "Marítimo",
          road: "Terrestre",
          warehouse: "Depósito",
          faresBookings: "Tarifas y reservas",
          faresBookingsCopy: "Compara tarifas, avance de ruta y estado de reservas activas.",
          fares: "tarifas",
          noBookingsMatch: "Ninguna reserva coincide.",
          booking: "Reserva",
          assigned: "Asignado",
          manageBooking: "Gestionar reserva",
          openBooking: "Abrir reserva",
          port: "Puerto",
        }
      : {
          title: "Bookings",
          subtitle: "Booking activity linked to quotes and business partners.",
          newBooking: "New booking",
          active: "Active bookings",
          completed: "Completed",
          revenue: "Tracked revenue",
          ratio: "Quote-booking ratio",
          coverage: "Partner coverage",
          traffic: "Bookings by traffic",
          trafficMix: "Traffic mix",
          noTraffic: "No booking traffic recorded.",
          latestBooking: "Latest booking",
          noBookings: "No bookings found.",
          recentHistory: "Recent booking history",
          noRecent: "No recent history.",
          bookingCoverage: "Booking coverage",
          activeVsCompleted: "Active vs completed",
          linkedQuotes: "Linked quotes",
          historyEvents: "History events",
          operationalHistoryEvents: "operational history events",
          opened: "Opened",
          latestQuoteStatus: "Latest quote status",
          noQuotes: "No quotes",
          lastLinkedQuote: "Last linked quote",
          noLinkedQuoteLatest: "No linked quote on latest operation",
          quoteOperationTrace: "Quote / operation trace",
          linkedOperationsAcross: (linked: number, quotes: number) =>
            `${linked} linked operations across ${quotes} quotes`,
          traceShortcuts: "Trace shortcuts",
          latestOperationalEvent: "Latest operational event",
          noLinkedQuote: "No linked quote",
          noOperationalHistory: "No operational history",
          searchOperations: "Search operations",
          allStatuses: "All statuses",
          allTraffic: "All traffic",
          onHold: "On hold",
          cancelled: "Cancelled",
          air: "Air",
          ocean: "Ocean",
          road: "Road",
          warehouse: "Warehouse",
          faresBookings: "Fares & Bookings",
          faresBookingsCopy:
            "Compare fares, route progress, and booking status for active bookings.",
          fares: "fares",
          noBookingsMatch: "No bookings match.",
          booking: "Booking",
          assigned: "Assigned",
          manageBooking: "Manage booking",
          openBooking: "Open booking",
          port: "Port",
        };
  const currency = locale === "es" ? "Tarifas y reservas" : "Fares & Bookings";
  const statusLabels: Record<OperationStatus, string> = {
    active: t.active,
    completed: t.completed,
    on_hold: t.onHold,
    cancelled: t.cancelled,
  };
  const trafficLabels: Record<TrafficMode, string> = {
    air: t.air,
    ocean: t.ocean,
    road: t.road,
    warehouse: t.warehouse,
  };
  const trafficChartData = summary.operations_by_traffic.map((item) => ({
    traffic_mode: trafficLabels[item.traffic_mode as TrafficMode] ?? item.traffic_mode,
    count: item.count,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>
      <div>
        <Button disabled={!canWriteOperations} onClick={openNewOperationDialog}>
          <Plus className="size-4" /> {t.newBooking}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.active}</div>
          <div className="mt-1 text-2xl font-semibold">{summary.active_operations}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.completed}</div>
          <div className="mt-1 text-2xl font-semibold">{summary.completed_operations}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.revenue}</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(summary.total_revenue)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.ratio}</div>
          <div className="mt-1 text-2xl font-semibold">
            {summary.quote_operation_ratio.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {summary.operation_count} {locale === "es" ? "reservas en" : "bookings across"}{" "}
            {store.quotes().length} {locale === "es" ? "cotizaciones" : "quotes"}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.coverage}</div>
          <div className="mt-1 text-2xl font-semibold">{touchedPartners}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {locale === "es"
              ? "Empresas con al menos una reserva vinculada"
              : "Partners with at least one linked booking"}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">{t.traffic}</div>
              <div className="mt-1 text-lg font-semibold">{t.trafficMix}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.operational_history_count} {t.operationalHistoryEvents}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {trafficChartData.length > 0 ? (
              trafficChartData.map((item) => {
                const max = Math.max(...trafficChartData.map((entry) => entry.count), 1);
                const width = `${Math.max(8, Math.round((item.count / max) * 100))}%`;
                return (
                  <div key={item.traffic_mode} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.traffic_mode}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">{t.noTraffic}</div>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-5 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
          <div>
            <div className="text-sm text-muted-foreground dark:text-slate-300">
              {t.latestBooking}
            </div>
            {summary.last_operation ? (
              <div className="mt-3 space-y-2">
                <div className="font-medium text-slate-900 dark:text-slate-50">
                  {summary.last_operation.number}
                </div>
                <div className="text-sm text-muted-foreground dark:text-slate-300">
                  {summary.last_operation.origin} / {summary.last_operation.destination}
                </div>
                <div className="text-xs text-muted-foreground dark:text-slate-300">
                  {t.opened} {summary.last_operation.openedAt}
                </div>
                <Badge {...statusBadge(summary.last_operation.status)}>
                  {statusLabels[summary.last_operation.status]}
                </Badge>
              </div>
            ) : (
              <div className="mt-3 text-sm text-muted-foreground dark:text-slate-300">
                {t.noBookings}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm text-muted-foreground dark:text-slate-300">
              {t.recentHistory}
            </div>
            <div className="mt-3 space-y-3">
              {summary.recent_history.length > 0 ? (
                summary.recent_history.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border p-3 dark:border-white/10 dark:bg-slate-950/80"
                  >
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {event.title}
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-slate-300">
                      {event.description}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground dark:text-slate-300">
                      {event.occurredAt} · {event.actor}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground dark:text-slate-300">
                  {t.noRecent}
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/80">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {t.bookingCoverage}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.activeVsCompleted}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {summary.active_operations} {t.active} / {summary.completed_operations}{" "}
                  {t.completed}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.linkedQuotes}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {linkedQuotes} of {store.quotes().length}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.historyEvents}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {summary.operational_history_count}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.latestQuoteStatus}
                </div>
                <div className="mt-1">
                  {latestQuote ? (
                    <Badge {...quoteStatusBadge(latestQuote.status)} />
                  ) : (
                    <span className="text-sm text-muted-foreground dark:text-slate-300">
                      {t.noQuotes}
                    </span>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.lastLinkedQuote}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {latestLinkedOperation?.quoteId ? (
                    <Link
                      to="/quotes/$id"
                      params={{ id: latestLinkedOperation.quoteId }}
                      className="text-primary hover:underline dark:text-cyan-300"
                    >
                      {latestLinkedOperation.quoteId}
                    </Link>
                  ) : (
                    t.noLinkedQuoteLatest
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.quoteOperationTrace}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t.linkedOperationsAcross(linkedQuotes, store.quotes().length)}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {t.traceShortcuts}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.lastLinkedQuote}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {latestLinkedOperation?.quoteId ? (
                    <Link
                      to="/quotes/$id"
                      params={{ id: latestLinkedOperation.quoteId }}
                      className="text-primary hover:underline dark:text-cyan-300"
                    >
                      {latestLinkedOperation.quoteId}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t.noLinkedQuote}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  {t.latestOperationalEvent}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {latestOperationalEvent ? (
                    latestOperationalEvent.title
                  ) : (
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t.noOperationalHistory}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t.searchOperations}
              className="pl-8"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allStatuses}</SelectItem>
              <SelectItem value="active">{t.active}</SelectItem>
              <SelectItem value="completed">{t.completed}</SelectItem>
              <SelectItem value="on_hold">{t.onHold}</SelectItem>
              <SelectItem value="cancelled">{t.cancelled}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTraffic}</SelectItem>
              <SelectItem value="air">{t.air}</SelectItem>
              <SelectItem value="ocean">{t.ocean}</SelectItem>
              <SelectItem value="road">{t.road}</SelectItem>
              <SelectItem value="warehouse">{t.warehouse}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <section className="rounded-3xl border border-emerald-900/10 bg-emerald-950 p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">{t.faresBookings}</h2>
            <p className="text-xs text-emerald-100/70">{t.faresBookingsCopy}</p>
          </div>
          <Badge className="border-white/20 bg-white/10 text-white" variant="outline">
            {filtered.length} {t.fares}
          </Badge>
        </div>

        <div className="space-y-4">
          {filtered.map((operation, index) => {
            const partner = partners.find((item) => item.id === operation.partnerId);
            return (
              <FareCard
                key={operation.id}
                operation={operation}
                carrierName={partner?.companyName ?? "Prime Shipping Line"}
                carrierIndex={index}
                canWrite={canWriteOperations}
                localeLabels={{
                  statusLabels,
                  trafficLabels,
                  booking: t.booking,
                  opened: t.opened,
                  assigned: t.assigned,
                  manageBooking: t.manageBooking,
                  openBooking: t.openBooking,
                  port: t.port,
                }}
                onEdit={() => openEditOperationDialog(operation.id)}
              />
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-white/20 bg-white/10 py-10 text-center text-sm text-emerald-50">
              {t.noBookingsMatch}
            </div>
          )}
        </div>
      </section>

      <OperationDialog
        key={editingId ?? "new"}
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        defaultPartnerId={editing?.partnerId}
      />
    </div>
  );
}

function FareCard({
  operation,
  carrierName,
  carrierIndex,
  canWrite,
  onEdit,
  localeLabels,
}: {
  operation: Operation;
  carrierName: string;
  carrierIndex: number;
  canWrite: boolean;
  onEdit: () => void;
  localeLabels: {
    statusLabels: Record<OperationStatus, string>;
    trafficLabels: Record<TrafficMode, string>;
    booking: string;
    opened: string;
    assigned: string;
    manageBooking: string;
    openBooking: string;
    port: string;
  };
}) {
  const ModeIcon =
    operation.trafficMode === "air"
      ? Plane
      : operation.trafficMode === "road"
        ? Truck
        : operation.trafficMode === "warehouse"
          ? Warehouse
          : Ship;
  const logoColors = [
    "from-amber-300 to-yellow-500",
    "from-red-500 to-rose-600",
    "from-sky-400 to-cyan-600",
    "from-emerald-400 to-green-600",
  ];

  return (
    <div className="grid gap-4 rounded-[2rem] bg-white px-5 py-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl lg:grid-cols-[80px_minmax(280px,1fr)_180px] lg:items-center">
      <div
        className={`grid size-16 place-content-center rounded-2xl bg-gradient-to-br ${logoColors[carrierIndex % logoColors.length]} text-white shadow-md`}
      >
        <ModeIcon className="size-8" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/operations/$id"
            params={{ id: operation.id }}
            className="text-xl font-bold tracking-tight text-slate-950 hover:text-primary hover:underline"
          >
            {carrierName}
          </Link>
          <Badge {...statusBadge(operation.status)}>
            {localeLabels.statusLabels[operation.status]}
          </Badge>
          <Badge variant="outline">{localeLabels.trafficLabels[operation.trafficMode]}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <RoutePoint label={operation.origin} portLabel={localeLabels.port} />
          <div className="relative h-8">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-slate-300" />
            <CheckCircle2 className="absolute left-0 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white text-emerald-500" />
            <div className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-content-center rounded-full bg-slate-100 text-slate-600 shadow-sm">
              <ModeIcon className="size-5" />
            </div>
            <CheckCircle2 className="absolute right-0 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white text-emerald-500" />
          </div>
          <RoutePoint label={operation.destination} align="right" portLabel={localeLabels.port} />
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            {localeLabels.booking}:{" "}
            <span className="font-semibold text-slate-700">{operation.number}</span>
          </span>
          <span>
            {localeLabels.opened}:{" "}
            <span className="font-semibold text-slate-700">{operation.openedAt}</span>
          </span>
          <span>
            {localeLabels.assigned}:{" "}
            <span className="font-semibold text-slate-700">{operation.assignedTo}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
        <div className="text-2xl font-bold text-slate-950">
          {formatMoney(operation.revenue, operation.currency)}
        </div>
        <div className="mt-0 flex flex-col gap-2 lg:mt-3">
          {canWrite ? (
            <Button className="bg-rose-500 shadow-rose-500/20 hover:bg-rose-600" onClick={onEdit}>
              {localeLabels.manageBooking}
            </Button>
          ) : (
            <Button variant="ghost" className="bg-white/70 hover:bg-white" asChild>
              <a href={`/operations/${operation.id}`}>{localeLabels.openBooking}</a>
            </Button>
          )}
          {canWrite && (
            <Button variant="ghost" className="bg-white/70 hover:bg-white" asChild>
              <a href={`/operations/${operation.id}`}>{localeLabels.openBooking}</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function RoutePoint({
  label,
  align,
  portLabel,
}: {
  label: string;
  align?: "right";
  portLabel: string;
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="text-xs text-muted-foreground">{portLabel}</div>
      <div className="font-bold uppercase text-slate-900">{label}</div>
    </div>
  );
}
