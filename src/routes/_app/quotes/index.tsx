import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, Columns3, Plane, Plus, Search, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteDialog } from "@/components/QuoteDialog";
import { store, useStoreVersion } from "@/lib/store";
import { formatMoney, isQuoteExpired, quoteStatusBadge } from "@/lib/quote-utils";
import type { Quote, QuoteStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/quotes/")({
  component: QuotesPage,
});

function QuotesPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const quotes = store.quotes();
  const partners = store.partners();
  const operations = store.operations();
  const user = store.getUser();
  const salespeople = store.salespeople();
  const canWriteQuotes = user?.permissions?.includes("quotes:write") ?? false;

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [sp, setSp] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Quote | null>(null);
  const t =
    locale === "es"
      ? {
          title: "Cotizaciones y oportunidades",
          subtitle:
            "Cotizaciones comerciales, oportunidades de pipeline y contexto de seguimiento.",
          reminderSettings: "Configuración de recordatorios",
          pipeline: "Pipeline",
          newQuote: "Nueva cotización",
          totalQuotes: "Cotizaciones totales",
          pipelineValue: "Valor del pipeline (abierto)",
          wonValue: "Valor ganado",
          search: "Buscar por número, asunto o empresa",
          allStatuses: "Todos los estados",
          allSalespeople: "Todos los vendedores",
          opportunityBoard: "Tablero de oportunidades",
          boardSubtitle:
            "Oportunidades impulsadas por cotizaciones con estado comercial y seguimiento.",
          opportunities: "oportunidades",
          shippingType: "Tipo de envío",
          serviceType: "Tipo de servicio",
          unassigned: "Cuenta sin asignar",
          noQuotes: "No hay cotizaciones que coincidan con tus filtros.",
          open: "Abrir",
          edit: "Editar",
          closeDate: "Fecha de cierre",
          status: "Estado",
          priority: "Prioridad",
          followUp: "Seguimiento",
          salesRep: "Vendedor",
          leadScore: "Puntaje de lead",
          followUps: "Seguimientos",
          operation: "Operación",
          notLinked: "Sin vincular",
          createdAt: "Creado el",
          high: "Alta",
          medium: "Media",
          low: "Baja",
          now: "Ahora",
          yes: "Sí",
          draft: "Borrador",
          sent: "Enviada",
          negotiation: "Negociación",
          won: "Ganada",
          lost: "Perdida",
          expired: "Vencida",
          notApplicable: "No aplica",
          selectAll: "Todos",
        }
      : {
          title: "Quotes and Opportunities",
          subtitle:
            "Sales quotes, pipeline opportunities, and follow-up context across your partners.",
          reminderSettings: "Reminder settings",
          pipeline: "Pipeline",
          newQuote: "New quote",
          totalQuotes: "Total quotes",
          pipelineValue: "Pipeline value (open)",
          wonValue: "Won value",
          search: "Search by number, subject or company",
          allStatuses: "All statuses",
          allSalespeople: "All salespeople",
          opportunityBoard: "Opportunity Lead Board",
          boardSubtitle: "Quote-driven opportunities with commercial status and follow-up context.",
          opportunities: "opportunities",
          shippingType: "Shipping Type",
          serviceType: "Service Type",
          unassigned: "Unassigned Account",
          noQuotes: "No quotes match your filters.",
          open: "Open",
          edit: "Edit",
          closeDate: "Close Date",
          status: "Status",
          priority: "Priority",
          followUp: "Follow-up",
          salesRep: "Sales Rep",
          leadScore: "Lead Score",
          followUps: "Follow-ups",
          operation: "Operation",
          notLinked: "Not linked",
          createdAt: "Created at",
          high: "High",
          medium: "Medium",
          low: "Low",
          now: "Now",
          yes: "Yes",
          draft: "Draft",
          sent: "Sent",
          negotiation: "Negotiation",
          won: "Won",
          lost: "Lost",
          expired: "Expired",
          notApplicable: "N/A",
          selectAll: "All",
        };

  const filtered = quotes
    .filter((quote) => status === "all" || quote.status === (status as QuoteStatus))
    .filter((quote) => sp === "all" || quote.salesperson === sp)
    .filter((quote) => {
      if (!q) return true;
      const search = q.toLowerCase();
      const partner = partners.find((item) => item.id === quote.partnerId);
      return (
        quote.number.toLowerCase().includes(search) ||
        quote.subject.toLowerCase().includes(search) ||
        (partner?.companyName ?? "").toLowerCase().includes(search)
      );
    })
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  const totalOpen = quotes
    .filter((quote) => ["sent", "negotiation", "draft"].includes(quote.status))
    .reduce((sum, quote) => sum + quote.amount, 0);
  const totalWon = quotes
    .filter((quote) => quote.status === "won")
    .reduce((sum, quote) => sum + quote.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:flex">
          <Button
            variant="outline"
            asChild
            className="w-full justify-start sm:w-auto lg:justify-center"
          >
            <Link to="/quotes/reminders">
              <BellRing className="size-4" /> {t.reminderSettings}
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="w-full justify-start sm:w-auto lg:justify-center"
          >
            <Link to="/quotes/pipeline">
              <Columns3 className="size-4" /> {t.pipeline}
            </Link>
          </Button>
          <Button
            disabled={!canWriteQuotes}
            className="w-full justify-start sm:w-auto lg:justify-center"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> {t.newQuote}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.totalQuotes}</div>
          <div className="mt-1 text-2xl font-semibold">{quotes.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.pipelineValue}</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(totalOpen)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.wonValue}</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">
            {formatMoney(totalWon)}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.search}
              className="w-full pl-8"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allStatuses}</SelectItem>
              <SelectItem value="draft">{t.draft}</SelectItem>
              <SelectItem value="sent">{t.sent}</SelectItem>
              <SelectItem value="negotiation">{t.negotiation}</SelectItem>
              <SelectItem value="won">{t.won}</SelectItem>
              <SelectItem value="lost">{t.lost}</SelectItem>
              <SelectItem value="expired">{t.expired}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sp} onValueChange={setSp}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
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
        </div>
      </Card>

      <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-cyan-50/70 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-cyan-950 dark:text-slate-50">
              {t.opportunityBoard}
            </h2>
            <p className="text-xs text-cyan-900/70 dark:text-slate-300">{t.boardSubtitle}</p>
          </div>
          <Badge
            className="border-white/10 bg-white/80 text-cyan-900 shadow-sm dark:bg-slate-950/80 dark:text-slate-100"
            variant="outline"
          >
            {filtered.length} {t.opportunities}
          </Badge>
        </div>

        <div className="space-y-3">
          {filtered.map((quote, index) => {
            const partner = partners.find((item) => item.id === quote.partnerId);
            const operation = operations.find((item) => item.quoteId === quote.id);
            const quoteTasks = store.tasks().filter((task) => task.quoteId === quote.id);
            const expired = isQuoteExpired(quote);
            const origin = operation?.origin ?? partner?.country ?? "SFO";
            const destination = operation?.destination ?? "BOM";
            const trafficMode = operation?.trafficMode ?? (index % 2 === 0 ? "air" : "ocean");
            const ShippingIcon = trafficMode === "air" ? Plane : Ship;
            const serviceType = quote.amount > 25000 ? "Door to Door" : "Port to Door";
            const shippingType = quote.status === "negotiation" ? "Back to Back" : "Co-Load";
            const leadScore = Math.max(60, Math.min(100, Math.round(quote.amount / 500)));

            return (
              <div
                key={quote.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border dark:border-white/10 dark:bg-slate-950/90"
              >
                <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.1fr_1.15fr_0.8fr_0.8fr_1fr_auto] lg:items-center">
                  <div>
                    <Link
                      to="/quotes/$id"
                      params={{ id: quote.id }}
                      className="text-xl font-bold tracking-tight text-slate-950 hover:text-primary hover:underline dark:text-slate-50"
                    >
                      {quote.number}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground dark:text-slate-300">
                      {quote.subject}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                    <ShippingIcon className="size-5 text-slate-300 dark:text-slate-500" />
                    <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                      US
                    </span>
                    <span>{origin}</span>
                    <span className="text-muted-foreground dark:text-slate-400">-&gt;</span>
                    <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-xs dark:bg-emerald-900/50">
                      IN
                    </span>
                    <span>{destination}</span>
                  </div>

                  <MetaBlock label={t.shippingType} value={shippingType} />
                  <MetaBlock label={t.serviceType} value={serviceType} />

                  <div>
                    {partner ? (
                      <Link
                        to="/partners/$id"
                        params={{ id: partner.id }}
                        className="font-semibold text-cyan-600 hover:underline dark:text-cyan-300"
                      >
                        {partner.companyName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-cyan-600 dark:text-cyan-300">
                        {t.unassigned}
                      </span>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground dark:text-slate-300">
                      {t.closeDate}:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-100">
                        {quote.validUntil}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 lg:justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/quotes/$id" params={{ id: quote.id }}>
                        {t.open}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWriteQuotes}
                      onClick={() => {
                        setEditing(quote);
                        setOpen(true);
                      }}
                    >
                      {t.edit}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 border-t bg-slate-50/80 px-5 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-300 md:grid-cols-[1fr_1fr_1fr_1.6fr_1fr_1.4fr]">
                  <InfoChip
                    label={t.status}
                    value={quote.status}
                    badge={<Badge {...quoteStatusBadge(quote.status)} />}
                  />
                  <InfoChip
                    label={t.priority}
                    value={expired ? t.high : quote.amount > 25000 ? t.medium : t.low}
                    tone={expired ? "rose" : "amber"}
                  />
                  <InfoChip label={t.followUp} value={expired ? t.now : t.yes} tone="green" />
                  <div>
                    {t.salesRep}: <span className="font-semibold">{quote.salesperson}</span>
                  </div>
                  <div>
                    {t.leadScore}: <span className="font-semibold">{leadScore}</span>
                  </div>
                  <div>
                    {t.followUps}: <span className="font-semibold">{quoteTasks.length}</span>
                  </div>
                  <div>
                    {t.operation}:{" "}
                    <span className="font-semibold">
                      {operation ? (
                        <Link
                          to="/operations/$id"
                          params={{ id: operation.id }}
                          className="text-cyan-700 hover:underline"
                        >
                          {operation.number}
                        </Link>
                      ) : (
                        t.notLinked
                      )}
                    </span>
                  </div>
                  <div>
                    {t.createdAt}: <span className="font-semibold">{quote.createdAt}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-cyan-200 bg-white/80 py-10 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-300">
              {t.noQuotes}
            </div>
          )}
        </div>
      </section>

      <QuoteDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground dark:text-slate-300">{label}</div>
      <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}

function InfoChip({
  label,
  value,
  tone,
  badge,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber" | "rose";
  badge?: React.ReactNode;
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "rose"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="flex items-center gap-1.5">
      <span className="dark:text-slate-300">{label}:</span>
      {badge ?? (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass} dark:border dark:border-white/10 dark:bg-slate-800 dark:text-slate-100`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
