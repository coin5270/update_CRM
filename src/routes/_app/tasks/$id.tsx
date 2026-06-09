import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Mail, Pause, Pencil, Play, Timer } from "lucide-react";
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
import { TaskDialog } from "@/components/TaskDialog";
import { SalesEventTimeline } from "@/components/SalesEventTimeline";
import { SalesEventDialog } from "@/components/SalesEventDialog";
import { priorityBadge, statusBadge, daysOverdue, isOverdue } from "@/lib/task-utils";
import { effectiveReminderRules, quoteStatusBadge, formatMoney } from "@/lib/quote-utils";
import { toast } from "sonner";
import {
  channelLabels,
  historyTypeLabels,
  operationStatusLabels,
  statusBadge as operationBadge,
  trafficModeLabels,
} from "@/lib/crm-labels";
import { store, useStoreVersion } from "@/lib/store";
import type { SalesTask } from "@/lib/types";

export const Route = createFileRoute("/_app/tasks/$id")({
  component: TaskDetail,
});

function TaskDetail() {
  useStoreVersion();
  const locale = store.getLocale();
  const { id } = Route.useParams();
  const [editOpen, setEditOpen] = React.useState(false);
  const [eventOpen, setEventOpen] = React.useState(false);

  const task = React.useMemo(() => store.tasks().find((item) => item.id === id), [id]);
  const user = store.getUser();
  const canWriteTasks = user?.permissions?.includes("tasks:write") ?? false;
  const canWriteInteractions = user?.permissions?.includes("interactions:write") ?? false;
  const t =
    locale === "es"
      ? {
          back: "Volver",
          notFound: "Tarea no encontrada.",
          overdue: "Atrasada",
          email: "Email",
          resume: "Reanudar",
          hold: "Pausar",
          done: "Hecho",
          edit: "Editar",
          newEvent: "Nuevo evento",
          taskDetails: "Detalles de la tarea",
          partner: "Empresa",
          contact: "Contacto",
          open: "Abrir",
          dueDate: "Fecha de vencimiento",
          responsibleUser: "Usuario responsable",
          salesperson: "Vendedor",
          contactMethod: "Método de contacto",
          relatedRecords: "Registros relacionados",
          quote: "Cotización",
          transaction: "Transacción",
          noQuoteLinked: "No hay cotización vinculada.",
          noTransactionLinked: "No hay transacción vinculada.",
          associateTransaction: "Asociar transacción",
          followUpTrace: "Trazabilidad de seguimientos",
          followUpTasks: "Tareas de seguimiento vinculadas a la cotización.",
          quoteQueue: "Abrir cola",
          reminderPolicy: "Política de recordatorios",
          reminderEngine: "Motor de recordatorios",
          reminderNotifications: "Notificaciones de recordatorio generadas para esta tarea.",
          reminderRules: "reglas efectivas de recordatorio activas.",
          transactionLink: "Vínculo de transacción",
          linked: "Vinculada",
          openState: "Abierta",
          operationsLogistics: "Operaciones y logística asociadas a esta tarea.",
          openTransaction: "Abrir transacción",
          interactions: "Interacciones",
          subject: "Asunto",
          channel: "Canal",
          date: "Fecha",
          owner: "Responsable",
          noInteractions: "Todavía no hay interacciones de la tarea.",
          history: "Historial",
          event: "Evento",
          type: "Tipo",
          actor: "Actor",
          noHistory: "Todavía no hay historial de la tarea.",
        }
      : {
          back: "Back",
          notFound: "Task not found.",
          overdue: "Overdue",
          email: "Email",
          resume: "Resume",
          hold: "Hold",
          done: "Done",
          edit: "Edit",
          newEvent: "New event",
          taskDetails: "Task details",
          partner: "Partner",
          contact: "Contact",
          open: "Open",
          dueDate: "Due date",
          responsibleUser: "Responsible user",
          salesperson: "Salesperson",
          contactMethod: "Contact method",
          relatedRecords: "Related records",
          quote: "Quote",
          transaction: "Transaction",
          noQuoteLinked: "No quote linked.",
          noTransactionLinked: "No transaction linked.",
          associateTransaction: "Associate transaction",
          followUpTrace: "Follow-up trace",
          followUpTasks: "Follow-up tasks tied to the linked quote.",
          quoteQueue: "Open queue",
          reminderPolicy: "Reminder policy",
          reminderEngine: "Reminder engine",
          reminderNotifications: "Quote reminder notifications generated for this work item.",
          reminderRules: "effective reminder rules are active.",
          transactionLink: "Transaction link",
          linked: "Linked",
          openState: "Open",
          operationsLogistics: "Operations and logistics execution attached to this task.",
          openTransaction: "Open transaction",
          interactions: "Interactions",
          subject: "Subject",
          channel: "Channel",
          date: "Date",
          owner: "Owner",
          noInteractions: "No task interactions yet.",
          history: "History",
          event: "Event",
          type: "Type",
          actor: "Actor",
          noHistory: "No task history yet.",
        };

  if (!task) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/tasks">
            <ArrowLeft className="size-4" /> {t.back}
          </Link>
        </Button>
        <Card className="p-10 text-center text-sm text-muted-foreground">{t.notFound}</Card>
      </div>
    );
  }

  const partner = task.partnerId ? store.partner(task.partnerId) : undefined;
  const contact = task.contactId
    ? store.contacts().find((item) => item.id === task.contactId)
    : undefined;
  const quote = task.quoteId
    ? store.quotes().find((item) => item.id === task.quoteId || item.number === task.quoteId)
    : undefined;
  const quoteTasks = quote ? store.tasks().filter((item) => item.quoteId === quote.id) : [];
  const operation = task.transactionId
    ? store
        .operations()
        .find((item) => item.id === task.transactionId || item.number === task.transactionId)
    : undefined;
  const interactions = store.interactions().filter((item) => item.taskId === task.id);
  const history = store.historyEvents().filter((item) => item.taskId === task.id);
  const reminderNotifications = quote
    ? store
        .notifications()
        .filter(
          (notification) =>
            notification.type === "reminder" &&
            (notification.quoteId === quote.id || notification.quoteId === quote.number),
        )
    : [];
  const effectiveRules = quote ? effectiveReminderRules(quote) : [];
  const overdue = isOverdue(task);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/tasks">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="size-12 rounded-md bg-primary/10 text-primary grid place-content-center">
            <Timer className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">{task.subject}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge {...statusBadge(task.status)} />
              <Badge {...priorityBadge(task.priority)} />
              {overdue && (
                <Badge variant="outline" className="text-destructive border-destructive/40">
                  {t.overdue} {daysOverdue(task.dueDate)}d
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={
              !canWriteTasks ||
              !canWriteInteractions ||
              !(task.email || contact?.email || partner?.emails[0])
            }
            onClick={() => store.sendTaskEmail(task.id)}
          >
            <Mail className="size-4" /> Email
          </Button>
          {task.status !== "completed" && (
            <>
              {task.status === "on_hold" ? (
                <Button
                  variant="outline"
                  disabled={!canWriteTasks}
                  onClick={() => {
                    store.upsertTask({ ...task, status: "pending" });
                    toast.success(locale === "es" ? "Tarea reanudada." : "Task resumed.");
                  }}
                >
                  <Play className="size-4" /> {t.resume}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={!canWriteTasks}
                  onClick={() => {
                    store.upsertTask({ ...task, status: "on_hold" });
                    toast.success(locale === "es" ? "Tarea en pausa." : "Task put on hold.");
                  }}
                >
                  <Pause className="size-4" /> {t.hold}
                </Button>
              )}
              <Button
                disabled={!canWriteTasks}
                onClick={() => {
                  store.upsertTask({ ...task, status: "completed" });
                  toast.success(locale === "es" ? "Tarea completada." : "Task completed.");
                }}
              >
                <Check className="size-4" /> {t.done}
              </Button>
            </>
          )}
          <Button variant="ghost" disabled={!canWriteTasks} onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> {t.edit}
          </Button>
          <Button variant="outline" disabled={!canWriteTasks} onClick={() => setEventOpen(true)}>
            {t.newEvent}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.taskDetails}</CardTitle>
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
              value={contact ? `${contact.firstName} ${contact.lastName}` : undefined}
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
            <Row label={t.dueDate} value={`${task.dueDate} ${task.dueTime ?? ""}`} />
            <Row label={t.responsibleUser} value={task.responsibleUser} />
            <Row label={t.salesperson} value={task.salesperson} />
            <Row label={t.contactMethod} value={task.contactMethod} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t.relatedRecords}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-2">
              <div className="text-muted-foreground">{t.quote}</div>
              {quote ? (
                <>
                  <Link
                    to="/quotes/$id"
                    params={{ id: quote.id }}
                    className="text-primary hover:underline"
                  >
                    {quote.number}
                  </Link>
                  <div className="text-muted-foreground">{quote.subject}</div>
                  <Badge {...quoteStatusBadge(quote.status)}>{quote.status}</Badge>
                  <div className="text-xs text-muted-foreground">
                    {locale === "es"
                      ? "Seguimientos abiertos de cotización:"
                      : "Open quote follow-ups:"}{" "}
                    {quoteTasks.length}
                  </div>
                  <Link to="/tasks" className="text-xs text-primary hover:underline">
                    {t.quoteQueue}
                  </Link>
                </>
              ) : (
                <div className="text-muted-foreground">{t.noQuoteLinked}</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground">{t.transaction}</div>
              {operation ? (
                <>
                  <Link
                    to="/operations/$id"
                    params={{ id: operation.id }}
                    className="text-primary hover:underline"
                  >
                    {operation.number}
                  </Link>
                  <div className="text-muted-foreground">
                    {operation.origin} / {operation.destination}
                  </div>
                  <Badge {...operationBadge(operation.status)}>
                    {operationStatusLabels[operation.status]}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {trafficModeLabels[operation.trafficMode]} ·{" "}
                    {formatMoney(operation.revenue, operation.currency)}
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-muted-foreground">
                  <div>{t.noTransactionLinked}</div>
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                    {t.associateTransaction}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SalesEventTimeline
        taskId={task.id}
        partnerId={task.partnerId}
        title={locale === "es" ? "Cronología de eventos comerciales" : "Sales event timeline"}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.followUpTrace}
          </div>
          <div className="mt-1 text-2xl font-semibold">{quoteTasks.length}</div>
          <div className="text-sm text-muted-foreground">{t.followUpTasks}</div>
          {quote && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/quotes/$id"
                params={{ id: quote.id }}
                className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
              >
                {locale === "es" ? "Abrir cotización" : "Open quote"}
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                to="/quotes/reminders"
                className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
              >
                {t.reminderPolicy}
              </Link>
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.reminderEngine}
          </div>
          <div className="mt-1 text-2xl font-semibold">{reminderNotifications.length}</div>
          <div className="text-sm text-muted-foreground">{t.reminderNotifications}</div>
          <div className="mt-3 text-xs text-muted-foreground">
            {effectiveRules.length} {t.reminderRules}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.transactionLink}
          </div>
          <div className="mt-1 text-2xl font-semibold">{operation ? t.linked : t.openState}</div>
          <div className="text-sm text-muted-foreground">{t.operationsLogistics}</div>
          {operation ? (
            <Link
              to="/operations/$id"
              params={{ id: operation.id }}
              className="mt-3 inline-flex text-xs font-medium uppercase tracking-wide text-primary hover:underline"
            >
              {t.openTransaction}
            </Link>
          ) : (
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-xs uppercase tracking-wide"
              onClick={() => setEditOpen(true)}
            >
              {t.associateTransaction}
            </Button>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.interactions}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.subject}</TableHead>
                <TableHead>{t.channel}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.owner}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interactions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.subject}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{item.body}</div>
                  </TableCell>
                  <TableCell>{channelLabels[item.channel]}</TableCell>
                  <TableCell>{item.occurredAt}</TableCell>
                  <TableCell>{item.createdBy}</TableCell>
                </TableRow>
              ))}
              {interactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t.noInteractions}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.history}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.event}</TableHead>
                <TableHead>{t.type}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.actor}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </TableCell>
                  <TableCell>{historyTypeLabels[item.type]}</TableCell>
                  <TableCell>{item.occurredAt}</TableCell>
                  <TableCell>{item.actor}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t.noHistory}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TaskDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={task as SalesTask}
        defaultPartnerId={task.partnerId}
        defaultQuoteId={task.quoteId}
      />
      <SalesEventDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        task={task}
        partnerId={task.partnerId}
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
        {value || "—"} {children}
      </span>
    </div>
  );
}
