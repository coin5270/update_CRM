import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Download, Pencil, Search, Plus } from "lucide-react";
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
import { store, useStoreVersion } from "@/lib/store";
import { SalesEventDialog } from "@/components/SalesEventDialog";
import type { SalesEvent } from "@/lib/types";

export const Route = createFileRoute("/_app/sales-events")({
  component: SalesEventsPage,
});

function SalesEventsPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const events = store.salesEvents();
  const partners = store.partners();
  const tasks = store.tasks();
  const contacts = store.contacts();
  const t =
    locale === "es"
      ? {
          title: "Actividad comercial",
          subtitle: "Registro operativo de seguimiento para clientes, prospectos y cotizaciones.",
          printPdf: "Imprimir / PDF",
          csv: "CSV",
          newEvent: "Nuevo evento",
          reportTitle: "Informe de actividad comercial",
          generatedOn: "Generado el",
          events: "Eventos",
          followUps: "Seguimientos",
          closed: "Cerrados",
          nextContact: "Próximo contacto",
          search: "Buscar eventos",
          type: "Tipo",
          allTypes: "Todos los tipos",
          partner: "Empresa",
          allPartners: "Todas las empresas",
          task: "Tarea",
          allTasks: "Todas las tareas",
          client: "Cliente",
          note: "Nota",
          edit: "Editar",
          noMatch: "No hay eventos comerciales que coincidan con los filtros actuales.",
          next: "Próx",
          unassigned: "Sin asignar",
        }
      : {
          title: "Sales Activity",
          subtitle: "Operational follow-up log for client, lead, and quote activity.",
          printPdf: "Print / PDF",
          csv: "CSV",
          newEvent: "New event",
          reportTitle: "Sales Activity Report",
          generatedOn: "Generated on",
          events: "Events",
          followUps: "Follow-ups",
          closed: "Closed",
          nextContact: "Next contact",
          search: "Search events",
          type: "Type",
          allTypes: "All types",
          partner: "Partner",
          allPartners: "All partners",
          task: "Task",
          allTasks: "All tasks",
          client: "Client",
          note: "Note",
          edit: "Edit",
          noMatch: "No sales events match the current filters.",
          next: "Next",
          unassigned: "Unassigned",
        };

  const [q, setQ] = React.useState("");
  const [kind, setKind] = React.useState<string>("all");
  const [partnerId, setPartnerId] = React.useState<string>("all");
  const [taskId, setTaskId] = React.useState<string>("all");
  const [editingEvent, setEditingEvent] = React.useState<SalesEvent | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const printReport = () => {
    if (typeof window !== "undefined") window.print();
  };

  const filtered = React.useMemo(
    () =>
      events
        .filter((event) => kind === "all" || event.kind === kind)
        .filter((event) => partnerId === "all" || event.partnerId === partnerId)
        .filter((event) => taskId === "all" || event.taskId === taskId)
        .filter((event) => {
          if (!q) return true;
          const partner = partners.find((item) => item.id === event.partnerId);
          const task = tasks.find((item) => item.id === event.taskId);
          const contact = contacts.find((item) => item.id === event.contactId);
          const needle = q.toLowerCase();
          return (
            event.action.toLowerCase().includes(needle) ||
            (event.note ?? "").toLowerCase().includes(needle) ||
            event.actor.toLowerCase().includes(needle) ||
            (partner?.companyName ?? "").toLowerCase().includes(needle) ||
            (task?.subject ?? "").toLowerCase().includes(needle) ||
            `${contact?.firstName ?? ""} ${contact?.lastName ?? ""}`.toLowerCase().includes(needle)
          );
        })
        .slice()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id)),
    [events, q, kind, partnerId, taskId, partners, tasks, contacts],
  );

  const exportCsv = () => {
    const headers = ["Date", "Client", "Task", "Type", "Action", "Next Contact", "Actor", "Note"];
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = filtered.map((event) => {
      const partner = partners.find((item) => item.id === event.partnerId);
      const task = tasks.find((item) => item.id === event.taskId);
      return [
        event.occurredAt,
        partner?.companyName ?? "",
        task?.subject ?? "",
        event.kind,
        event.action,
        event.nextContactDate ?? "",
        event.actor,
        event.note ?? "",
      ]
        .map((value) => escape(value))
        .join(",");
    });
    const blob = new Blob([[headers.map(escape).join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const followUpCount = filtered.filter((event) => event.kind === "follow_up").length;
  const closedCount = filtered.filter((event) => event.status === "closed").length;
  const nextContactCount = filtered.filter((event) => Boolean(event.nextContactDate)).length;

  return (
    <div className="space-y-5">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printReport}>
            {t.printPdf}
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> {t.csv}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> {t.newEvent}
          </Button>
        </div>
      </div>

      <div className="hidden print:block">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Sales CRM</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{t.reportTitle}</div>
        <div className="mt-2 text-sm text-slate-600">
          {t.generatedOn}{" "}
          {new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date())}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 print:hidden">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.events}</div>
          <div className="mt-1 text-2xl font-semibold">{filtered.length}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es" ? "Eventos filtrados actuales." : "Current filtered events."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.followUps}</div>
          <div className="mt-1 text-2xl font-semibold">{followUpCount}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es"
              ? "Acciones de seguimiento estructuradas."
              : "Structured follow-up actions."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.closed}</div>
          <div className="mt-1 text-2xl font-semibold">{closedCount}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es" ? "Entradas de actividad cerradas." : "Closed activity entries."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.nextContact}
          </div>
          <div className="mt-1 text-2xl font-semibold">{nextContactCount}</div>
          <div className="text-sm text-muted-foreground">
            {locale === "es"
              ? "Entradas con fechas de seguimiento."
              : "Entries with follow-up dates."}
          </div>
        </Card>
      </div>

      <Card className="p-4 print:hidden">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t.search}
              className="pl-8"
            />
          </div>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue placeholder={t.type} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTypes}</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="status_change">Status change</SelectItem>
              <SelectItem value="quote_update">Quote update</SelectItem>
            </SelectContent>
          </Select>
          <Select value={partnerId} onValueChange={setPartnerId}>
            <SelectTrigger>
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
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Select value={taskId} onValueChange={setTaskId}>
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder={t.task} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTasks}</SelectItem>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground">
            <CalendarDays className="mr-1 inline size-4 align-text-bottom" />
            {filtered.length} events
          </div>
        </div>
      </Card>

      <div className="grid gap-3 print:gap-2">
        {filtered.map((event) => {
          const partner = partners.find((item) => item.id === event.partnerId);
          const task = tasks.find((item) => item.id === event.taskId);
          return (
            <Card key={event.id} className="p-4 print:shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold">{event.action}</div>
                    <Badge variant={event.status === "closed" ? "default" : "secondary"}>
                      {event.kind}
                    </Badge>
                    {event.nextContactDate && (
                      <Badge variant="outline" className="print:border-slate-300">
                        {t.next} {event.nextContactDate}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {event.occurredAt} · {event.actor}
                    {event.nextContactDate ? ` · ${t.nextContact} ${event.nextContactDate}` : ""}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t.client}:</span>{" "}
                    {partner ? (
                      <Link
                        to="/partners/$id"
                        params={{ id: partner.id }}
                        className="text-primary hover:underline"
                      >
                        {partner.companyName}
                      </Link>
                    ) : (
                      t.unassigned
                    )}
                    {task && (
                      <>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{t.task}:</span>{" "}
                        <Link
                          to="/tasks/$id"
                          params={{ id: task.id }}
                          className="text-primary hover:underline"
                        >
                          {task.subject}
                        </Link>
                      </>
                    )}
                  </div>
                  {event.note && <div className="whitespace-pre-line text-sm">{event.note}</div>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="print:hidden"
                  onClick={() => setEditingEvent(event)}
                >
                  <Pencil className="size-4" /> {t.edit}
                </Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">{t.noMatch}</Card>
        )}
      </div>

      <SalesEventDialog open={createOpen} onOpenChange={setCreateOpen} initial={null} />
      <SalesEventDialog
        open={Boolean(editingEvent)}
        onOpenChange={(open) => {
          if (!open) setEditingEvent(null);
        }}
        partnerId={editingEvent?.partnerId}
        initial={editingEvent}
      />
    </div>
  );
}
