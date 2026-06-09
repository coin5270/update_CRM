import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, newId } from "@/lib/store";
import {
  recomputeAmount,
  formatMoney,
  generateFollowUpTasks,
  regenerateFollowUpTasks,
} from "@/lib/quote-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ReminderRulesEditor } from "@/components/ReminderRulesEditor";
import { toast } from "sonner";
import type { Quote, QuoteLine, QuoteStatus, ReminderRule } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Quote | null;
  defaultPartnerId?: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const plus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const emptyLine = (): QuoteLine => ({
  id: newId("ql"),
  description: "",
  quantity: 1,
  unitPrice: 0,
});

const empty: Quote = {
  id: "",
  number: "",
  partnerId: "",
  subject: "",
  status: "draft",
  currency: "USD",
  amount: 0,
  issueDate: today(),
  validUntil: plus(30),
  salesperson: store.salespeople()[0] ?? "Sales User",
  lines: [],
  createdAt: new Date().toISOString(),
};

export function QuoteDialog({ open, onOpenChange, initial, defaultPartnerId }: Props) {
  const locale = store.getLocale();
  const partners = store.partners();
  const firstPartnerId = partners[0]?.id ?? "";
  const salespeople = store.salespeople();
  const [form, setForm] = React.useState<Quote>(empty);
  const [autoFollowUps, setAutoFollowUps] = React.useState(true);
  const [customRules, setCustomRules] = React.useState(false);
  const [rules, setRules] = React.useState<ReminderRule[]>(() => store.reminderRules());
  const [originalValidUntil, setOriginalValidUntil] = React.useState<string>("");
  const [originalReminderRules, setOriginalReminderRules] = React.useState<
    ReminderRule[] | undefined
  >(undefined);
  const [showConfirmRegen, setShowConfirmRegen] = React.useState(false);
  const [pendingSave, setPendingSave] = React.useState<Quote | null>(null);
  const t =
    locale === "es"
      ? {
          edit: "Editar cotización",
          new: "Nueva cotización",
          quoteNumber: "Número de cotización",
          subject: "Asunto *",
          partner: "Empresa *",
          selectPartner: "Seleccionar empresa",
          contact: "Contacto",
          selectContact: "Seleccionar contacto",
          noContacts: "Sin contactos",
          status: "Estado",
          salesperson: "Vendedor",
          currency: "Moneda",
          issueDate: "Fecha de emisión",
          validUntil: "Válida hasta",
          lineItems: "Líneas",
          addLine: "Agregar línea",
          description: "Descripción",
          noLines: "Todavía no hay líneas.",
          total: "Total:",
          notes: "Notas",
          followUps: "Recordatorios de seguimiento",
          customPlan: "Usando un plan personalizado para esta cotización.",
          globalDefaults: "Usando los recordatorios globales por defecto.",
          customize: "Personalizar para esta cotización",
          noReminders: "No hay recordatorios configurados.",
          reminderHint: "Negativo = antes de la fecha de vencimiento, positivo = después.",
          autoCreate:
            "Crear automáticamente recordatorios de seguimiento a partir de la fecha de vencimiento",
          save: "Guardar cotización",
          cancel: "Cancelar",
          regenTitle: "¿Regenerar recordatorios?",
          regenDescription:
            "La fecha de vencimiento o las reglas de recordatorio de esta cotización cambiaron. Esto eliminará los recordatorios automáticos existentes y creará otros nuevos según la configuración actual. Las tareas creadas manualmente se conservarán.",
          keepExisting: "Conservar los recordatorios existentes",
          regenerate: "Regenerar recordatorios",
          quoteUpdated: "Cotización actualizada.",
          quoteCreated: "Cotización creada.",
          remindersSkipped: "Recordatorios omitidos: esta cotización está cerrada/archivada.",
          remindersRegenerated: (removed: number, created: number) =>
            `Recordatorios regenerados: ${removed} eliminados, ${created} creados.`,
          remindersNotNeeded: "No se necesitan recordatorios (todas las fechas ya pasaron).",
          remindersCreated: (created: number) =>
            `Se creó ${created} recordatorio de seguimiento${created > 1 ? "s" : ""}.`,
        }
      : {
          edit: "Edit quote",
          new: "New quote",
          quoteNumber: "Quote number",
          subject: "Subject *",
          partner: "Business partner *",
          selectPartner: "Select partner",
          contact: "Contact",
          selectContact: "Select contact",
          noContacts: "No contacts",
          status: "Status",
          salesperson: "Salesperson",
          currency: "Currency",
          issueDate: "Issue date",
          validUntil: "Valid until",
          lineItems: "Line items",
          addLine: "Add line",
          description: "Description",
          noLines: "No lines yet.",
          total: "Total:",
          notes: "Notes",
          followUps: "Follow-up reminders",
          customPlan: "Using a custom plan for this quote.",
          globalDefaults: "Using the global reminder defaults.",
          customize: "Customize for this quote",
          noReminders: "No reminders configured.",
          reminderHint: "Negative = before valid-until, positive = after.",
          autoCreate: "Auto-create follow-up reminders from valid-until date",
          save: "Save quote",
          cancel: "Cancel",
          regenTitle: "Regenerate reminders?",
          regenDescription:
            "The valid-until date or reminder rules for this quote have changed. This will remove the existing auto-generated reminders and create new ones based on the updated settings. Manually created tasks will be preserved.",
          keepExisting: "Keep existing reminders",
          regenerate: "Regenerate reminders",
          quoteUpdated: "Quote updated.",
          quoteCreated: "Quote created.",
          remindersSkipped: "Reminders skipped: this quote is closed/archived.",
          remindersRegenerated: (removed: number, created: number) =>
            `Regenerated reminders: ${removed} removed, ${created} created.`,
          remindersNotNeeded: "No reminders needed (all dates are in the past).",
          remindersCreated: (created: number) =>
            `Created ${created} follow-up reminder${created > 1 ? "s" : ""}.`,
        };

  React.useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ ...initial, lines: initial.lines.length ? initial.lines : [emptyLine()] });
        setCustomRules(Array.isArray(initial.reminderRules));
        setRules(initial.reminderRules ?? store.reminderRules());
        setOriginalValidUntil(initial.validUntil);
        setOriginalReminderRules(initial.reminderRules);
      } else {
        setForm({
          ...empty,
          id: newId("q"),
          number: `Q-${Math.floor(1000 + Math.random() * 9000)}`,
          partnerId: defaultPartnerId ?? firstPartnerId,
          lines: [emptyLine()],
        });
        setCustomRules(false);
        setRules(store.reminderRules());
        setOriginalValidUntil("");
        setOriginalReminderRules(undefined);
      }
    }
  }, [open, initial, defaultPartnerId, firstPartnerId]);

  const update = <K extends keyof Quote>(k: K, v: Quote[K]) => setForm((f) => ({ ...f, [k]: v }));

  const updateLine = (id: string, patch: Partial<QuoteLine>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = (id: string) =>
    setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.id !== id) }));

  const contacts = form.partnerId ? store.contactsByPartner(form.partnerId) : [];
  const total = recomputeAmount(form.lines);

  const remindersChanged = initial
    ? form.validUntil !== originalValidUntil ||
      JSON.stringify(customRules ? rules : undefined) !== JSON.stringify(originalReminderRules)
    : false;

  const finalizeSave = (toSave: Quote, shouldRegenerate: boolean) => {
    store.upsertQuote(toSave);
    toast.success(initial ? t.quoteUpdated : t.quoteCreated);
    if (autoFollowUps) {
      const closedOrArchived =
        toSave.status === "won" || toSave.status === "lost" || toSave.status === "expired";
      if (closedOrArchived) {
        toast.info(t.remindersSkipped);
      } else if (initial && shouldRegenerate) {
        const { removed, created } = regenerateFollowUpTasks(toSave);
        if (removed > 0 || created > 0) {
          toast.success(t.remindersRegenerated(removed, created));
        } else {
          toast.info(t.remindersNotNeeded);
        }
      } else if (!initial) {
        const created = generateFollowUpTasks(toSave);
        if (created > 0) toast.success(t.remindersCreated(created));
      }
    }
    setShowConfirmRegen(false);
    setPendingSave(null);
    onOpenChange(false);
  };

  const onSave = () => {
    if (!form.subject.trim() || !form.partnerId) return;
    const toSave: Quote = {
      ...form,
      amount: total,
      reminderRules: customRules ? rules : undefined,
    };
    if (autoFollowUps && initial && remindersChanged) {
      const closedOrArchived =
        toSave.status === "won" || toSave.status === "lost" || toSave.status === "expired";
      if (!closedOrArchived) {
        setPendingSave(toSave);
        setShowConfirmRegen(true);
        return;
      }
    }
    finalizeSave(toSave, false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? t.edit : t.new}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t.quoteNumber}</Label>
            <Input value={form.number} onChange={(e) => update("number", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.subject}</Label>
            <Input value={form.subject} onChange={(e) => update("subject", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.partner}</Label>
            <Select value={form.partnerId} onValueChange={(v) => update("partnerId", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectPartner} />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.contact}</Label>
            <Select
              value={form.contactId ?? ""}
              onValueChange={(v) => update("contactId", v)}
              disabled={contacts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={contacts.length ? t.selectContact : t.noContacts} />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.status}</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v as QuoteStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{locale === "es" ? "Borrador" : "Draft"}</SelectItem>
                <SelectItem value="sent">{locale === "es" ? "Enviada" : "Sent"}</SelectItem>
                <SelectItem value="negotiation">
                  {locale === "es" ? "Negociación" : "Negotiation"}
                </SelectItem>
                <SelectItem value="won">{locale === "es" ? "Ganada" : "Won"}</SelectItem>
                <SelectItem value="lost">{locale === "es" ? "Perdida" : "Lost"}</SelectItem>
                <SelectItem value="expired">{locale === "es" ? "Vencida" : "Expired"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.salesperson}</Label>
            <Select value={form.salesperson} onValueChange={(v) => update("salesperson", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.currency}</Label>
            <Input
              value={form.currency}
              onChange={(e) => update("currency", e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.issueDate}</Label>
            <Input
              type="date"
              value={form.issueDate}
              onChange={(e) => update("issueDate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.validUntil}</Label>
            <Input
              type="date"
              value={form.validUntil}
              onChange={(e) => update("validUntil", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <Label>{t.lineItems}</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="size-4" /> {t.addLine}
            </Button>
          </div>
          <div className="border rounded-md divide-y">
            {form.lines.map((l) => (
              <div key={l.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                <Input
                  className="col-span-6"
                  placeholder={t.description}
                  value={l.description}
                  onChange={(e) => updateLine(l.id, { description: e.target.value })}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  min={0}
                  step="1"
                  value={l.quantity}
                  onChange={(e) => updateLine(l.id, { quantity: Number(e.target.value) })}
                />
                <Input
                  className="col-span-3"
                  type="number"
                  min={0}
                  step="0.01"
                  value={l.unitPrice}
                  onChange={(e) => updateLine(l.id, { unitPrice: Number(e.target.value) })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-span-1 text-destructive"
                  onClick={() => removeLine(l.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {form.lines.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">{t.noLines}</div>
            )}
          </div>
          <div className="flex justify-end text-sm font-medium">
            {t.total} {formatMoney(total, form.currency)}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t.notes}</Label>
          <Textarea
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Label className="text-sm">{t.followUps}</Label>
              <p className="text-xs text-muted-foreground">
                {customRules ? t.customPlan : t.globalDefaults}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch
                checked={customRules}
                onCheckedChange={(v) => {
                  setCustomRules(v);
                  if (v) setRules((r) => (r.length ? r : store.reminderRules()));
                }}
              />
              {t.customize}
            </label>
          </div>
          {customRules && <ReminderRulesEditor rules={rules} onChange={setRules} />}
        </div>

        <DialogFooter className="sm:justify-between gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={autoFollowUps}
              onCheckedChange={(v) => setAutoFollowUps(v === true)}
            />
            {t.autoCreate}
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={onSave}>{t.save}</Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showConfirmRegen} onOpenChange={setShowConfirmRegen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.regenTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.regenDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowConfirmRegen(false);
                if (pendingSave) finalizeSave(pendingSave, false);
              }}
            >
              {t.keepExisting}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSave) finalizeSave(pendingSave, true);
              }}
            >
              {t.regenerate}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
