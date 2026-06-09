import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { store, useStoreVersion } from "@/lib/store";
import { TaskFollowUpDialog } from "@/components/TaskFollowUpDialog";

type Locale = "en" | "es";
type DateFilterMode = "next_contact" | "comment";

const MESSAGES = {
  en: {
    pageTitle: "Sales Traceability Report",
    pageSubtitle:
      "Dedicated client follow-up report with next-contact dates and commentary history.",
    reportTitle: "Sales Traceability Report",
    reportLead: "Task, client, next contact, and commentary",
    reportBody: "Follow-up and closure log for clients, leads, and quotes.",
    openHistory: "Open history",
    groupedReady: "Grouped by client and ready to export.",
    printReady: "Print-ready report with grouped client sections and inline follow-up actions.",
    printPdf: "Print / PDF",
    csv: "CSV",
    dateType: "Date type",
    businessPartner: "Business Partner",
    user: "User",
    from: "From",
    to: "To",
    dateAppliesTo: "Date applies to",
    nextContactDate: "Next contact date",
    commentDate: "Comment date",
    allPartners: "All partners",
    allUsers: "All users",
    allStatuses: "All statuses",
    allDates: "All dates",
    filters: "Filters",
    language: "Language",
    english: "English",
    spanish: "Español",
    task: "Task",
    nextContact: "Next Contact",
    commentary: "Commentary",
    status: "Status",
    pending: "Pending",
    inProgress: "In progress",
    onHold: "On hold",
    cancelled: "Cancelled",
    openTask: "Open task",
    addNote: "Add follow-up note",
    noContact: "No contact",
    noTaskNotes: "No task notes yet.",
    noFollowUps: "No follow-up items match the current filters.",
    followUpItems: (count: number) => `${count} follow-up items`,
    latestActivity: "Latest activity",
    closed: "Closed",
    generatedOn: "Generated on",
    client: "Client",
  },
  es: {
    pageTitle: "Informe de trazabilidad comercial",
    pageSubtitle:
      "Informe de seguimiento de clientes con fechas de próximo contacto e historial de comentarios.",
    reportTitle: "Informe de trazabilidad comercial",
    reportLead: "Tarea, cliente, próximo contacto y comentario",
    reportBody: "Registro de seguimiento y cierre para clientes, prospectos y cotizaciones.",
    openHistory: "Abrir historial",
    groupedReady: "Agrupado por cliente y listo para exportar.",
    printReady: "Informe listo para imprimir con secciones por cliente y acciones de seguimiento.",
    printPdf: "Imprimir / PDF",
    csv: "CSV",
    dateType: "Tipo de fecha",
    businessPartner: "Empresa",
    user: "Usuario",
    from: "Desde",
    to: "Hasta",
    dateAppliesTo: "Fecha aplicada a",
    nextContactDate: "Fecha de próximo contacto",
    commentDate: "Fecha de comentario",
    allPartners: "Todas las empresas",
    allUsers: "Todos los usuarios",
    allStatuses: "Todos los estados",
    allDates: "Todas las fechas",
    filters: "Filtros",
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
    task: "Tarea",
    nextContact: "Próx contacto",
    commentary: "Comentario",
    status: "Estado",
    pending: "Pendiente",
    inProgress: "En progreso",
    onHold: "En espera",
    cancelled: "Cancelado",
    openTask: "Abrir tarea",
    addNote: "Agregar nota de seguimiento",
    noContact: "Sin contacto",
    noTaskNotes: "Todavía no hay notas.",
    noFollowUps: "No hay elementos de seguimiento que coincidan con los filtros actuales.",
    followUpItems: (count: number) => `${count} elementos de seguimiento`,
    latestActivity: "Última actividad",
    closed: "Cerrado",
    generatedOn: "Generado el",
    client: "Cliente",
  },
} as const;

export const Route = createFileRoute("/_app/reports/sales-traceability")({
  component: SalesTraceabilityReportPage,
});

function SalesTraceabilityReportPage() {
  useStoreVersion();
  const events = store.historyEvents();
  const salesEvents = store.salesEvents();
  const partners = store.partners();
  const contacts = store.contacts();
  const tasks = store.tasks();
  const interactions = store.interactions();
  const [followUpTask, setFollowUpTask] = React.useState<string | null>(null);
  const [partnerFilter, setPartnerFilter] = React.useState("all");
  const [userFilter, setUserFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilterMode, setDateFilterMode] = React.useState<DateFilterMode>("next_contact");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const locale = store.getLocale();
  const t = MESSAGES[locale];
  const generatedAt = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date()),
    [],
  );

  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const reportRows = tasks
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((task) => {
      const partner = task.partnerId ? partners.find((p) => p.id === task.partnerId) : undefined;
      const contact = task.contactId
        ? contacts.find((item) => item.id === task.contactId)
        : undefined;
      const taskInteractions = interactions
        .filter((item) => item.taskId === task.id)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
      const taskSalesEvents = salesEvents
        .filter((item) => item.taskId === task.id)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
      const taskHistory = events
        .filter((item) => item.taskId === task.id)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
      const latestActivity = taskInteractions[0] ?? taskSalesEvents[0] ?? taskHistory[0] ?? null;
      const commentDate = latestActivity?.occurredAt ?? task.createdAt ?? task.dueDate;
      const nextContactDate =
        task.status === "completed" ? "" : (task.nextContactDate ?? task.dueDate ?? "");
      const user = task.responsibleUser || task.salesperson || "Sales User";

      return {
        task,
        partner,
        contact,
        latestActivity,
        commentDate,
        nextContactDate,
        user,
        nextContact:
          task.status === "completed"
            ? t.closed
            : `${task.nextContactDate ?? task.dueDate}${task.dueTime ? ` ${task.dueTime}` : ""}`,
        taskSalesEvents,
        taskHistory,
      };
    });

  const partnerNames = React.useMemo(
    () => [
      "all",
      ...new Set(reportRows.map((row) => row.partner?.companyName ?? "Unassigned partner")),
    ],
    [reportRows],
  );
  const userNames = React.useMemo(
    () => ["all", ...new Set(reportRows.map((row) => row.user))],
    [reportRows],
  );
  const statusOptions = [
    { value: "pending", label: t.pending },
    { value: "in_progress", label: t.inProgress },
    { value: "on_hold", label: t.onHold },
    { value: "completed", label: t.closed },
    { value: "cancelled", label: t.cancelled },
  ];
  const statusLabel = (status: string) =>
    statusOptions.find((option) => option.value === status)?.label ?? status;

  const filteredRows = reportRows.filter((row) => {
    if (
      partnerFilter !== "all" &&
      (row.partner?.companyName ?? "Unassigned partner") !== partnerFilter
    ) {
      return false;
    }
    if (userFilter !== "all" && row.user !== userFilter) return false;
    if (statusFilter !== "all" && row.task.status !== statusFilter) return false;
    const selectedDate =
      dateFilterMode === "next_contact" ? row.nextContactDate : row.commentDate?.slice(0, 10);
    if (fromDate && (!selectedDate || selectedDate < fromDate)) return false;
    if (toDate && (!selectedDate || selectedDate > toDate)) return false;
    return true;
  });

  const reportGroups = Object.entries(
    filteredRows.reduce<Record<string, typeof filteredRows>>((acc, row) => {
      const key = row.partner?.companyName ?? "Unassigned partner";
      acc[key] = acc[key] ?? [];
      acc[key].push(row);
      return acc;
    }, {}),
  ).sort(([left], [right]) => left.localeCompare(right));

  const exportReport = () => {
    const headers =
      locale === "es"
        ? [
            "Tarea",
            "Cliente",
            "Contacto",
            "Próx contacto",
            "Fecha de comentario",
            "Tipo de fecha",
            "Estado",
            "Comentario",
          ]
        : [
            "Task",
            "Client",
            "Contact",
            "Next Contact",
            "Comment Date",
            "Date Type",
            "Status",
            "Commentary",
          ];
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = filteredRows.map((row) =>
      [
        row.task.subject,
        row.partner?.companyName ?? "Unassigned partner",
        row.contact ? `${row.contact.firstName} ${row.contact.lastName}` : "No contact",
        row.nextContact,
        row.commentDate,
        dateFilterMode === "next_contact" ? t.nextContactDate : t.commentDate,
        statusLabel(row.task.status),
        [
          row.task.comment || "No task notes yet.",
          row.latestActivity
            ? `${row.latestActivity.title} - ${row.latestActivity.occurredAt}`
            : "No follow-up activity yet.",
          `${row.taskSalesEvents.length + row.taskHistory.length} trace events`,
        ].join(" | "),
      ]
        .map((value) => escape(value))
        .join(","),
    );
    const blob = new Blob([[headers.map(escape).join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-follow-up-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const followUpTaskRecord = followUpTask
    ? (tasks.find((task) => task.id === followUpTask) ?? null)
    : null;

  const printReport = () => {
    if (typeof window === "undefined") return;

    const printableGroups = reportGroups
      .map(([clientName, rows]) => {
        const items = rows
          .map((row) => {
            const activityLines = row.taskSalesEvents.length
              ? row.taskSalesEvents
                  .slice(0, 5)
                  .map(
                    (entry) =>
                      `<div class="note"><strong>${escapeHtml(entry.occurredAt)}</strong> · ${escapeHtml(entry.actor)} - ${escapeHtml(entry.action)}${
                        entry.note ? `<br><span class="muted">${escapeHtml(entry.note)}</span>` : ""
                      }</div>`,
                  )
              : row.taskHistory.length
                ? row.taskHistory
                    .slice(0, 5)
                    .map(
                      (entry) =>
                        `<div class="note"><strong>${escapeHtml(entry.occurredAt)}</strong> · ${escapeHtml(entry.actor)} - ${escapeHtml(entry.description)}</div>`,
                    )
                : [`<div class="note">${escapeHtml(row.task.comment || t.noTaskNotes)}</div>`];

            return `
              <tr>
                <td>
                  <div class="task-title">${escapeHtml(row.task.subject)}</div>
                  <div class="muted">${escapeHtml(row.contact ? `${row.contact.firstName} ${row.contact.lastName}` : t.noContact)}</div>
                </td>
                <td class="nowrap">${escapeHtml(row.nextContact)}</td>
                <td>${activityLines.join("")}${
                  row.latestActivity
                    ? `<div class="activity">${escapeHtml(t.latestActivity)}: ${escapeHtml(row.latestActivity.title || row.latestActivity.description || row.latestActivity.type || "")} · ${escapeHtml(row.latestActivity.occurredAt)}</div>`
                    : ""
                }</td>
                <td><span class="badge">${escapeHtml(statusLabel(row.task.status))}</span></td>
              </tr>
            `;
          })
          .join("");

        return `
          <section class="client-group">
            <header class="client-header">
              <div class="client-name">${escapeHtml(clientName)}</div>
              <div class="client-count">${escapeHtml(t.followUpItems(rows.length))}</div>
            </header>
            <table>
              <thead>
                <tr>
                  <th>${escapeHtml(t.task)}</th>
                  <th>${escapeHtml(t.nextContact)}</th>
                  <th>${escapeHtml(t.commentary)}</th>
                  <th>${escapeHtml(t.status)}</th>
                </tr>
              </thead>
              <tbody>${items}</tbody>
            </table>
          </section>
        `;
      })
      .join("");

    const printMarkup = `
      <!doctype html>
      <html lang="${locale}">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(t.reportTitle)}</title>
          <style>
            @page { size: auto; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              color: #0f172a;
              background: #fff;
            }
            .report {
              width: 100%;
            }
            .header {
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .eyebrow {
              font-size: 11px;
              letter-spacing: 0.28em;
              text-transform: uppercase;
              color: #64748b;
            }
            h1 {
              margin: 4px 0 6px;
              font-size: 24px;
              line-height: 1.1;
            }
            .subtitle {
              color: #475569;
              font-size: 13px;
            }
            .print-ready {
              margin: 12px 0 18px;
              padding: 10px 12px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              color: #334155;
              font-size: 13px;
            }
            .client-group {
              margin: 0 0 18px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              overflow: hidden;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .client-header {
              padding: 12px 14px 10px;
              border-bottom: 1px solid #e2e8f0;
              background: #f8fafc;
            }
            .client-name {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
            }
            .client-count {
              margin-top: 4px;
              font-size: 12px;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              padding: 10px 12px;
              text-align: left;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #64748b;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              padding: 12px;
              vertical-align: top;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
              color: #0f172a;
            }
            tr:last-child td { border-bottom: 0; }
            .task-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
            .muted, .activity { color: #475569; font-size: 12px; line-height: 1.35; }
            .activity { margin-top: 6px; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; }
            .note { font-size: 12px; line-height: 1.4; color: #334155; margin-bottom: 6px; }
            .nowrap { white-space: nowrap; }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 9999px;
              border: 1px solid #cbd5e1;
              background: #eef2ff;
              color: #1e293b;
              font-size: 11px;
              font-weight: 700;
              text-transform: capitalize;
            }
            @media print {
              .client-group { break-inside: avoid; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div class="eyebrow">Sales CRM</div>
              <h1>${escapeHtml(t.reportTitle)}</h1>
              <div class="subtitle">${escapeHtml(t.reportLead)}. ${escapeHtml(t.reportBody)}</div>
              <div class="subtitle" style="margin-top:6px;">${escapeHtml(t.generatedOn)} ${escapeHtml(generatedAt)}</div>
            </div>
            <div class="print-ready">${escapeHtml(t.printReady)}</div>
            ${printableGroups || `<div class="print-ready">${escapeHtml(t.noFollowUps)}</div>`}
          </div>
        </body>
      </html>
    `;

    const existingFrame = document.getElementById("sales-traceability-print-frame");
    existingFrame?.remove();

    const frame = document.createElement("iframe");
    frame.id = "sales-traceability-print-frame";
    frame.title = t.printPdf;
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.border = "0";
    frame.style.opacity = "0";
    document.body.appendChild(frame);

    const printFromFrame = () => {
      const frameWindow = frame.contentWindow;
      if (!frameWindow) {
        frame.remove();
        return;
      }

      const cleanup = () => window.setTimeout(() => frame.remove(), 500);
      frameWindow.onafterprint = cleanup;
      window.setTimeout(cleanup, 60_000);
      window.setTimeout(() => {
        frameWindow.focus();
        frameWindow.print();
      }, 300);
    };

    frame.onload = printFromFrame;
    frame.srcdoc = printMarkup;
  };

  return (
    <div className="sales-traceability-report space-y-5">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">{t.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.pageSubtitle}</p>
      </div>

      <Card className="border-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-lg print:bg-white print:text-slate-900">
        <div className="mb-4 hidden border-b border-white/10 pb-4 print:block print:border-slate-200">
          <div className="text-xs uppercase tracking-[0.3em] text-sky-300 print:text-slate-500">
            Sales CRM
          </div>
          <div className="mt-1 text-2xl font-semibold text-white print:text-slate-900">
            {t.reportTitle}
          </div>
          <div className="mt-2 text-sm text-slate-300 print:text-slate-600">
            {t.generatedOn} {generatedAt}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-sky-300 print:text-slate-500">
              Sales traceability
            </div>
            <div className="mt-1 text-sm font-medium text-white print:text-slate-900">
              {t.reportLead}
            </div>
            <div className="mt-1 text-sm text-slate-300 print:text-slate-600">{t.reportBody}</div>
          </div>
          <Link
            to="/history"
            className="text-xs font-medium uppercase tracking-wide text-sky-200 hover:underline print:hidden"
          >
            {t.openHistory}
          </Link>
        </div>
        <div className="mt-4 hidden print:block">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/90 print:border-slate-200 print:bg-slate-50">
            {t.printReady}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/90 print:hidden">
          <div className="text-xs text-slate-200">{t.groupedReady}</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={printReport}>
              {t.printPdf}
            </Button>
            <Button variant="secondary" size="sm" onClick={exportReport}>
              <Download className="size-4" /> {t.csv}
            </Button>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 print:hidden">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-200">
            {t.filters}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="partner-filter" className="text-xs text-slate-200">
                {t.businessPartner}
              </Label>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger id="partner-filter" className="bg-white text-slate-900">
                  <SelectValue placeholder={t.allPartners} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allPartners}</SelectItem>
                  {partnerNames.slice(1).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-filter" className="text-xs text-slate-200">
                {t.user}
              </Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger id="user-filter" className="bg-white text-slate-900">
                  <SelectValue placeholder={t.allUsers} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allUsers}</SelectItem>
                  {userNames.slice(1).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-xs text-slate-200">
                {t.status}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="bg-white text-slate-900">
                  <SelectValue placeholder={t.allStatuses} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allStatuses}</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-mode-filter" className="text-xs text-slate-200">
                {t.dateAppliesTo}
              </Label>
              <Select
                value={dateFilterMode}
                onValueChange={(value) => setDateFilterMode(value as DateFilterMode)}
              >
                <SelectTrigger id="date-mode-filter" className="bg-white text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next_contact">{t.nextContactDate}</SelectItem>
                  <SelectItem value="comment">{t.commentDate}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-date" className="text-xs text-slate-200">
                {t.from}
              </Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="bg-white text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date" className="text-xs text-slate-200">
                {t.to}
              </Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="bg-white text-slate-900"
              />
            </div>
          </div>
          {(partnerFilter !== "all" ||
            userFilter !== "all" ||
            statusFilter !== "all" ||
            dateFilterMode !== "next_contact" ||
            fromDate ||
            toDate) && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPartnerFilter("all");
                  setUserFilter("all");
                  setStatusFilter("all");
                  setDateFilterMode("next_contact");
                  setFromDate("");
                  setToDate("");
                }}
              >
                {locale === "es" ? "Limpiar filtros" : "Clear filters"}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-4">
          {filteredRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-8 text-center text-sm text-slate-200 print:border-slate-200 print:bg-white print:text-slate-500">
              {t.noFollowUps}
            </div>
          ) : null}
          {reportGroups.map(([clientName, rows]) => (
            <div
              key={clientName}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:shadow-none dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100"
            >
              <div className="border-b bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-slate-950/80">
                <div className="font-semibold text-slate-900 dark:text-slate-50">{clientName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300">
                  {t.followUpItems(rows.length)}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[24%]">{t.task}</TableHead>
                    <TableHead className="w-[14%]">{t.nextContact}</TableHead>
                    <TableHead>{t.commentary}</TableHead>
                    <TableHead className="w-[12%]">{t.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.task.id} className="align-top">
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-50">
                          {row.task.subject}
                        </div>
                        <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-300">
                          {row.contact
                            ? `${row.contact.firstName} ${row.contact.lastName}`
                            : t.noContact}
                        </div>
                        <Link
                          to="/tasks/$id"
                          params={{ id: row.task.id }}
                          className="text-xs text-primary hover:underline dark:text-cyan-300"
                        >
                          {t.openTask}
                        </Link>
                        <button
                          type="button"
                          className="mt-2 text-[11px] font-medium text-primary hover:underline dark:text-cyan-300"
                          onClick={() => setFollowUpTask(row.task.id)}
                        >
                          {t.addNote}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">
                        {row.nextContact}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[700px] space-y-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                          {row.taskSalesEvents.length > 0 ? (
                            row.taskSalesEvents.slice(0, 5).map((entry) => (
                              <div
                                key={entry.id}
                                className="border-l-2 border-slate-200 pl-2 dark:border-slate-700"
                              >
                                <span className="font-medium text-slate-800 dark:text-slate-100">
                                  {entry.occurredAt}
                                </span>
                                <span className="mx-1 text-slate-400 dark:text-slate-500">·</span>
                                <span className="font-medium text-slate-700 dark:text-slate-100">
                                  {entry.actor}
                                </span>
                                <span className="mx-1 text-slate-400 dark:text-slate-500">-</span>
                                <span>{entry.action}</span>
                                {entry.note ? (
                                  <span className="block text-slate-500 dark:text-slate-400">
                                    {entry.note}
                                  </span>
                                ) : null}
                              </div>
                            ))
                          ) : row.taskHistory.length > 0 ? (
                            row.taskHistory.slice(0, 5).map((entry) => (
                              <div
                                key={entry.id}
                                className="border-l-2 border-slate-200 pl-2 dark:border-slate-700"
                              >
                                <span className="font-medium text-slate-800 dark:text-slate-100">
                                  {entry.occurredAt}
                                </span>
                                <span className="mx-1 text-slate-400 dark:text-slate-500">·</span>
                                <span className="font-medium text-slate-700 dark:text-slate-100">
                                  {entry.actor}
                                </span>
                                <span className="mx-1 text-slate-400 dark:text-slate-500">-</span>
                                <span>{entry.description}</span>
                              </div>
                            ))
                          ) : (
                            <div className="whitespace-pre-line">
                              {row.task.comment || t.noTaskNotes}
                            </div>
                          )}
                          {row.latestActivity && (
                            <div className="pt-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {t.latestActivity}: {row.latestActivity.title} ·{" "}
                              {row.latestActivity.occurredAt}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.task.status === "completed" ? "default" : "secondary"}>
                          {statusLabel(row.task.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </Card>

      <TaskFollowUpDialog
        open={Boolean(followUpTaskRecord)}
        task={followUpTaskRecord}
        onOpenChange={(open) => {
          if (!open) setFollowUpTask(null);
        }}
      />
    </div>
  );
}
