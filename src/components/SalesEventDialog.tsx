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
import type { SalesEvent, SalesTask } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: SalesTask | null;
  partnerId?: string;
  initial: SalesEvent | null;
}

const today = () => new Date().toISOString().slice(0, 10);

const empty: SalesEvent = {
  id: "",
  partnerId: "",
  kind: "follow_up",
  action: "",
  note: "",
  occurredAt: today(),
  actor: store.getUser()?.name ?? "Sales User",
};

export function SalesEventDialog({ open, onOpenChange, task, partnerId, initial }: Props) {
  const locale = store.getLocale();
  const partners = store.partners();
  const firstPartnerId = partners[0]?.id ?? "";
  const contacts = partnerId ? store.contactsByPartner(partnerId) : [];
  const tasks = partnerId ? store.tasksByPartner(partnerId) : store.tasks();
  const [form, setForm] = React.useState<SalesEvent>(empty);
  const t =
    locale === "es"
      ? {
          edit: "Editar evento comercial",
          new: "Nuevo evento comercial",
          action: "Acción *",
          type: "Tipo",
          partner: "Empresa",
          task: "Tarea",
          contact: "Contacto",
          nextContact: "Próximo contacto",
          date: "Fecha",
          note: "Nota",
          cancel: "Cancelar",
          save: "Guardar evento",
          followUp: "Seguimiento",
          call: "Llamada",
          email: "Correo",
          meeting: "Reunión",
          statusChange: "Cambio de estado",
          quoteUpdate: "Actualización de cotización",
          none: "Ninguno",
          selectPartner: "Seleccionar empresa",
          selectTask: "Seleccionar tarea",
          selectContact: "Seleccionar contacto",
          noContacts: "Ninguno",
          noTasks: "Ninguna",
          placeholder: "¿Qué sucedió en la llamada, correo o reunión?",
          notePlaceholder: "Detalle opcional sobre la acción.",
          created: "Evento comercial creado.",
          updated: "Evento comercial actualizado.",
        }
      : {
          edit: "Edit sales event",
          new: "New sales event",
          action: "Action *",
          type: "Type",
          partner: "Partner",
          task: "Task",
          contact: "Contact",
          nextContact: "Next contact date",
          date: "Date",
          note: "Note",
          cancel: "Cancel",
          save: "Save event",
          followUp: "Follow-up",
          call: "Call",
          email: "Email",
          meeting: "Meeting",
          statusChange: "Status change",
          quoteUpdate: "Quote update",
          none: "None",
          selectPartner: "Select partner",
          selectTask: "Select task",
          selectContact: "Select contact",
          noContacts: "None",
          noTasks: "None",
          placeholder: "What happened on the call, email, or meeting?",
          notePlaceholder: "Optional detail about the action.",
          created: "Sales event created.",
          updated: "Sales event updated.",
        };

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({ ...initial });
      return;
    }
    setForm({
      ...empty,
      id: newId("se"),
      partnerId: partnerId ?? task?.partnerId ?? firstPartnerId,
      taskId: task?.id,
      quoteId: task?.quoteId,
      contactId: task?.contactId,
      actor: store.getUser()?.name ?? "Sales User",
    });
  }, [
    initial,
    open,
    partnerId,
    firstPartnerId,
    task?.contactId,
    task?.id,
    task?.partnerId,
    task?.quoteId,
  ]);

  const update = <K extends keyof SalesEvent>(key: K, value: SalesEvent[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const onSave = () => {
    if (!form.partnerId || !form.action.trim()) return;
    store.upsertSalesEvent(form);
    store.upsertHistoryEvent({
      id: newId("h"),
      partnerId: form.partnerId,
      type: "interaction",
      title: `Sales event recorded: ${form.action}`,
      description:
        form.note ||
        `${form.kind} event recorded${form.nextContactDate ? ` for ${form.nextContactDate}` : ""}.`,
      occurredAt: form.occurredAt,
      actor: form.actor,
      quoteId: form.quoteId,
      taskId: form.taskId,
    });
    toast.success(initial ? t.updated : t.created);
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
            <Label>{t.action}</Label>
            <Textarea
              rows={3}
              value={form.action}
              onChange={(event) => update("action", event.target.value)}
              placeholder={t.placeholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.type}</Label>
            <Select value={form.kind} onValueChange={(value) => update("kind", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up">{t.followUp}</SelectItem>
                <SelectItem value="call">{t.call}</SelectItem>
                <SelectItem value="email">{t.email}</SelectItem>
                <SelectItem value="meeting">{t.meeting}</SelectItem>
                <SelectItem value="status_change">{t.statusChange}</SelectItem>
                <SelectItem value="quote_update">{t.quoteUpdate}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.partner}</Label>
            <Select value={form.partnerId} onValueChange={(value) => update("partnerId", value)}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectPartner} />
              </SelectTrigger>
              <SelectContent>
                {partners.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.task}</Label>
            <Select
              value={form.taskId ?? "__none__"}
              onValueChange={(value) => update("taskId", value === "__none__" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectTask} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {tasks.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.subject}
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
            >
              <SelectTrigger>
                <SelectValue placeholder={contacts.length ? t.selectContact : t.noContacts} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {contacts.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.firstName} {item.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.nextContact}</Label>
            <Input
              type="date"
              value={form.nextContactDate ?? ""}
              onChange={(event) => update("nextContactDate", event.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.date}</Label>
            <Input
              type="date"
              value={form.occurredAt}
              onChange={(event) => update("occurredAt", event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.note}</Label>
            <Textarea
              rows={5}
              value={form.note ?? ""}
              onChange={(event) => update("note", event.target.value)}
              placeholder={t.notePlaceholder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={onSave}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
