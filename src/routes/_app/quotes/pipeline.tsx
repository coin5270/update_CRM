import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { LayoutList, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { store, useStoreVersion } from "@/lib/store";
import { QuoteDialog } from "@/components/QuoteDialog";
import { PipelineDialog } from "@/components/PipelineDialog";
import { formatMoney, quoteStatusBadge } from "@/lib/quote-utils";
import type { PipelineStage, Quote, QuoteStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/quotes/pipeline")({
  component: PipelinePage,
});

type BoardColumn = { id: QuoteStatus; label: string };

const FALLBACK_COLUMNS: BoardColumn[] = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "expired", label: "Expired" },
];

function pipelineColumns(stages: PipelineStage[] = []): BoardColumn[] {
  const byStatus = new Map<QuoteStatus, BoardColumn>();
  stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((stage) => {
      if (!byStatus.has(stage.status)) {
        byStatus.set(stage.status, { id: stage.status, label: stage.name });
      }
    });

  FALLBACK_COLUMNS.forEach((column) => {
    if (!byStatus.has(column.id)) byStatus.set(column.id, column);
  });

  return Array.from(byStatus.values());
}

function PipelinePage() {
  useStoreVersion();
  const locale = store.getLocale();
  const quotes = store.quotes();
  const partners = store.partners();
  const pipeline = store.pipeline()[0];
  const user = store.getUser();
  const canWriteQuotes = user?.permissions?.includes("quotes:write") ?? false;
  const canManagePipeline = user?.permissions?.includes("pipeline:write") ?? false;
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const t =
    locale === "es"
      ? {
          title: "Pipeline de cotizaciones",
          subtitle: "Arrastra las cotizaciones entre columnas para cambiar su estado.",
          pipelineSettings: "Configuración del pipeline",
          listView: "Vista de lista",
          newQuote: "Nueva cotización",
          pipeline: "Pipeline",
          defaultPipeline: "Pipeline predeterminado",
          pipelineDescription: "Las cotizaciones pasan por las etapas comerciales por defecto.",
          stageValue: "Valor de la etapa",
          dropHere: "Suelta aquí",
          quoteMoved: (next: string) => `Cotización movida a ${next}.`,
          draft: "Borrador",
          sent: "Enviada",
          negotiation: "Negociación",
          won: "Ganada",
          lost: "Perdida",
          expired: "Vencida",
        }
      : {
          title: "Quotes Pipeline",
          subtitle: "Drag quotes between columns to change their status.",
          pipelineSettings: "Pipeline settings",
          listView: "List view",
          newQuote: "New quote",
          pipeline: "Pipeline",
          defaultPipeline: "Default pipeline",
          pipelineDescription: "Quotes move through the default sales stages.",
          stageValue: "Stage value",
          dropHere: "Drop here",
          quoteMoved: (next: string) => `Quote moved to ${next}.`,
          draft: "Draft",
          sent: "Sent",
          negotiation: "Negotiation",
          won: "Won",
          lost: "Lost",
          expired: "Expired",
        };
  const columnLabels: Record<QuoteStatus, string> = {
    draft: t.draft,
    sent: t.sent,
    negotiation: t.negotiation,
    won: t.won,
    lost: t.lost,
    expired: t.expired,
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const columns = React.useMemo<BoardColumn[]>(
    () => pipelineColumns(pipeline?.stages ?? []),
    [pipeline],
  );

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const overId = event.over?.id;
    if (!canWriteQuotes) return;
    if (!overId) return;
    const quote = store.quote(String(event.active.id));
    if (!quote) return;
    const next = String(overId) as QuoteStatus;
    if (quote.status === next) return;
    store.upsertQuote({ ...quote, status: next });
    toast.success(t.quoteMoved(next));
  };

  const activeQuote = activeId ? quotes.find((quote) => quote.id === activeId) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!canManagePipeline}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" /> {t.pipelineSettings}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/quotes">
              <LayoutList className="size-4" /> {t.listView}
            </Link>
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> {t.newQuote}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{t.pipeline}</div>
            <div className="mt-1 text-lg font-semibold">{pipeline?.name ?? t.defaultPipeline}</div>
            <div className="text-sm text-muted-foreground">
              {pipeline?.description ?? t.pipelineDescription}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(pipeline?.stages?.length ? pipeline.stages : []).map((stage) => (
              <Badge key={stage.id} variant="secondary">
                {stage.name}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-2">
          <div
            className="grid min-w-max gap-4"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))` }}
          >
            {columns.map((column) => {
              const colQuotes = quotes.filter((quote) => quote.status === column.id);
              const total = colQuotes.reduce((sum, quote) => sum + quote.amount, 0);
              return (
                <Column
                  key={column.id}
                  id={column.id}
                  label={columnLabels[column.id]}
                  count={colQuotes.length}
                  total={total}
                  stageValueLabel={t.stageValue}
                >
                  {colQuotes.map((quote) => {
                    const partner = partners.find((partner) => partner.id === quote.partnerId);
                    return (
                      <QuoteCard
                        key={quote.id}
                        quote={quote}
                        partnerName={partner?.companyName}
                        hidden={activeId === quote.id}
                        disabled={!canWriteQuotes}
                      />
                    );
                  })}
                  {colQuotes.length === 0 && (
                    <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                      {t.dropHere}
                    </div>
                  )}
                </Column>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeQuote ? (
            <QuoteCardVisual
              quote={activeQuote}
              partnerName={
                partners.find((partner) => partner.id === activeQuote.partnerId)?.companyName
              }
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <QuoteDialog open={open} onOpenChange={setOpen} initial={null} />
      <PipelineDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initial={pipeline ?? null}
      />
    </div>
  );
}

function Column({
  id,
  label,
  count,
  total,
  stageValueLabel,
  children,
}: {
  id: QuoteStatus;
  label: string;
  count: number;
  total: number;
  stageValueLabel: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{formatMoney(total)}</span>
      </div>
      <div className="mb-2 rounded-md border bg-white/70 px-2 py-1 text-[11px] text-muted-foreground">
        {stageValueLabel}:{" "}
        <span className="font-semibold text-slate-700">{formatMoney(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={
          "flex-1 rounded-lg p-2 space-y-2 transition-colors min-h-[60vh] " +
          (isOver ? "bg-primary/10 ring-2 ring-primary/40" : "bg-muted/40")
        }
      >
        {children}
      </div>
    </div>
  );
}

function QuoteCard({
  quote,
  partnerName,
  hidden,
  disabled,
}: {
  quote: Quote;
  partnerName?: string;
  hidden?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: quote.id, disabled });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={hidden ? "opacity-30" : ""}
      style={{ touchAction: disabled ? "auto" : "none" }}
    >
      <QuoteCardVisual quote={quote} partnerName={partnerName} disabled={disabled} />
    </div>
  );
}

function QuoteCardVisual({
  quote,
  partnerName,
  dragging,
  disabled,
}: {
  quote: Quote;
  partnerName?: string;
  dragging?: boolean;
  disabled?: boolean;
}) {
  return (
    <Card
      className={
        "p-3 " +
        (disabled ? "cursor-default " : "cursor-grab active:cursor-grabbing ") +
        (dragging ? "shadow-lg ring-1 ring-primary/30" : "")
      }
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{quote.number}</span>
        <Badge {...quoteStatusBadge(quote.status)} />
      </div>
      <div className="text-sm font-medium mt-1 line-clamp-2">{quote.subject}</div>
      {partnerName && (
        <div className="text-xs text-muted-foreground mt-1 truncate">{partnerName}</div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold">{formatMoney(quote.amount, quote.currency)}</span>
        <span className="text-xs text-muted-foreground">{quote.salesperson}</span>
      </div>
    </Card>
  );
}
