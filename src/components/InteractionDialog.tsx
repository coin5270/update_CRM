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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { newId, store } from "@/lib/store";
import { toast } from "sonner";
import type {
  Interaction,
  InteractionChannel,
  InteractionDirection,
  Quote,
  SalesTask,
} from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Interaction | null;
  defaultPartnerId?: string;
  defaultContactId?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const empty: Interaction = {
  id: "",
  partnerId: "",
  channel: "note",
  direction: "internal",
  subject: "",
  body: "",
  occurredAt: today(),
  createdBy: store.salespeople()[0] ?? "Sales User",
};

export function InteractionDialog({
  open,
  onOpenChange,
  initial,
  defaultPartnerId,
  defaultContactId,
}: Props) {
  const locale = store.getLocale();
  const partners = store.partners();
  const salespeople = store.salespeople();
  const fallbackPartnerId = partners[0]?.id ?? "";
  const [form, setForm] = React.useState<Interaction>(empty);
  const t =
    locale === "es"
      ? {
          edit: "Editar interacción",
          new: "Nueva interacción",
          subject: "Asunto *",
          partner: "Empresa *",
          selectPartner: "Seleccionar empresa",
          contact: "Contacto",
          none: "Ninguno",
          selectContact: "Seleccionar contacto",
          noContacts: "Sin contactos",
          channel: "Canal",
          direction: "Dirección",
          email: "Email",
          whatsapp: "WhatsApp",
          call: "Llamada",
          meeting: "Reunión",
          note: "Nota",
          outbound: "Saliente",
          inbound: "Entrante",
          internal: "Interna",
          relatedQuote: "Cotización relacionada",
          selectQuote: "Seleccionar cotización",
          noQuotes: "Sin cotizaciones",
          relatedTask: "Tarea relacionada",
          selectTask: "Seleccionar tarea",
          noTasks: "Sin tareas",
          date: "Fecha",
          owner: "Responsable",
          message: "Mensaje / notas",
          cancel: "Cancelar",
          save: "Guardar interacción",
          interactionUpdated: "Interacción actualizada.",
          interactionCreated: "Interacción creada.",
          recordedPrefix: "Interacción registrada:",
          activityRecorded: (direction: string, channel: string) =>
            `Actividad ${direction} ${channel} registrada.`,
        }
      : {
          edit: "Edit interaction",
          new: "New interaction",
          subject: "Subject *",
          partner: "Business partner *",
          selectPartner: "Select partner",
          contact: "Contact",
          none: "None",
          selectContact: "Select contact",
          noContacts: "No contacts",
          channel: "Channel",
          direction: "Direction",
          email: "Email",
          whatsapp: "WhatsApp",
          call: "Call",
          meeting: "Meeting",
          note: "Note",
          outbound: "Outbound",
          inbound: "Inbound",
          internal: "Internal",
          relatedQuote: "Related quote",
          selectQuote: "Select quote",
          noQuotes: "No quotes",
          relatedTask: "Related task",
          selectTask: "Select task",
          noTasks: "No tasks",
          date: "Date",
          owner: "Owner",
          message: "Message / notes",
          cancel: "Cancel",
          save: "Save interaction",
          interactionUpdated: "Interaction updated.",
          interactionCreated: "Interaction created.",
          recordedPrefix: "Interaction recorded:",
          activityRecorded: (direction: string, channel: string) =>
            `${direction} ${channel} activity recorded.`,
        };

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({ ...initial });
      return;
    }
    const partnerId = defaultPartnerId ?? fallbackPartnerId;
    setForm({
      ...empty,
      id: newId("i"),
      partnerId,
      contactId: defaultContactId,
    });
  }, [defaultContactId, defaultPartnerId, fallbackPartnerId, initial, open]);

  const update = <K extends keyof Interaction>(key: K, value: Interaction[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const contacts = form.partnerId ? store.contactsByPartner(form.partnerId) : [];
  const quotes = form.partnerId ? store.quotesByPartner(form.partnerId) : store.quotes();
  const tasks = React.useMemo<SalesTask[]>(() => {
    return store
      .tasks()
      .filter((task) => !form.partnerId || task.partnerId === form.partnerId)
      .filter((task) => !form.quoteId || task.quoteId === form.quoteId);
  }, [form.partnerId, form.quoteId]);

  const selectedQuote = form.quoteId ? store.quote(form.quoteId) : undefined;

  const onSave = () => {
    if (!form.partnerId || !form.subject.trim()) return;
    store.upsertInteraction(form);
    if (!initial) {
      store.upsertHistoryEvent({
        id: newId("h"),
        partnerId: form.partnerId,
        type: "interaction",
        title: `${t.recordedPrefix} ${form.subject}`,
        description: form.body || t.activityRecorded(form.direction, form.channel),
        occurredAt: form.occurredAt,
        actor: form.createdBy,
        quoteId: form.quoteId,
        taskId: form.taskId,
      });
    }
    toast.success(initial ? t.interactionUpdated : t.interactionCreated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? t.edit : t.new}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.subject}</Label>
            <Input
              value={form.subject}
              onChange={(event) => update("subject", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.partner}</Label>
            <Select
              value={form.partnerId}
              onValueChange={(value) => {
                update("partnerId", value);
                update("contactId", undefined);
                update("quoteId", undefined);
                update("taskId", undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectPartner} />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.contact}</Label>
            <Select
              value={form.contactId ?? "__none__"}
              onValueChange={(value) =>
                update("contactId", value === "__none__" ? undefined : value)
              }
              disabled={contacts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={contacts.length ? t.selectContact : t.noContacts} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.channel}</Label>
            <Select
              value={form.channel}
              onValueChange={(value) => update("channel", value as InteractionChannel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">{t.email}</SelectItem>
                <SelectItem value="whatsapp">{t.whatsapp}</SelectItem>
                <SelectItem value="call">{t.call}</SelectItem>
                <SelectItem value="meeting">{t.meeting}</SelectItem>
                <SelectItem value="note">{t.note}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.direction}</Label>
            <Select
              value={form.direction}
              onValueChange={(value) => update("direction", value as InteractionDirection)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">{t.outbound}</SelectItem>
                <SelectItem value="inbound">{t.inbound}</SelectItem>
                <SelectItem value="internal">{t.internal}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.relatedQuote}</Label>
            <Select
              value={form.quoteId ?? "__none__"}
              onValueChange={(value) => {
                update("quoteId", value === "__none__" ? undefined : value);
                update("taskId", undefined);
              }}
              disabled={quotes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={quotes.length ? t.selectQuote : t.noQuotes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {quotes.map((quote: Quote) => (
                  <SelectItem key={quote.id} value={quote.id}>
                    {quote.number} - {quote.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedQuote && (
              <div className="text-xs text-muted-foreground">{selectedQuote.status}</div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t.relatedTask}</Label>
            <Select
              value={form.taskId ?? "__none__"}
              onValueChange={(value) => update("taskId", value === "__none__" ? undefined : value)}
              disabled={tasks.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={tasks.length ? t.selectTask : t.noTasks} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.date}</Label>
            <Input
              type="date"
              value={form.occurredAt}
              onChange={(event) => update("occurredAt", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.owner}</Label>
            <Select value={form.createdBy} onValueChange={(value) => update("createdBy", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.message}</Label>
            <Textarea
              rows={4}
              value={form.body}
              onChange={(event) => update("body", event.target.value)}
            />
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
