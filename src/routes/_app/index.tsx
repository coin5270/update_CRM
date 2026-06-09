import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Phone,
  Settings2,
  Ship,
  Target,
  TrendingUp,
  Users,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { store, useStoreVersion } from "@/lib/store";
import { formatMoney } from "@/lib/quote-utils";
import { isOverdue, isToday, priorityBadge } from "@/lib/task-utils";
import type { QuoteStatus, SalesTask } from "@/lib/types";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

const statusOrder: QuoteStatus[] = ["draft", "sent", "negotiation", "won", "lost", "expired"];
const funnelColors = ["#fff8bd", "#ffe66a", "#ffd33d", "#ffb703", "#f78c00", "#19b569"];

function Dashboard() {
  useStoreVersion();
  const locale = store.getLocale();
  const user = store.getUser();
  const [taskOwner, setTaskOwner] = React.useState<"all" | "Maria Lopez" | "Juan Smith">(
    user?.name === "Juan Smith" ? "Juan Smith" : "Maria Lopez",
  );
  const permissionCount = user?.permissions?.length ?? 0;
  const roleLabel =
    user?.role === "sales_manager"
      ? "Admin Lite"
      : user?.role === "sales"
        ? locale === "es"
          ? "Ventas"
          : "Sales"
        : user?.role === "operations"
          ? locale === "es"
            ? "Operaciones"
            : "Operations"
          : locale === "es"
            ? "Invitado"
            : "Guest";
  const partners = store.partners();
  const contacts = store.contacts();
  const tasks = store.tasks();
  const quotes = store.quotes();
  const operations = store.operations();
  const notifications = store.notifications();
  const interactions = store.interactions();
  const t =
    locale === "es"
      ? {
          welcome: "Hola",
          today: "Hoy",
          commandCenter: "Centro de mando",
          commandLead: "Abre las áreas del CRM donde puedes crear y editar registros",
          commandBody:
            "Los formularios están activos dentro de cada módulo. Empieza aquí para gestionar empresas, contactos, tareas, cotizaciones, operaciones y mensajes.",
          partners: "Empresas",
          followUps: "Seguimientos",
          quotes: "Cotizaciones",
          contacts: "Contactos",
          viewTasksFor: "Ver seguimientos de",
          createPartner: "Crear empresa",
          createContact: "Crear contacto",
          createTask: "Crear seguimiento",
          createQuote: "Crear cotización",
          myFollowUps: "Mis seguimientos",
          overdue: "Atrasados",
          noPending: "No hay actividades pendientes.",
          salesFunnel: "Embudo comercial",
          opportunities: "Oportunidades",
          openQuotes: "Abrir cotizaciones",
          openPipeline: "Abrir pipeline",
          openNow: "No hay oportunidades abiertas ahora.",
          pipelineQuickView: "Vista rápida del pipeline",
          openPipelineLabel: "Pipeline abierto",
          pipelineValue: "Valor del pipeline",
          quickActions: "Acciones rápidas",
          openPartnerModule:
            "Abre el módulo de empresas para agregar una compañía, cliente o proveedor.",
          openQuoteBoard: "Abre el tablero de cotizaciones y agrega una nueva oportunidad.",
          role: "Rol",
          permissions: "Permisos",
          auditTrailNote: "La trazabilidad auditada es independiente del reporte de seguimiento",
          useSidebarNote: "Usa la barra lateral para navegar",
          permissionsNote:
            "Las acciones por permiso se habilitan cuando tu usuario tiene acceso de escritura",
          winRate: "Tasa de cierre",
          trend: "Tendencia",
          leadTarget: "Objetivo de leads",
          revenueTarget: "Objetivo de ingresos",
          leadClass: "Clasificación de leads",
          recentLeads: "Leads recientes",
          showMore: "Mostrar más",
          unassigned: "Sin asignar",
          noCountry: "Sin país",
          openPipelineValue: "Pipeline abierto",
          pipelineQuickValue: "Vista rápida del pipeline",
          leadStage: "Lead",
          leadStageShort: "Lead",
          contacted: "Contactado",
          interested: "Interesado",
          wonShort: "Ganado",
          lostShort: "Perdido",
          expiredShort: "Vencido",
          customer: "Cliente",
          closed: "Cerrado",
          autoLeads: "Leads automáticos",
          customers: "Clientes",
          vendors: "Proveedores",
          quotations: "Cotizaciones",
          rateRequests: "Solicitudes de tarifa",
          wonDeals: "Negocios ganados",
          title: "Centro de mando",
        }
      : {
          welcome: "Hi",
          today: "Today",
          commandCenter: "Command center",
          commandLead: "Open the CRM areas where you can create and edit records",
          commandBody:
            "The forms are live inside each module. Start from here to manage partners, contacts, tasks, quotes, operations, and messages.",
          partners: "Partners",
          followUps: "Follow-ups",
          quotes: "Quotes",
          contacts: "Contacts",
          viewTasksFor: "View tasks for",
          createPartner: "Create partner",
          createContact: "Create contact",
          createTask: "Create task",
          createQuote: "Create quote",
          myFollowUps: "My Follow-ups",
          overdue: "overdue",
          noPending: "No pending activities.",
          salesFunnel: "Sales Funnel",
          opportunities: "Opportunities",
          openQuotes: "Open quotes",
          openPipeline: "Open pipeline",
          openNow: "No open opportunities right now.",
          pipelineQuickView: "Pipeline quick view",
          openPipelineLabel: "Open pipeline",
          pipelineValue: "Pipeline value",
          quickActions: "Quick Actions",
          openPartnerModule: "Open the partner module to add a company, customer, or supplier.",
          openQuoteBoard: "Open the quote board and add a new opportunity.",
          role: "Role",
          permissions: "Permissions",
          auditTrailNote: "Audit trail is separate from the follow-up report",
          useSidebarNote: "Use the sidebar for navigation",
          permissionsNote: "Permission-based actions unlock when your user has write access",
          winRate: "Win Rate",
          trend: "Trend",
          leadTarget: "Lead Target",
          revenueTarget: "Revenue Target",
          leadClass: "Leads Classification",
          recentLeads: "Recent Leads",
          showMore: "Show more",
          unassigned: "Unassigned",
          noCountry: "No country",
          openPipelineValue: "Open pipeline",
          pipelineQuickValue: "Pipeline quick view",
          leadStage: "Lead",
          leadStageShort: "Lead",
          contacted: "Contacted",
          interested: "Interested",
          wonShort: "Won",
          lostShort: "Lost",
          expiredShort: "Expired",
          customer: "Customer",
          closed: "Closed",
          autoLeads: "Auto Leads",
          customers: "Customers",
          vendors: "Vendors",
          quotations: "Quotations",
          rateRequests: "Rate Requests",
          wonDeals: "Won Deals",
          title: "Command center",
        };

  const filteredTasks =
    taskOwner === "all"
      ? tasks
      : tasks.filter(
          (task) => task.responsibleUser === taskOwner || task.salesperson === taskOwner,
        );
  const pending = filteredTasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress",
  );
  const dueToday = pending.filter((task) => isToday(task.dueDate));
  const overdue = pending.filter((task) => isOverdue(task));
  const wonQuotes = quotes.filter((quote) => quote.status === "won");
  const openQuotes = quotes.filter((quote) =>
    ["draft", "sent", "negotiation"].includes(quote.status),
  );
  const opportunities = openQuotes.slice(0, 5);
  const pipelineValue = openQuotes.reduce((sum, quote) => sum + quote.amount, 0);
  const revenue = operations.reduce((sum, operation) => sum + operation.revenue, 0);
  const wonValue = wonQuotes.reduce((sum, quote) => sum + quote.amount, 0);
  const winRate = quotes.length ? Math.round((wonQuotes.length / quotes.length) * 100) : 0;
  const activeCustomers = partners.filter((partner) => partner.status === "active").length;
  const vendors = partners.filter((partner) => partner.roles.includes("supplier")).length;
  const leads = partners.filter(
    (partner) => partner.status === "lead" || partner.status === "prospect",
  );

  const activityTasks = [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  const funnelData = statusOrder.map((status) => ({
    status,
    label:
      locale === "es"
        ? {
            draft: "Leads",
            sent: t.contacted,
            negotiation: t.interested,
            won: t.wonShort,
            lost: t.lostShort,
            expired: t.expiredShort,
          }[status]
        : {
            draft: "Leads",
            sent: "Contacted",
            negotiation: "Interested",
            won: "Won",
            lost: "Lost",
            expired: "Expired",
          }[status],
    count: quotes.filter((quote) => quote.status === status).length,
  }));
  const leadClassData = [
    {
      label: locale === "es" ? "Prospecto" : "Prospect",
      air: leads.length,
      ocean: vendors,
      road: Math.max(1, contacts.length - vendors),
    },
    {
      label: t.leadStage,
      air: leads.length + 1,
      ocean: openQuotes.length,
      road: overdue.length + 1,
    },
    {
      label: t.customer,
      air: activeCustomers,
      ocean: wonQuotes.length + 1,
      road: operations.length,
    },
    {
      label: t.closed,
      air: wonQuotes.length,
      ocean: quotes.filter((q) => q.status === "lost").length,
      road: 2,
    },
  ];
  const revenueTrend = [
    { month: "Jan", value: 18 },
    { month: "Feb", value: 24 },
    { month: "Mar", value: 21 },
    { month: "Apr", value: 32 },
    { month: "May", value: Math.max(12, Math.round(revenue / 2500)) },
  ];
  const leadTarget = [
    { month: "Jan", value: Math.max(2, leads.length) },
    { month: "Feb", value: leads.length + 4 },
    { month: "Mar", value: leads.length + contacts.length },
    { month: "Apr", value: leads.length + partners.length },
  ];

  const kpis = [
    {
      label: t.customers,
      value: activeCustomers,
      icon: Users,
      tone: "text-sky-600",
      color: "#0284c7",
      ringStart: "#38bdf8",
      ringEnd: "#0ea5e9",
      ringTrack: "rgba(14, 165, 233, 0.14)",
      ringStroke: 4,
      trend: [partners.length - activeCustomers, leads.length, activeCustomers],
      diagram: "bars",
    },
    {
      label: t.vendors,
      value: vendors,
      icon: Building2,
      tone: "text-amber-600",
      color: "#f97316",
      ringStart: "#fbbf24",
      ringEnd: "#f97316",
      ringTrack: "rgba(249, 115, 22, 0.14)",
      ringStroke: 5,
      trend: [1, vendors + 1, Math.max(1, vendors)],
      diagram: "bars",
    },
    {
      label: t.quotations,
      value: quotes.length,
      icon: FileText,
      tone: "text-slate-600",
      color: "#64748b",
      ringStart: "#94a3b8",
      ringEnd: "#64748b",
      ringTrack: "rgba(100, 116, 139, 0.14)",
      ringStroke: 4,
      trend: statusOrder.map((status) => quotes.filter((quote) => quote.status === status).length),
      diagram: "line",
    },
    {
      label: t.rateRequests,
      value: openQuotes.length,
      icon: Mail,
      tone: "text-emerald-600",
      color: "#059669",
      ringStart: "#34d399",
      ringEnd: "#059669",
      ringTrack: "rgba(5, 150, 105, 0.14)",
      ringStroke: 5,
      trend: [openQuotes.length, dueToday.length + 1, pending.length + 1, openQuotes.length + 2],
      diagram: "line",
    },
    {
      label: t.autoLeads,
      value: leads.length,
      icon: Target,
      tone: "text-violet-600",
      color: "#7c3aed",
      ringStart: "#c084fc",
      ringEnd: "#7c3aed",
      ringTrack: "rgba(124, 58, 237, 0.14)",
      ringStroke: 4,
      trend: [leads.length, contacts.length, partners.length],
      diagram: "dots",
    },
    {
      label: t.winRate,
      value: `${winRate}%`,
      icon: TrendingUp,
      tone: "text-teal-600",
      color: "#0d9488",
      ringStart: "#2dd4bf",
      ringEnd: "#0d9488",
      ringTrack: "rgba(13, 148, 136, 0.14)",
      ringStroke: 6,
      trend: [0, Math.max(5, winRate / 2), winRate],
      diagram: "line",
    },
    {
      label: locale === "es" ? "Ingresos" : "Revenue",
      value: formatMoney(revenue || wonValue),
      icon: Ship,
      tone: "text-green-700",
      color: "#15803d",
      ringStart: "#4ade80",
      ringEnd: "#15803d",
      ringTrack: "rgba(21, 128, 61, 0.14)",
      ringStroke: 6,
      trend: revenueTrend.map((item) => item.value),
      diagram: "line",
    },
    {
      label: t.wonDeals,
      value: wonQuotes.length,
      icon: CheckCircle2,
      tone: "text-blue-600",
      color: "#2563eb",
      ringStart: "#60a5fa",
      ringEnd: "#2563eb",
      ringTrack: "rgba(37, 99, 235, 0.14)",
      ringStroke: 5,
      trend: [quotes.length - wonQuotes.length, wonQuotes.length + 1, wonQuotes.length],
      diagram: "dots",
    },
  ];

  return (
    <div className="min-h-full rounded-[2rem] bg-[#f8fbff] p-4 text-slate-900 shadow-sm dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500 dark:text-sky-300">
            Prime Logistics
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {t.welcome}, {user?.name ?? "Sales"}
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200">
          <Clock3 className="size-4 text-sky-500" />
          {t.today}, {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
      </div>

      <Card className="mb-5 border-0 bg-gradient-to-r from-sky-50 via-white to-emerald-50 shadow-sm dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
                {t.commandCenter}
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {t.commandLead}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.commandBody}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/partners">
                  <Building2 className="size-4" /> {t.partners}
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/tasks">
                  <Plus className="size-4" /> {t.followUps}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/quotes">
                  <FileText className="size-4" /> {t.quotes}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/contacts">
                  <Users className="size-4" /> {t.contacts}
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
              {t.viewTasksFor}
            </span>
            {[
              { label: "Maria", value: "Maria Lopez" },
              { label: "Juan", value: "Juan Smith" },
              { label: "All", value: "all" },
            ].map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={taskOwner === item.value ? "default" : "outline"}
                onClick={() => setTaskOwner(item.value as typeof taskOwner)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <QuickCreateCard
              title={t.createPartner}
              description={t.openPartnerModule}
              href="/partners"
              icon={Building2}
              tone="sky"
            />
            <QuickCreateCard
              title={t.createContact}
              description={
                locale === "es"
                  ? "Agrega un contacto vinculado a una empresa."
                  : "Add a contact tied to a business partner."
              }
              href="/contacts"
              icon={Users}
              tone="emerald"
            />
            <QuickCreateCard
              title={t.createTask}
              description={
                locale === "es"
                  ? "Inicia un seguimiento, recordatorio o actividad comercial."
                  : "Start a follow-up, reminder, or sales activity."
              }
              href="/tasks"
              icon={CheckCircle2}
              tone="amber"
            />
            <QuickCreateCard
              title={t.createQuote}
              description={t.openQuoteBoard}
              href="/quotes"
              icon={FileText}
              tone="slate"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100">
              {t.role}: {roleLabel}
            </span>
            <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100">
              {t.permissions}: {permissionCount}
            </span>
            <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100">
              {user?.email ?? (locale === "es" ? "Sin usuario conectado" : "No signed-in user")}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-white px-3 py-1 shadow-sm dark:border-white/10 dark:bg-white/10">
              {t.auditTrailNote}
            </span>
            <span className="rounded-full border bg-white px-3 py-1 shadow-sm dark:border-white/10 dark:bg-white/10">
              {t.useSidebarNote}
            </span>
            <span className="rounded-full border bg-white px-3 py-1 shadow-sm dark:border-white/10 dark:bg-white/10">
              {t.permissionsNote}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 min-w-0 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="min-w-0 border-0 bg-white shadow-sm dark:bg-slate-900 dark:text-slate-100">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                {t.myFollowUps} ({pending.length})
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                {overdue.length} {t.overdue}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityTasks.map((task) => (
              <ActivityItem key={task.id} task={task} />
            ))}
            {activityTasks.length === 0 && (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                {t.noPending}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.label}
                  className="group border-0 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:text-slate-100"
                >
                  <CardContent className="relative flex min-h-24 items-center gap-3 p-4 md:pr-20">
                    <div className="grid size-9 place-content-center rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Icon className={`size-5 ${item.tone}`} />
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-3 md:pr-20">
                      <div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        <div className="text-xl font-semibold">{item.value}</div>
                      </div>
                    </div>
                    <div
                      className="pointer-events-none absolute inset-2 z-10 hidden grid-rows-[1fr_auto] place-items-center rounded-2xl border bg-white/95 px-4 pt-2 pb-3 text-center shadow-lg opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100 md:grid dark:border-white/10 dark:bg-slate-900/95"
                      style={
                        {
                          borderColor: `${item.color}26`,
                          background: `linear-gradient(135deg, ${item.color}10, rgba(255,255,255,0.95) 55%, ${item.color}06)`,
                        } as CSSProperties
                      }
                    >
                      <div className="absolute left-3 top-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                        {t.trend}
                      </div>
                      <div className="flex h-12 w-20 items-center justify-center">
                        <KpiDiagram
                          values={item.trend}
                          color={item.color}
                          variant={item.diagram as "line" | "bars" | "dots"}
                        />
                      </div>
                      <div className="pb-0.5 text-sm font-semibold leading-none text-slate-700 dark:text-slate-100">
                        {typeof item.value === "string" ? item.value : item.value.toString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(300px,0.95fr)_minmax(360px,1.05fr)]">
            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900 dark:text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">{t.salesFunnel}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2">
                  {funnelData.slice(0, 5).map((stage, index) => (
                    <Link
                      key={stage.status}
                      to="/quotes"
                      className="flex h-10 items-center justify-center rounded-sm text-xs font-medium text-slate-800 shadow-sm transition hover:scale-[1.01] dark:text-slate-900"
                      style={{
                        width: `${92 - index * 9}%`,
                        background: funnelColors[index],
                        clipPath: "polygon(6% 0, 94% 0, 88% 100%, 12% 100%)",
                      }}
                    >
                      {stage.label} ({stage.count})
                    </Link>
                  ))}
                  <Link
                    to="/quotes"
                    className="mt-1 grid size-9 place-content-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-sm"
                  >
                    $
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              <TargetCard title={t.leadTarget}>
                <ChartContainer
                  config={{ value: { color: "#38bdf8" } }}
                  className="h-[200px] min-w-0 overflow-hidden"
                >
                  <AreaChart
                    data={leadTarget}
                    margin={{ left: 10, right: 12, top: 20, bottom: 14 }}
                  >
                    <defs>
                      <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fill="url(#leadFill)"
                    />
                  </AreaChart>
                </ChartContainer>
              </TargetCard>

              <TargetCard title={t.revenueTarget}>
                <ChartContainer
                  config={{ value: { color: "#f87171" } }}
                  className="h-[200px] min-w-0 overflow-hidden"
                >
                  <LineChart
                    data={revenueTrend}
                    margin={{ left: 10, right: 12, top: 20, bottom: 14 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </TargetCard>
            </div>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <Card className="min-w-0 border-0 bg-white shadow-sm dark:bg-slate-900 dark:text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t.opportunities}</CardTitle>
                <Link to="/quotes" className="text-xs text-primary hover:underline">
                  {t.openQuotes}
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t.openPipeline}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="text-2xl font-semibold">{opportunities.length}</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t.pipelineValue}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 text-2xl font-semibold">
                        {formatMoney(pipelineValue)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {opportunities.map((quote) => (
                    <Link
                      key={quote.id}
                      to="/quotes/$id"
                      params={{ id: quote.id }}
                      className="flex items-center justify-between rounded-xl border px-3 py-3 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{quote.number}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {quote.subject}
                        </div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className="text-sm font-semibold">
                          {formatMoney(quote.amount, quote.currency)}
                        </div>
                        <Badge variant={quote.status === "negotiation" ? "secondary" : "outline"}>
                          {quote.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {opportunities.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {t.openNow}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 border-0 bg-white shadow-sm dark:bg-slate-900 dark:text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">{t.pipelineQuickView}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2">
                  {statusOrder.slice(0, 5).map((status, index) => (
                    <Link
                      key={status}
                      to="/quotes"
                      className="flex h-10 items-center justify-center rounded-sm text-xs font-medium text-slate-800 shadow-sm transition hover:scale-[1.01] dark:text-slate-900"
                      style={{
                        width: `${92 - index * 9}%`,
                        background: funnelColors[index],
                        clipPath: "polygon(6% 0, 94% 0, 88% 100%, 12% 100%)",
                      }}
                    >
                      {locale === "es"
                        ? {
                            draft: "Leads",
                            sent: t.contacted,
                            negotiation: t.interested,
                            won: t.wonShort,
                            lost: t.lostShort,
                            expired: t.expiredShort,
                          }[status]
                        : {
                            draft: "Leads",
                            sent: "Contacted",
                            negotiation: "Interested",
                            won: "Won",
                            lost: "Lost",
                            expired: "Expired",
                          }[status]}{" "}
                      ({quotes.filter((quote) => quote.status === status).length})
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <Card className="min-w-0 border-0 bg-white shadow-sm dark:bg-slate-900 dark:text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">{t.leadClass}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    air: { color: "#67e8f9" },
                    ocean: { color: "#86efac" },
                    road: { color: "#fbbf24" },
                  }}
                  className="h-[220px]"
                >
                  <BarChart data={leadClassData} barGap={3} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="air" radius={[5, 5, 0, 0]} fill="#67e8f9" />
                    <Bar dataKey="ocean" radius={[5, 5, 0, 0]} fill="#86efac" />
                    <Bar dataKey="road" radius={[5, 5, 0, 0]} fill="#fbbf24" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="min-w-0 border-0 bg-white shadow-sm dark:bg-slate-900 dark:text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t.recentLeads}</CardTitle>
                <Link to="/partners" className="text-xs text-primary hover:underline">
                  {t.showMore}
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {partners.slice(0, 5).map((partner, index) => (
                  <Link
                    key={partner.id}
                    to="/partners/$id"
                    params={{ id: partner.id }}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{partner.companyName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {partner.salesperson ?? t.unassigned} - {partner.country ?? t.noCountry}
                      </div>
                    </div>
                    <Badge variant={partner.status === "active" ? "default" : "secondary"}>
                      {partner.status}
                    </Badge>
                    <div className="flex -space-x-2">
                      {[0, 1, 2].map((offset) => (
                        <span
                          key={offset}
                          className="grid size-6 place-content-center rounded-full border-2 border-white text-[10px] font-semibold text-white dark:border-slate-900"
                          style={{
                            backgroundColor: ["#38bdf8", "#86efac", "#fbbf24"][
                              (index + offset) % 3
                            ],
                          }}
                        >
                          {partner.companyName[offset]?.toUpperCase() ?? "C"}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickCreateCard({
  title,
  description,
  href,
  icon: Icon,
  tone,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "sky" | "emerald" | "amber" | "slate";
}) {
  const toneClass: Record<typeof tone, string> = {
    sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
    slate:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  return (
    <Link
      to={href as "/partners" | "/contacts" | "/tasks" | "/quotes"}
      className="group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="flex items-start gap-3">
        <div className={cn("grid size-10 place-content-center rounded-xl border", toneClass[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium">{title}</div>
            <Settings2 className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ task }: { task: SalesTask }) {
  const Icon =
    task.contactMethod === "email" ? Mail : task.contactMethod === "call" ? Phone : CalendarDays;
  return (
    <Link
      to="/tasks/$id"
      params={{ id: task.id }}
      className="grid w-full max-w-full min-w-0 grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-white/5 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="grid size-8 place-content-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="break-words text-sm font-medium">{task.subject}</div>
        <div className="text-xs text-muted-foreground">{task.dueDate}</div>
      </div>
      <Badge {...priorityBadge(task.priority)} className="col-start-2 w-fit sm:col-start-3" />
    </Link>
  );
}

function KpiDiagram({
  values,
  color,
  variant,
}: {
  values: number[];
  color: string;
  variant: "line" | "bars" | "dots";
}) {
  const safeValues = values.length ? values.map((value) => Math.max(0, value)) : [0];
  const max = Math.max(...safeValues, 1);
  const points = safeValues.map((value, index) => {
    const x = safeValues.length === 1 ? 48 : 8 + (index * 80) / (safeValues.length - 1);
    const y = 42 - (value / max) * 32;
    return { x, y, value };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox="0 0 96 48" role="img" aria-hidden="true" className="h-full w-full">
      <path d="M 6 42 H 90" stroke="#e2e8f0" strokeWidth="1" />
      {variant === "bars" &&
        points.map((point, index) => (
          <rect
            key={index}
            x={point.x - 5}
            y={point.y}
            width="10"
            height={42 - point.y}
            rx="3"
            fill={color}
            opacity={0.75}
          />
        ))}
      {variant === "line" && (
        <>
          <path d={`${path} L 88 42 L 8 42 Z`} fill={color} opacity="0.12" />
          <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeWidth="3" />
        </>
      )}
      {(variant === "dots" || variant === "line") &&
        points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3.5" fill={color} />
        ))}
    </svg>
  );
}

function TargetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden border-0 bg-white shadow-sm dark:bg-slate-900 dark:text-slate-100">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden">{children}</CardContent>
    </Card>
  );
}
