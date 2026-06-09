import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newId, store } from "@/lib/store";
import type { PipelineStage, QuoteStatus, SalesPipeline } from "@/lib/types";

const STATUS_OPTIONS: Array<{ status: QuoteStatus; label: string }> = [
  { status: "draft", label: "Draft" },
  { status: "sent", label: "Sent" },
  { status: "negotiation", label: "Negotiation" },
  { status: "won", label: "Won" },
  { status: "lost", label: "Lost" },
  { status: "expired", label: "Expired" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: SalesPipeline | null;
}

function normalizePipeline(initial: SalesPipeline | null): SalesPipeline {
  const existingByStatus = new Map<QuoteStatus, PipelineStage>();
  initial?.stages.forEach((stage) => {
    if (!existingByStatus.has(stage.status)) existingByStatus.set(stage.status, stage);
  });

  return {
    id: initial?.id ?? "pipeline-default",
    name: initial?.name ?? "Sales pipeline",
    description: initial?.description ?? "Default opportunity stages for the CRM.",
    stages: STATUS_OPTIONS.map(({ status, label }, index) => {
      const existing = existingByStatus.get(status);
      return {
        id: existing?.id ?? `pipeline-stage-${status}`,
        name: existing?.name ?? label,
        status,
        order: existing?.order ?? index + 1,
      };
    }).sort((a, b) => a.order - b.order),
  };
}

export function PipelineDialog({ open, onOpenChange, initial }: Props) {
  const locale = store.getLocale();
  const [form, setForm] = React.useState<SalesPipeline>(() => normalizePipeline(initial));
  const t =
    locale === "es"
      ? {
          edit: "Editar pipeline",
          name: "Nombre *",
          description: "Descripción",
          stages: "Etapas",
          status: "Estado",
          stageName: "Nombre de etapa",
          order: "Orden",
          cancel: "Cancelar",
          save: "Guardar pipeline",
          draft: "Borrador",
          sent: "Enviada",
          negotiation: "Negociación",
          won: "Ganada",
          lost: "Perdida",
          expired: "Vencida",
        }
      : {
          edit: "Edit pipeline",
          name: "Name *",
          description: "Description",
          stages: "Stages",
          status: "Status",
          stageName: "Stage name",
          order: "Order",
          cancel: "Cancel",
          save: "Save pipeline",
          draft: "Draft",
          sent: "Sent",
          negotiation: "Negotiation",
          won: "Won",
          lost: "Lost",
          expired: "Expired",
        };
  const statusLabels: Record<QuoteStatus, string> = {
    draft: t.draft,
    sent: t.sent,
    negotiation: t.negotiation,
    won: t.won,
    lost: t.lost,
    expired: t.expired,
  };

  React.useEffect(() => {
    if (open) setForm(normalizePipeline(initial));
  }, [initial, open]);

  const updateStage = <K extends keyof PipelineStage>(
    status: QuoteStatus,
    key: K,
    value: PipelineStage[K],
  ) => {
    setForm((current) => ({
      ...current,
      stages: current.stages.map((stage) =>
        stage.status === status ? { ...stage, [key]: value } : stage,
      ),
    }));
  };

  const onSave = () => {
    if (!form.name.trim()) return;

    store.upsertPipeline({
      ...form,
      id: form.id || newId("pipeline"),
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      stages: form.stages
        .map((stage, index) => ({
          ...stage,
          name:
            stage.name.trim() ||
            STATUS_OPTIONS.find((option) => option.status === stage.status)!.label,
          order: Number.isFinite(stage.order) ? stage.order : index + 1,
        }))
        .sort((a, b) => a.order - b.order),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{t.edit}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t.name}</Label>
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.description}</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">{t.stages}</div>
          <div className="space-y-2">
            {form.stages.map((stage) => (
              <div
                key={stage.status}
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_2fr_96px]"
              >
                <div>
                  <Label>{t.status}</Label>
                  <div className="mt-2 text-sm font-medium">{statusLabels[stage.status]}</div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.stageName}</Label>
                  <Input
                    value={stage.name}
                    onChange={(event) => updateStage(stage.status, "name", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.order}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={stage.order}
                    onChange={(event) =>
                      updateStage(stage.status, "order", Number(event.target.value))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={onSave}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
