import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Mail, Pause, Play, Plus, RotateCcw, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDialog } from "@/components/TaskDialog";
import { store, useStoreVersion } from "@/lib/store";
import { daysOverdue, isOverdue, isToday, priorityBadge, statusBadge } from "@/lib/task-utils";
import { quoteStatusBadge } from "@/lib/quote-utils";
import type { SalesTask, TaskPriority } from "@/lib/types";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

type View = "all" | "pending" | "overdue" | "today" | "completed";

function TasksPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const tasks = store.tasks();
  const partners = store.partners();
  const quotes = store.quotes();
  const operations = store.operations();
  const contacts = store.contacts();
  const sync = store.apiSyncStatus();
  const currentUser = store.getUser();
  const salespeople = store.salespeople();
  const canWriteTasks = currentUser?.permissions?.includes("tasks:write") ?? false;
  const canWriteInteractions = currentUser?.permissions?.includes("interactions:write") ?? false;

  const [view, setView] = React.useState<View>("pending");
  const [priority, setPriority] = React.useState<string>("all");
  const [method, setMethod] = React.useState<string>("all");
  const [partnerId, setPartnerId] = React.useState<string>("all");
  const [salesperson, setSalesperson] = React.useState<string>("all");
  const [user, setUser] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SalesTask | null>(null);

  const users = React.useMemo(
    () =>
      Array.from(new Set(tasks.map((task) => task.responsibleUser))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [tasks],
  );

  const filtered = tasks
    .filter((task) => {
      if (view === "pending") return task.status === "pending" || task.status === "in_progress";
      if (view === "overdue") return isOverdue(task);
      if (view === "today") return isToday(task.dueDate) && task.status !== "completed";
      if (view === "completed") return task.status === "completed";
      return true;
    })
    .filter((task) => priority === "all" || task.priority === (priority as TaskPriority))
    .filter((task) => method === "all" || task.contactMethod === method)
    .filter((task) => partnerId === "all" || task.partnerId === partnerId)
    .filter((task) => salesperson === "all" || task.salesperson === salesperson)
    .filter((task) => user === "all" || task.responsibleUser === user)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const counts = {
    all: tasks.length,
    pending: tasks.filter((task) => task.status === "pending" || task.status === "in_progress")
      .length,
    overdue: tasks.filter(isOverdue).length,
    today: tasks.filter((task) => isToday(task.dueDate) && task.status !== "completed").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  };

  const t =
    locale === "es"
      ? {
          title: "Bandeja central de seguimientos",
          subtitle:
            "Seguimientos, recordatorios, reuniones y acciones comerciales en una sola cola.",
          addFollowUp: "Agregar seguimiento",
          pending: "Pendientes",
          dueToday: "Vencen hoy",
          overdue: "Atrasados",
          completed: "Completados",
          open: "Abiertos",
          priority: "Prioridad",
          method: "Método",
          partner: "Empresa",
          salesperson: "Vendedor",
          user: "Usuario",
          allPriorities: "Todas las prioridades",
          allMethods: "Todos los métodos",
          allPartners: "Todas las empresas",
          allSalespeople: "Todos los vendedores",
          allUsers: "Todos los usuarios",
          all: "Todos",
          followUps: "seguimientos",
          urgent: "Urgente",
          high: "Alta",
          medium: "Media",
          low: "Baja",
          call: "Llamada",
          whatsapp: "WhatsApp",
          email: "Email",
          social: "Redes sociales",
          meeting: "Reunión",
          task: "Tarea",
          allUsersShort: "Todos los usuarios",
          workQueueOverview: "Resumen de cola de trabajo",
          workQueueSubtitle: "Seguimientos, recordatorios, reuniones y acciones de clientes.",
          visible: "visibles",
          backendSync: "Sincronización backend",
          connected: "Conectado",
          offline: "Sin conexión",
          backendRead: "Los seguimientos se están leyendo desde el backend.",
          localFallback: "Usando seguimientos locales de respaldo hasta que la API responda.",
          inbox: "Bandeja",
          inboxCopy: "Mostrando los seguimientos más relevantes del filtro activo.",
          emailReady: "Listos para email",
          emailReadyCopy:
            "Los seguimientos con email de empresa o contacto se pueden enviar desde la cola.",
          topQueue: "Cola principal",
          topQueueCopy: "elementos mostrados arriba en la lista visible.",
          topic: "Tema",
          dueOverdue: "Vencimiento / atraso",
          collaborators: "Colaboradores",
          status: "Estado",
          created: "Creado",
          due: "Vence",
          noPartner: "Sin empresa",
          none: "Ninguno",
          assigned: "Asignado",
          recipient: "Destinatario",
          unassigned: "Sin asignar",
          quote: "Cotización",
          transaction: "Transacción",
          trace: "Trazabilidad",
          quoteReminders: "Recordatorios de cotización",
          reminderSettings: "Configurar recordatorios",
          noQuoteTrace: "No hay trazabilidad de cotización disponible",
          resume: "Reanudar",
          hold: "Pausar",
          done: "Listo",
          reset: "Restablecer",
          associateTransaction: "Asociar operación",
          edit: "Editar",
          client: "Cliente",
          noBackendFollowUps: "El backend aún no devolvió seguimientos.",
          noFilteredFollowUps: "Ningún seguimiento coincide con los filtros actuales.",
        }
      : {
          title: "Central Follow-up Inbox",
          subtitle: "Follow-ups, reminders, meetings, and sales actions in one queue.",
          addFollowUp: "Add follow-up",
          pending: "Pending",
          dueToday: "Due today",
          overdue: "Overdue",
          completed: "Completed",
          open: "Open",
          priority: "Priority",
          method: "Method",
          partner: "Partner",
          salesperson: "Salesperson",
          user: "User",
          allPriorities: "All priorities",
          allMethods: "All methods",
          allPartners: "All partners",
          allSalespeople: "All salespeople",
          allUsers: "All users",
          all: "All",
          followUps: "follow-ups",
          urgent: "Urgent",
          high: "High",
          medium: "Medium",
          low: "Low",
          call: "Call",
          whatsapp: "WhatsApp",
          email: "Email",
          social: "Social media",
          meeting: "Meeting",
          task: "Task",
          allUsersShort: "All users",
          workQueueOverview: "Work Queue Overview",
          workQueueSubtitle: "Follow-ups, reminders, meetings, and customer actions.",
          visible: "visible",
          backendSync: "Backend sync",
          connected: "Connected",
          offline: "Offline",
          backendRead: "Follow-up data is being read from the backend.",
          localFallback: "Using local fallback follow-ups until the API returns.",
          inbox: "Inbox",
          inboxCopy: "Showing the most relevant follow-ups in the active filter.",
          emailReady: "Email-ready",
          emailReadyCopy:
            "Follow-ups with partner or contact email can be sent directly from the queue.",
          topQueue: "Top queue",
          topQueueCopy: "items currently shown at the top of the visible list.",
          topic: "Topic",
          dueOverdue: "Due / overdue",
          collaborators: "Collaborators",
          status: "Status",
          created: "Created",
          due: "Due",
          noPartner: "No partner",
          none: "None",
          assigned: "Assigned",
          recipient: "Recipient",
          unassigned: "Unassigned",
          quote: "Quote",
          transaction: "Transaction",
          trace: "Trace",
          quoteReminders: "Quote reminders",
          reminderSettings: "Reminder settings",
          noQuoteTrace: "No quote trace available",
          resume: "Resume",
          hold: "Hold",
          done: "Done",
          reset: "Reset",
          associateTransaction: "Associate transaction",
          edit: "Edit",
          client: "Client",
          noBackendFollowUps: "No follow-ups were returned from the backend yet.",
          noFilteredFollowUps: "No follow-ups match the current filters.",
        };
  const views: { key: View; label: string }[] = [
    { key: "pending", label: t.open },
    { key: "overdue", label: t.overdue },
    { key: "today", label: t.dueToday },
    { key: "completed", label: t.completed },
    { key: "all", label: t.all },
  ];
  const quickUsers = [
    { label: "Maria", value: "Maria Lopez" },
    { label: "Juan", value: "Juan Smith" },
  ];
  const overdueTasks = tasks.filter(isOverdue);
  const dueTodayTasks = tasks.filter(
    (task) => isToday(task.dueDate) && task.status !== "completed",
  );
  const pendingTasks = tasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress",
  );
  const inboxTop = [...filtered].slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button
          disabled={!canWriteTasks}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> {t.addFollowUp}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.pending}</div>
          <div className="mt-1 text-2xl font-semibold">{pendingTasks.length}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es"
              ? "Seguimientos abiertos que necesitan atención."
              : "Open follow-ups needing attention."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.dueToday}</div>
          <div className="mt-1 text-2xl font-semibold">{dueTodayTasks.length}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es"
              ? "Seguimientos programados para hoy."
              : "Follow-ups scheduled for today."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.overdue}</div>
          <div className="mt-1 text-2xl font-semibold">{overdueTasks.length}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es" ? "Vencidos y aún abiertos." : "Past due and still open."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.completed}</div>
          <div className="mt-1 text-2xl font-semibold">{counts.completed}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es" ? "Seguimientos cerrados." : "Closed follow-ups."}
          </div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {views.map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={view === item.key ? "default" : "ghost"}
                onClick={() => setView(item.key)}
              >
                {item.label} {t.followUps}
                <Badge variant="secondary" className="ml-1">
                  {counts[item.key]}
                </Badge>
              </Button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t.priority} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allPriorities}</SelectItem>
                <SelectItem value="urgent">{t.urgent}</SelectItem>
                <SelectItem value="high">{t.high}</SelectItem>
                <SelectItem value="medium">{t.medium}</SelectItem>
                <SelectItem value="low">{t.low}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t.method} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allMethods}</SelectItem>
                <SelectItem value="call">{t.call}</SelectItem>
                <SelectItem value="whatsapp">{t.whatsapp}</SelectItem>
                <SelectItem value="email">{t.email}</SelectItem>
                <SelectItem value="social">{t.social}</SelectItem>
                <SelectItem value="meeting">{t.meeting}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t.partner} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allPartners}</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={salesperson} onValueChange={setSalesperson}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t.salesperson} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allSalespeople}</SelectItem>
                {salespeople.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={user} onValueChange={setUser}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t.user} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allUsers}</SelectItem>
                {users.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickUsers.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={user === item.value ? "default" : "outline"}
                onClick={() => setUser(item.value)}
              >
                {item.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={user === "all" ? "default" : "outline"}
              onClick={() => setUser("all")}
            >
              {t.allUsersShort}
            </Button>
          </div>
        </div>
      </Card>

      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-sky-100/65 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-sky-900 dark:text-slate-50">
              {t.workQueueOverview}
            </h2>
            <p className="text-xs text-sky-800/70 dark:text-slate-300">{t.workQueueSubtitle}</p>
          </div>
          <Badge
            className="border-white/10 bg-white/80 text-sky-900 shadow-sm dark:bg-slate-950/80 dark:text-slate-100"
            variant="outline"
          >
            {filtered.length} {t.visible}
          </Badge>
        </div>

        <Card className="mb-3 border-0 bg-white/90 p-4 shadow-sm dark:border dark:border-white/10 dark:bg-slate-950/90">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                {t.backendSync}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {sync?.status === "connected" ? t.connected : t.offline}
              </div>
              <div className="mt-1 text-sm text-muted-foreground dark:text-slate-300">
                {sync?.status === "connected" ? t.backendRead : (sync?.message ?? t.localFallback)}
              </div>
            </div>
            <Badge
              variant={sync?.status === "connected" ? "default" : "secondary"}
              className="dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
            >
              {sync?.status ?? "unknown"}
            </Badge>
          </div>
        </Card>

        <div className="mb-3 grid gap-3 md:grid-cols-3">
          <Card className="border-0 bg-white/90 p-4 shadow-sm dark:border dark:border-white/10 dark:bg-slate-950/90">
            <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
              {t.inbox}
            </div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-slate-300">
              {t.inboxCopy}
            </div>
          </Card>
          <Card className="border-0 bg-white/90 p-4 shadow-sm dark:border dark:border-white/10 dark:bg-slate-950/90">
            <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
              {t.emailReady}
            </div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-slate-300">
              {t.emailReadyCopy}
            </div>
          </Card>
          <Card className="border-0 bg-white/90 p-4 shadow-sm dark:border dark:border-white/10 dark:bg-slate-950/90">
            <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
              {t.topQueue}
            </div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-slate-300">
              {inboxTop.length} {t.topQueueCopy}
            </div>
          </Card>
        </div>

        <div className="hidden grid-cols-[0.7fr_1.2fr_1.2fr_0.9fr_1fr_0.9fr_1.35fr] rounded-lg bg-white px-5 py-3 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-950/80 dark:text-slate-200 lg:grid">
          <div>{t.topic}</div>
          <div>{t.partner}</div>
          <div>{t.dueOverdue}</div>
          <div>{t.user}</div>
          <div>{t.collaborators}</div>
          <div>{t.status}</div>
          <div>{t.salesperson}</div>
        </div>

        <div className="mt-3 space-y-3">
          {filtered.map((task) => {
            const partner = task.partnerId
              ? partners.find((item) => item.id === task.partnerId)
              : undefined;
            const quote = task.quoteId
              ? quotes.find((item) => item.id === task.quoteId)
              : undefined;
            const operation = task.transactionId
              ? operations.find(
                  (item) => item.id === task.transactionId || item.number === task.transactionId,
                )
              : undefined;
            const contact = task.contactId
              ? contacts.find((item) => item.id === task.contactId)
              : undefined;
            const canEmail =
              canWriteTasks &&
              canWriteInteractions &&
              Boolean(task.email || contact?.email || partner?.emails[0]);
            const overdue = isOverdue(task);
            const topicLabel = task.contactMethod === "meeting" ? t.meeting : t.task;
            const collaboratorNames = [
              task.salesperson,
              partner?.manager,
              contact ? `${contact.firstName} ${contact.lastName}` : undefined,
            ].filter(Boolean) as string[];
            const quoteTasks = quote ? tasks.filter((item) => item.quoteId === quote.id) : [];
            const reminderNotifications = quote
              ? store
                  .notifications()
                  .filter(
                    (notification) =>
                      notification.type === "reminder" &&
                      (notification.quoteId === quote.id || notification.quoteId === quote.number),
                  )
              : [];

            return (
              <div
                key={task.id}
                className="grid gap-4 rounded-xl bg-white px-5 py-4 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border dark:border-white/10 dark:bg-slate-950/90 lg:grid-cols-[0.7fr_1.2fr_1.2fr_0.9fr_1fr_0.9fr_1.35fr] lg:items-center"
              >
                <div className="font-semibold text-slate-700 dark:text-slate-100">{topicLabel}</div>

                <div className="min-w-0">
                  <Link
                    to="/tasks/$id"
                    params={{ id: task.id }}
                    className="font-semibold text-slate-900 hover:text-primary hover:underline dark:text-slate-50"
                  >
                    {task.subject}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground dark:text-slate-300">
                    {partner ? (
                      <Link
                        to="/partners/$id"
                        params={{ id: partner.id }}
                        className="hover:text-primary hover:underline"
                      >
                        {partner.companyName}
                      </Link>
                    ) : (
                      t.noPartner
                    )}
                    {quote && (
                      <>
                        {" / "}
                        <Link
                          to="/quotes/$id"
                          params={{ id: quote.id }}
                          className="hover:text-primary hover:underline"
                        >
                          {quote.number}
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                  <DateLine label={t.created} value={task.createdAt} />
                  <DateLine
                    label={t.due}
                    value={`${task.dueDate}${task.dueTime ? ` ${task.dueTime}` : ""}`}
                  />
                  <DateLine
                    danger={overdue}
                    label={overdue ? t.overdue : t.priority}
                    value={overdue ? `${daysOverdue(task.dueDate)}d` : task.priority}
                  />
                </div>

                <div>
                  <PersonChip name={task.responsibleUser} />
                </div>

                <div className="flex items-center gap-1">
                  {collaboratorNames.slice(0, 3).map((name, index) => (
                    <PersonBubble key={`${name}-${index}`} name={name} index={index} />
                  ))}
                  {collaboratorNames.length === 0 && (
                    <span className="text-xs text-muted-foreground">{t.none}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge {...statusBadge(task.status)} />
                  <Badge {...priorityBadge(task.priority)} />
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-700 dark:text-slate-200">
                    <div>
                      {t.created} <span className="font-semibold">{task.salesperson}</span>
                    </div>
                    <div>
                      {t.assigned} <span className="font-semibold">{task.responsibleUser}</span>
                    </div>
                    <div>
                      {t.method} <span className="font-semibold">{task.contactMethod}</span>
                    </div>
                    <div>
                      {t.recipient}{" "}
                      <span className="font-semibold">
                        {task.email || contact?.email || partner?.emails[0] || t.unassigned}
                      </span>
                    </div>
                    {quote && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span>{t.quote}</span>
                        <Link
                          to="/quotes/$id"
                          params={{ id: quote.id }}
                          className="font-semibold text-primary hover:underline dark:text-cyan-300"
                        >
                          {quote.number}
                        </Link>
                        <Badge {...quoteStatusBadge(quote.status)} />
                        <span className="text-xs text-muted-foreground">
                          ({quoteTasks.length} {t.followUps})
                        </span>
                      </div>
                    )}
                    {operation && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span>{t.transaction}</span>
                        <Link
                          to="/operations/$id"
                          params={{ id: operation.id }}
                          className="font-semibold text-primary hover:underline dark:text-cyan-300"
                        >
                          {operation.number}
                        </Link>
                        <Badge variant="secondary" className="capitalize">
                          {operation.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-start gap-1 lg:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canEmail}
                      onClick={() => store.sendTaskEmail(task.id)}
                    >
                      <Mail className="size-4" /> {t.email}
                    </Button>
                    {task.status !== "completed" && (
                      <>
                        {task.status === "on_hold" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canWriteTasks}
                            onClick={() => store.upsertTask({ ...task, status: "pending" })}
                          >
                            <Play className="size-4" /> {t.resume}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canWriteTasks}
                            onClick={() => store.upsertTask({ ...task, status: "on_hold" })}
                          >
                            <Pause className="size-4" /> {t.hold}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canWriteTasks}
                          onClick={() => store.upsertTask({ ...task, status: "completed" })}
                        >
                          <Check className="size-4" /> {t.done}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWriteTasks}
                      onClick={() => store.upsertTask({ ...task, status: "pending" })}
                    >
                      <RotateCcw className="size-4" /> {t.reset}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWriteTasks}
                      onClick={() => {
                        setEditing(task);
                        setOpen(true);
                      }}
                    >
                      {t.associateTransaction}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWriteTasks}
                      onClick={() => {
                        setEditing(task);
                        setOpen(true);
                      }}
                    >
                      {t.edit}
                    </Button>
                    {quote && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/quotes/$id" params={{ id: quote.id }}>
                          {t.quote}
                        </Link>
                      </Button>
                    )}
                    {partner && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/partners/$id" params={{ id: partner.id }}>
                          {t.client}
                        </Link>
                      </Button>
                    )}
                    {operation && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/operations/$id" params={{ id: operation.id }}>
                          {t.transaction}
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        {t.trace}
                      </span>
                      {quote ? (
                        <>
                          <Link
                            to="/quotes/$id"
                            params={{ id: quote.id }}
                            className="font-medium text-primary hover:underline dark:text-cyan-300"
                          >
                            {t.quoteReminders} {reminderNotifications.length}
                          </Link>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <Link
                            to="/quotes/reminders"
                            className="font-medium text-primary hover:underline dark:text-cyan-300"
                          >
                            {t.reminderSettings}
                          </Link>
                        </>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-300">{t.noQuoteTrace}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-sky-200 bg-white/70 py-10 text-center text-sm text-muted-foreground">
              {sync?.status === "connected" ? t.noBackendFollowUps : t.noFilteredFollowUps}
            </div>
          )}
        </div>
      </section>

      <TaskDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}

function DateLine({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={danger ? "text-destructive" : ""}>
      <span className="text-muted-foreground">{label}</span>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function PersonChip({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800">
      <PersonBubble name={name} index={0} />
      <span className="max-w-24 truncate">{name}</span>
    </div>
  );
}

function PersonBubble({ name, index }: { name: string; index: number }) {
  const colors = ["bg-sky-400", "bg-rose-300", "bg-amber-300", "bg-emerald-400"];
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`${colors[index % colors.length]} grid size-7 place-content-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm`}
      title={name}
    >
      {initials || "U"}
    </span>
  );
}
