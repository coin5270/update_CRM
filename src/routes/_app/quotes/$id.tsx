import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BellPlus,
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
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
import { store, useStoreVersion } from "@/lib/store";
import { QuoteDialog } from "@/components/QuoteDialog";
import { SalesEventDialog } from "@/components/SalesEventDialog";
import { SalesEventTimeline } from "@/components/SalesEventTimeline";
import { TaskDialog } from "@/components/TaskDialog";
import {
  formatMoney,
  effectiveReminderRules,
  generateFollowUpTasks,
  isQuoteExpired,
  quoteStatusBadge,
} from "@/lib/quote-utils";
import { priorityBadge, statusBadge } from "@/lib/task-utils";
import type { QuoteStatus, SalesTask } from "@/lib/types";

export const Route = createFileRoute("/_app/quotes/$id")({
  component: QuoteDetail,
});

function QuoteDetail() {
  useStoreVersion();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const quote = store.quote(id);
  const user = store.getUser();
  const locale = store.getLocale();
  const canWriteQuotes = user?.permissions?.includes("quotes:write") ?? false;
  const canWriteTasks = user?.permissions?.includes("tasks:write") ?? false;

  const [editOpen, setEditOpen] = React.useState(false);
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<SalesTask | null>(null);
  const [eventOpen, setEventOpen] = React.useState(false);
  const t =
    locale === "es"
      ? {
          back: "Volver",
          notFound: "Cotización no encontrada.",
          expired: "Vencida",
          markWon: "Marcar ganada",
          markLost: "Marcar perdida",
          markExpired: "Marcar vencida",
          generateReminders: "Generar recordatorios",
          newEvent: "Nuevo evento",
          edit: "Editar",
          deleteConfirm: "¿Eliminar esta cotización?",
          deleted: "Cotización eliminada.",
          wonToast: "Cotización marcada como ganada y operación creada o actualizada.",
          lostToast: "Cotización marcada como perdida.",
          expiredToast: "Cotización marcada como vencida.",
          remindersCreated: (n: number) =>
            `Se crearon ${n} recordatorio${n > 1 ? "s" : ""} de seguimiento.`,
          noReminders: "No hay nuevos recordatorios para crear.",
          lineItems: "Líneas",
          description: "Descripción",
          qty: "Cant.",
          unitPrice: "Precio unitario",
          subtotal: "Subtotal",
          total: "Total",
          notes: "Notas",
          details: "Detalles",
          partner: "Empresa",
          contact: "Contacto",
          salesperson: "Vendedor",
          status: "Estado",
          openTasks: "Seguimientos abiertos",
          queue: "Cola",
          operation: "Operación",
          yes: "Sí",
          no: "No",
          currency: "Moneda",
          issued: "Emitida",
          validUntil: "Válida hasta",
          timeline: "Cronología de eventos de la cotización",
          eventTimeline: "Cronología de eventos de la cotización",
          followUps: "Seguimientos",
          tasksAttached: "Seguimientos vinculados a esta cotización.",
          stillActive: "Aún activos en la cola de seguimientos.",
          salesResult: "Resultado comercial",
          wonCopy: "Las oportunidades ganadas generan un registro operativo.",
          lostCopy: "Las oportunidades perdidas permanecen en el CRM para trazabilidad.",
          expiredCopy: "Las oportunidades vencidas aún pueden revisarse y reabrirse.",
          activeCopy: "La oportunidad sigue activa.",
          reminderFeed: "Fuente de recordatorios",
          alertsTied: "Alertas vinculadas a esta cotización.",
          reminderPlan: "Plan de recordatorios",
          defaultPlan: "Predeterminado",
          overrideCopy:
            "Los recordatorios específicos de esta cotización reemplazan la base global.",
          defaultCopy: "Usa la base global de recordatorios del CRM.",
          reminderSource: "Fuente de recordatorios",
          rules: "reglas",
          ownOverride: "Esta cotización usa su propia sobrescritura de recordatorios.",
          inheritsGlobal: "Esta cotización hereda la configuración global de recordatorios.",
          openReminderSettings: "Abrir configuración de recordatorios",
          reminderStatus: "Estado de recordatorios",
          due: "Vencido",
          closed: "Cerrado",
          active: "Activo",
          overdueCopy: "Esta cotización está vencida y debe recibir seguimiento.",
          wonReminderCopy: "Las cotizaciones ganadas ya no generan recordatorios activos.",
          activeReminderCopy: "Los recordatorios siguen activos hasta que la cotización se cierre.",
          relatedTasks: "Seguimientos relacionados",
          newTask: "Nuevo seguimiento",
          subject: "Asunto",
          dueLabel: "Vence",
          priority: "Prioridad",
          noTasks: "Aún no hay seguimientos vinculados.",
          open: "Abrir",
        }
      : {
          back: "Back",
          notFound: "Quote not found.",
          expired: "Expired",
          markWon: "Mark won",
          markLost: "Mark lost",
          markExpired: "Mark expired",
          generateReminders: "Generate reminders",
          newEvent: "New event",
          edit: "Edit",
          deleteConfirm: "Delete this quote?",
          deleted: "Quote deleted.",
          wonToast: "Quote marked won and an operation was created or updated.",
          lostToast: "Quote marked lost.",
          expiredToast: "Quote marked expired.",
          remindersCreated: (n: number) => `Created ${n} follow-up reminder${n > 1 ? "s" : ""}.`,
          noReminders: "No new reminders to create.",
          lineItems: "Line items",
          description: "Description",
          qty: "Qty",
          unitPrice: "Unit price",
          subtotal: "Subtotal",
          total: "Total",
          notes: "Notes",
          details: "Details",
          partner: "Partner",
          contact: "Contact",
          salesperson: "Salesperson",
          status: "Status",
          openTasks: "Open follow-ups",
          queue: "Queue",
          operation: "Operation",
          yes: "Yes",
          no: "No",
          currency: "Currency",
          issued: "Issued",
          validUntil: "Valid until",
          timeline: "Quote event timeline",
          eventTimeline: "Quote event timeline",
          followUps: "Follow-ups",
          tasksAttached: "Follow-ups attached to this quote.",
          stillActive: "Still active in the follow-up queue.",
          salesResult: "Sales result",
          wonCopy: "Won opportunities generate an operational record.",
          lostCopy: "Lost opportunities remain in the CRM for traceability.",
          expiredCopy: "Expired opportunities can still be reviewed and reopened.",
          activeCopy: "The opportunity is still active.",
          reminderFeed: "Reminder feed",
          alertsTied: "Alerts tied to this quote.",
          reminderPlan: "Reminder plan",
          defaultPlan: "Default",
          overrideCopy: "Quote-specific reminders override the global baseline.",
          defaultCopy: "Uses the default reminder baseline from the CRM.",
          reminderSource: "Reminder source",
          rules: "rules",
          ownOverride: "This quote is using its own reminder override.",
          inheritsGlobal: "This quote inherits the global reminder settings.",
          openReminderSettings: "Open reminder settings",
          reminderStatus: "Reminder status",
          due: "Due",
          closed: "Closed",
          active: "Active",
          overdueCopy: "This quote is overdue and should be followed up.",
          wonReminderCopy: "Won quotes no longer generate active follow-up reminders.",
          activeReminderCopy: "Follow-up reminders remain active until the quote closes.",
          relatedTasks: "Related follow-ups",
          newTask: "New follow-up",
          subject: "Subject",
          dueLabel: "Due",
          priority: "Priority",
          noTasks: "No follow-ups linked yet.",
          open: "Open",
        };

  if (!quote) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/quotes">
            <ArrowLeft className="size-4" /> {t.back}
          </Link>
        </Button>
        <Card className="p-10 text-center text-sm text-muted-foreground">{t.notFound}</Card>
      </div>
    );
  }

  const partner = store.partner(quote.partnerId);
  const contact = quote.contactId
    ? store.contacts().find((c) => c.id === quote.contactId)
    : undefined;
  const operation = store
    .operations()
    .find((item) => item.quoteId === quote.id || item.quoteId === quote.number);
  const relatedTasks = store
    .tasks()
    .filter((t) => t.quoteId === quote.id || t.quoteId === quote.number);
  const openTasks = relatedTasks.filter((task) => task.status !== "completed");
  const relatedNotifications = store
    .notifications()
    .filter(
      (notification) => notification.quoteId === quote.id || notification.quoteId === quote.number,
    );
  const reminderNotifications = relatedNotifications.filter((n) => n.type === "reminder");
  const effectiveRules = effectiveReminderRules(quote);
  const expired = isQuoteExpired(quote);
  const closed = quote.status === "won" || quote.status === "lost" || quote.status === "expired";
  const recordSalesResult = (status: Extract<QuoteStatus, "won" | "lost" | "expired">) => {
    store.upsertQuote({ ...quote, status });
    if (status === "won") {
      toast.success(t.wonToast);
    } else if (status === "lost") {
      toast.info(t.lostToast);
    } else {
      toast.info(t.expiredToast);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/quotes">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="size-12 rounded-md bg-primary/10 text-primary grid place-content-center">
            <FileText className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">{quote.subject}</h1>
              <span className="text-sm text-muted-foreground font-mono">{quote.number}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge {...quoteStatusBadge(quote.status)} />
              {expired && (
                <Badge variant="outline" className="text-destructive border-destructive/40">
                  {t.expired}
                </Badge>
              )}
              {partner && (
                <Link
                  to="/partners/$id"
                  params={{ id: partner.id }}
                  className="text-sm text-primary hover:underline"
                >
                  {partner.companyName}
                </Link>
              )}
              {contact && (
                <Link
                  to="/contacts/$id"
                  params={{ id: contact.id }}
                  className="text-sm text-primary hover:underline"
                >
                  {contact.firstName} {contact.lastName}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!closed && (
            <>
              <Button
                variant="outline"
                disabled={!canWriteQuotes}
                onClick={() => recordSalesResult("won")}
              >
                <CheckCircle2 className="size-4" /> {t.markWon}
              </Button>
              <Button
                variant="outline"
                disabled={!canWriteQuotes}
                onClick={() => recordSalesResult("lost")}
              >
                <XCircle className="size-4" /> {t.markLost}
              </Button>
            </>
          )}
          {expired && quote.status !== "expired" && (
            <Button
              variant="outline"
              disabled={!canWriteQuotes}
              onClick={() => recordSalesResult("expired")}
            >
              {t.markExpired}
            </Button>
          )}
          <Button
            variant="outline"
            disabled={!canWriteTasks}
            onClick={() => {
              const n = generateFollowUpTasks(quote);
              toast[n > 0 ? "success" : "info"](n > 0 ? t.remindersCreated(n) : t.noReminders);
            }}
          >
            <BellPlus className="size-4" /> {t.generateReminders}
          </Button>
          <Button variant="outline" disabled={!canWriteTasks} onClick={() => setEventOpen(true)}>
            {t.newEvent}
          </Button>
          <Button variant="outline" disabled={!canWriteQuotes} onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> {t.edit}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive"
            disabled={!canWriteQuotes}
            onClick={() => {
              if (confirm(t.deleteConfirm)) {
                store.deleteQuote(quote.id);
                toast.success(t.deleted);
                navigate({ to: "/quotes" });
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t.lineItems}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.description}</TableHead>
                  <TableHead className="w-24 text-right">{t.qty}</TableHead>
                  <TableHead className="w-32 text-right">{t.unitPrice}</TableHead>
                  <TableHead className="w-32 text-right">{t.subtotal}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.description || "—"}</TableCell>
                    <TableCell className="text-right">{l.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(l.unitPrice, quote.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(l.quantity * l.unitPrice, quote.currency)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    {t.total}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(quote.amount, quote.currency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {quote.notes && (
              <div className="mt-4 text-sm">
                <div className="text-muted-foreground mb-1">{t.notes}</div>
                <p className="whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
            <Row
              label={t.contact}
              value={contact ? `${contact.firstName} ${contact.lastName}` : "—"}
            >
              {contact && (
                <Link
                  to="/contacts/$id"
                  params={{ id: contact.id }}
                  className="text-primary hover:underline"
                >
                  {t.open}
                </Link>
              )}
            </Row>
            <Row label={t.salesperson} value={quote.salesperson} />
            <Row label={t.status} value={quote.status} />
            <Row label={t.openTasks} value={String(openTasks.length)}>
              <Link to="/tasks" className="text-primary hover:underline">
                {t.queue}
              </Link>
            </Row>
            <Row label={t.operation} value={operation?.number ?? "—"}>
              {operation && (
                <Link
                  to="/operations/$id"
                  params={{ id: operation.id }}
                  className="text-primary hover:underline"
                >
                  {t.open}
                </Link>
              )}
            </Row>
            <Row label={t.expired} value={expired ? t.yes : t.no} />
            <Row label={t.currency} value={quote.currency} />
            <Row label={t.issued} value={quote.issueDate} />
            <Row label={t.validUntil} value={quote.validUntil} />
          </CardContent>
        </Card>
      </div>

      <SalesEventTimeline partnerId={quote.partnerId} title={t.eventTimeline} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.followUps}</div>
          <div className="mt-1 text-2xl font-semibold">{relatedTasks.length}</div>
          <div className="text-sm text-muted-foreground">{t.tasksAttached}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.openTasks}</div>
          <div className="mt-1 text-2xl font-semibold">{openTasks.length}</div>
          <div className="text-sm text-muted-foreground">{t.stillActive}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.salesResult}
          </div>
          <div className="mt-1 text-2xl font-semibold capitalize">{quote.status}</div>
          <div className="text-sm text-muted-foreground">
            {quote.status === "won"
              ? t.wonCopy
              : quote.status === "lost"
                ? t.lostCopy
                : quote.status === "expired"
                  ? t.expiredCopy
                  : t.activeCopy}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.reminderFeed}
          </div>
          <div className="mt-1 text-2xl font-semibold">{reminderNotifications.length}</div>
          <div className="text-sm text-muted-foreground">{t.alertsTied}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.reminderPlan}
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {quote.reminderRules?.length ?? t.defaultPlan}
          </div>
          <div className="text-sm text-muted-foreground">
            {quote.reminderRules?.length ? t.overrideCopy : t.defaultCopy}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.reminderSource}
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {effectiveRules.length} {t.rules}
          </div>
          <div className="text-sm text-muted-foreground">
            {quote.reminderRules?.length ? t.ownOverride : t.inheritsGlobal}
          </div>
          <Link
            to="/quotes/reminders"
            className="mt-3 inline-flex text-xs font-medium uppercase tracking-wide text-primary hover:underline"
          >
            {t.openReminderSettings}
          </Link>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.reminderStatus}
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {expired ? t.due : quote.status === "won" ? t.closed : t.active}
          </div>
          <div className="text-sm text-muted-foreground">
            {expired
              ? t.overdueCopy
              : quote.status === "won"
                ? t.wonReminderCopy
                : t.activeReminderCopy}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t.relatedTasks}</CardTitle>
          <Button
            size="sm"
            disabled={!canWriteTasks}
            onClick={() => {
              setEditingTask(null);
              setTaskOpen(true);
            }}
          >
            <Plus className="size-4" /> {t.newTask}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.subject}</TableHead>
                <TableHead>{t.dueLabel}</TableHead>
                <TableHead>{t.priority}</TableHead>
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
                      className="text-primary hover:underline"
                    >
                      {task.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {task.dueDate} {task.dueTime ?? ""}
                  </TableCell>
                  <TableCell>
                    <Badge {...priorityBadge(task.priority)} />
                  </TableCell>
                  <TableCell>
                    <Badge {...statusBadge(task.status)} />
                  </TableCell>
                  <TableCell>{task.salesperson}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTask(task);
                        setTaskOpen(true);
                      }}
                    >
                      {t.edit}
                    </Button>
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
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    {t.noTasks}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <QuoteDialog open={editOpen} onOpenChange={setEditOpen} initial={quote} />
      <TaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        initial={editingTask ?? null}
        defaultPartnerId={quote.partnerId}
        defaultQuoteId={quote.id}
      />
      <SalesEventDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        partnerId={quote.partnerId}
        initial={null}
      />
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">
        {value || "—"}
        {children ? <span className="ml-2 text-xs uppercase tracking-wide">{children}</span> : null}
      </span>
    </div>
  );
}
