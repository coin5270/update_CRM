import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Ship, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusBadge } from "@/lib/crm-labels";
import { formatMoney, quoteStatusBadge } from "@/lib/quote-utils";
import { store, useStoreVersion } from "@/lib/store";
import { OperationDialog } from "@/components/OperationDialog";

export const Route = createFileRoute("/_app/operations/$id")({
  component: OperationDetail,
});

function OperationDetail() {
  useStoreVersion();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = React.useState(false);
  const locale = store.getLocale();
  const user = store.getUser();
  const canWriteOperations = user?.permissions?.includes("operations:write") ?? false;
  const t =
    locale === "es"
      ? {
          back: "Volver",
          notFound: "Reserva no encontrada.",
          manageBooking: "Gestionar reserva",
          deleteConfirm: "¿Eliminar esta operación?",
          deleted: "Operación eliminada.",
          bookingSummary: "Resumen de reserva",
          route: "Ruta",
          openedAt: "Abierta el",
          closedAt: "Cerrada el",
          revenue: "Ingresos",
          assignedTo: "Asignada a",
          trafficMode: "Modo de tráfico",
          partner: "Empresa",
          open: "Abrir",
          linkedQuote: "Cotización vinculada",
          relatedTasks: "Tareas relacionadas",
          viewQueue: "Ver cola",
          openFollowUps: "Seguimientos abiertos",
          quoteFollowUps: "Seguimientos de cotización",
          noQuoteLinked: "Sin cotización vinculada.",
          openFollowUpsTied: "Seguimientos abiertos vinculados a esta reserva:",
          openQuoteFollowUps: "Seguimientos abiertos de cotización:",
          openFollowUpQueue: "Abrir cola de seguimientos",
          trace: "Trazabilidad",
          traceCopy: "Eventos de historial vinculados a esta reserva.",
          followUpQueue: "Cola de seguimientos",
          followUpQueueCopy: "Seguimientos abiertos aún activos.",
          quoteLink: "Vínculo de cotización",
          linked: "Vinculada",
          none: "Ninguna",
          quoteLinkedCopy: "La operación se puede rastrear hasta una cotización comercial.",
          noQuoteAttached: "Sin cotización comercial adjunta.",
          subject: "Asunto",
          due: "Vence",
          status: "Estado",
          salesperson: "Vendedor",
          noTasksLinked: "No hay tareas vinculadas a esta operación.",
          history: "Historial",
          event: "Evento",
          date: "Fecha",
          actor: "Actor",
          noOperationalHistory: "No hay eventos de historial operativo.",
          active: "Activa",
          completed: "Completada",
          onHold: "En pausa",
          cancelled: "Cancelada",
          air: "Aéreo",
          ocean: "Marítimo",
          road: "Terrestre",
          warehouse: "Depósito",
        }
      : {
          back: "Back",
          notFound: "Booking not found.",
          manageBooking: "Manage booking",
          deleteConfirm: "Delete this operation?",
          deleted: "Operation deleted.",
          bookingSummary: "Booking summary",
          route: "Route",
          openedAt: "Opened at",
          closedAt: "Closed at",
          revenue: "Revenue",
          assignedTo: "Assigned to",
          trafficMode: "Traffic mode",
          partner: "Partner",
          open: "Open",
          linkedQuote: "Linked quote",
          relatedTasks: "Related tasks",
          viewQueue: "View queue",
          openFollowUps: "Open follow-ups",
          quoteFollowUps: "Quote follow-ups",
          noQuoteLinked: "No quote linked.",
          openFollowUpsTied: "Open follow-ups tied to this booking:",
          openQuoteFollowUps: "Open quote follow-ups:",
          openFollowUpQueue: "Open follow-up queue",
          trace: "Trace",
          traceCopy: "History events tied to this booking.",
          followUpQueue: "Follow-up queue",
          followUpQueueCopy: "Open follow-ups still active.",
          quoteLink: "Quote link",
          linked: "Linked",
          none: "None",
          quoteLinkedCopy: "Operation is traceable back to a sales quote.",
          noQuoteAttached: "No sales quote attached.",
          subject: "Subject",
          due: "Due",
          status: "Status",
          salesperson: "Salesperson",
          noTasksLinked: "No tasks linked to this operation.",
          history: "History",
          event: "Event",
          date: "Date",
          actor: "Actor",
          noOperationalHistory: "No operational history events.",
          active: "Active",
          completed: "Completed",
          onHold: "On hold",
          cancelled: "Cancelled",
          air: "Air",
          ocean: "Ocean",
          road: "Road",
          warehouse: "Warehouse",
        };
  const statusLabels = {
    active: t.active,
    completed: t.completed,
    on_hold: t.onHold,
    cancelled: t.cancelled,
  };
  const trafficLabels = {
    air: t.air,
    ocean: t.ocean,
    road: t.road,
    warehouse: t.warehouse,
  };

  const operation = store.operations().find((item) => item.id === id || item.number === id);

  if (!operation) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/operations">
            <ArrowLeft className="size-4" /> {t.back}
          </Link>
        </Button>
        <Card className="p-10 text-center text-sm text-muted-foreground">{t.notFound}</Card>
      </div>
    );
  }

  const partner = store.partner(operation.partnerId);
  const quote = operation.quoteId
    ? store
        .quotes()
        .find((item) => item.id === operation.quoteId || item.number === operation.quoteId)
    : undefined;
  const quoteTasks = quote
    ? store.tasks().filter((task) => task.quoteId === quote.id || task.quoteId === quote.number)
    : [];
  const relatedTasks = store
    .tasks()
    .filter(
      (task) => task.transactionId === operation.id || task.transactionId === operation.number,
    );
  const history = store.historyEvents().filter((event) => event.operationId === operation.id);
  const openTasks = relatedTasks.filter((task) => task.status !== "completed");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/operations">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="size-12 rounded-md bg-primary/10 text-primary grid place-content-center">
            <Ship className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">{operation.number}</h1>
              <span className="text-sm text-muted-foreground">
                {trafficLabels[operation.trafficMode]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge {...statusBadge(operation.status)}>{statusLabels[operation.status]}</Badge>
              {partner && (
                <Link
                  to="/partners/$id"
                  params={{ id: partner.id }}
                  className="text-sm text-primary hover:underline"
                >
                  {partner.companyName}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!canWriteOperations}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" /> {t.manageBooking}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={!canWriteOperations}
            onClick={() => {
              if (confirm(t.deleteConfirm)) {
                store.deleteOperation(operation.id);
                toast.success(t.deleted);
                navigate({ to: "/operations" });
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">{t.bookingSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t.route} value={`${operation.origin} / ${operation.destination}`} />
            <Row label={t.openedAt} value={operation.openedAt} />
            <Row label={t.closedAt} value={operation.closedAt} />
            <Row label={t.revenue} value={formatMoney(operation.revenue, operation.currency)} />
            <Row label={t.assignedTo} value={operation.assignedTo} />
            <Row label={t.trafficMode} value={trafficLabels[operation.trafficMode]} />
            <Row label={t.partner} value={partner?.companyName}>
              {partner && (
                <Link
                  to="/partners/$id"
                  params={{ id: partner.id }}
                  className="text-primary hover:underline"
                >
                  {t.open}
                </Link>
              )}
            </Row>
            <Row label={t.linkedQuote} value={quote?.number}>
              {quote && (
                <Link
                  to="/quotes/$id"
                  params={{ id: quote.id }}
                  className="text-primary hover:underline"
                >
                  {t.open}
                </Link>
              )}
            </Row>
            <Row label={t.relatedTasks} value={String(relatedTasks.length)}>
              {relatedTasks.length > 0 && (
                <Link to="/tasks" search={{}} className="text-primary hover:underline">
                  {t.viewQueue}
                </Link>
              )}
            </Row>
            <Row label={t.openFollowUps} value={String(openTasks.length)} />
            <Row label={t.quoteFollowUps} value={String(quoteTasks.length)} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">{t.linkedQuote}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {quote ? (
              <div className="space-y-2">
                <div className="font-medium">
                  <Link
                    to="/quotes/$id"
                    params={{ id: quote.id }}
                    className="text-primary hover:underline"
                  >
                    {quote.number}
                  </Link>
                </div>
                <div className="text-muted-foreground dark:text-slate-300">{quote.subject}</div>
                <Badge {...quoteStatusBadge(quote.status)}>{quote.status}</Badge>
                <div className="pt-2 text-xs text-muted-foreground dark:text-slate-300">
                  {t.openFollowUpsTied} {relatedTasks.length}
                </div>
                <div className="pt-2 text-xs text-muted-foreground dark:text-slate-300">
                  {t.openQuoteFollowUps} {quoteTasks.length}
                </div>
                <div className="pt-2">
                  <Link to="/tasks" className="text-xs text-primary hover:underline">
                    {t.openFollowUpQueue}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground dark:text-slate-300">{t.noQuoteLinked}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
          <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            {t.trace}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {history.length}
          </div>
          <div className="text-sm text-muted-foreground dark:text-slate-300">{t.traceCopy}</div>
        </Card>
        <Card className="p-4 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
          <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            {t.followUpQueue}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {openTasks.length}
          </div>
          <div className="text-sm text-muted-foreground dark:text-slate-300">
            {t.followUpQueueCopy}
          </div>
        </Card>
        <Card className="p-4 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
          <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            {t.quoteLink}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {quote ? t.linked : t.none}
          </div>
          <div className="text-sm text-muted-foreground dark:text-slate-300">
            {quote ? t.quoteLinkedCopy : t.noQuoteAttached}
          </div>
        </Card>
      </div>

      <Card className="dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <CardHeader>
          <CardTitle className="text-base">{t.relatedTasks}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.subject}</TableHead>
                <TableHead>{t.due}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.salesperson}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/tasks/$id"
                      params={{ id: task.id }}
                      className="text-primary hover:underline dark:text-cyan-300"
                    >
                      {task.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {task.dueDate} {task.dueTime ?? ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.salesperson}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/tasks/$id" params={{ id: task.id }}>
                        {t.open}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {relatedTasks.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground dark:text-slate-300"
                  >
                    {t.noTasksLinked}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <CardHeader>
          <CardTitle className="text-base">{t.history}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.event}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.actor}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      {event.title}
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-slate-300">
                      {event.description}
                    </div>
                  </TableCell>
                  <TableCell>{event.occurredAt}</TableCell>
                  <TableCell>{event.actor}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-10 text-center text-sm text-muted-foreground dark:text-slate-300"
                  >
                    {t.noOperationalHistory}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <OperationDialog open={editOpen} onOpenChange={setEditOpen} initial={operation} />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground dark:text-slate-300">{label}</span>
      <span className="text-right text-slate-900 dark:text-slate-100">{value || "—"}</span>
    </div>
  );
}
