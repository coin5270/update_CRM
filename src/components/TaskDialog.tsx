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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, newId } from "@/lib/store";
import type { ContactMethod, Operation, SalesTask, TaskPriority, TaskStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: SalesTask | null;
  defaultPartnerId?: string;
  defaultQuoteId?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const empty: SalesTask = {
  id: "",
  subject: "",
  responsibleUser: store.salespeople()[0] ?? "Sales User",
  salesperson: store.salespeople()[0] ?? "Sales User",
  createdAt: new Date().toISOString(),
  dueDate: today(),
  priority: "medium",
  status: "pending",
  contactMethod: "call",
};

export function TaskDialog({
  open,
  onOpenChange,
  initial,
  defaultPartnerId,
  defaultQuoteId,
}: Props) {
  const locale = store.getLocale();
  const partners = store.partners();
  const operations = store.operations();
  const salespeople = store.salespeople();
  const [form, setForm] = React.useState<SalesTask>(empty);
  const t =
    locale === "es"
      ? {
          edit: "Editar seguimiento",
          new: "Nuevo seguimiento",
          subject: "Asunto *",
          partner: "Empresa",
          none: "Ninguno",
          contact: "Contacto",
          selectContact: "Seleccionar contacto",
          noContacts: "Sin contactos",
          email: "Correo",
          phone: "Teléfono",
          dueDate: "Fecha de vencimiento",
          dueTime: "Hora de vencimiento",
          nextContactDate: "Próximo contacto",
          priority: "Prioridad",
          status: "Estado",
          contactMethod: "Método de contacto",
          salesperson: "Vendedor",
          responsibleUser: "Usuario responsable",
          relatedQuote: "Cotización relacionada",
          selectQuote: "Seleccionar cotización",
          noQuotes: "Sin cotizaciones",
          relatedTransaction: "Transacción relacionada",
          associateTransaction: "Asociar transacción",
          noTransactions: "Sin transacciones",
          comment: "Comentario",
          cancel: "Cancelar",
          save: "Guardar seguimiento",
          taskUpdated: "Seguimiento actualizado.",
          taskCreated: "Seguimiento creado.",
          pending: "Pendiente",
          inProgress: "En progreso",
          onHold: "En espera",
          completed: "Completado",
          cancelled: "Cancelado",
          low: "Baja",
          medium: "Media",
          high: "Alta",
          urgent: "Urgente",
          call: "Llamada",
          whatsapp: "WhatsApp",
          emailMethod: "Correo",
          social: "Redes sociales",
          meeting: "Reunión",
        }
      : {
          edit: "Edit follow-up",
          new: "New follow-up",
          subject: "Subject *",
          partner: "Business partner",
          none: "None",
          contact: "Contact",
          selectContact: "Select contact",
          noContacts: "No contacts",
          email: "Email",
          phone: "Phone",
          dueDate: "Due date",
          dueTime: "Due time",
          nextContactDate: "Next contact date",
          priority: "Priority",
          status: "Status",
          contactMethod: "Contact method",
          salesperson: "Salesperson",
          responsibleUser: "Responsible user",
          relatedQuote: "Related quote",
          selectQuote: "Select quote",
          noQuotes: "No quotes",
          relatedTransaction: "Related transaction",
          associateTransaction: "Associate transaction",
          noTransactions: "No transactions",
          comment: "Comment",
          cancel: "Cancel",
          save: "Save follow-up",
          taskUpdated: "Task updated.",
          taskCreated: "Task created.",
          pending: "Pending",
          inProgress: "In progress",
          onHold: "On hold",
          completed: "Completed",
          cancelled: "Cancelled",
          low: "Low",
          medium: "Medium",
          high: "High",
          urgent: "Urgent",
          call: "Call",
          whatsapp: "WhatsApp",
          emailMethod: "Email",
          social: "Social media",
          meeting: "Meeting",
        };

  React.useEffect(() => {
    if (open) {
      if (initial) setForm({ ...initial });
      else
        setForm({ ...empty, id: newId("t"), partnerId: defaultPartnerId, quoteId: defaultQuoteId });
    }
  }, [open, initial, defaultPartnerId, defaultQuoteId]);

  const update = <K extends keyof SalesTask>(key: K, value: SalesTask[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const contacts = form.partnerId ? store.contactsByPartner(form.partnerId) : [];
  const transactionOptions = React.useMemo<Operation[]>(() => {
    const scoped = form.partnerId
      ? operations.filter((item) => item.partnerId === form.partnerId)
      : operations;
    const current = form.transactionId
      ? operations.find(
          (item) => item.id === form.transactionId || item.number === form.transactionId,
        )
      : undefined;
    if (!current || scoped.some((item) => item.id === current.id)) {
      return scoped;
    }
    return [current, ...scoped];
  }, [form.partnerId, form.transactionId, operations]);

  const onSave = () => {
    if (!form.subject.trim()) return;
    store.upsertTask(form);
    toast.success(initial ? t.taskUpdated : t.taskCreated);
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
            <Input value={form.subject} onChange={(e) => update("subject", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.partner}</Label>
            <Select
              value={form.partnerId ?? ""}
              onValueChange={(value) => update("partnerId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.none} />
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
              value={form.contactId ?? ""}
              onValueChange={(value) => update("contactId", value)}
              disabled={contacts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={contacts.length ? t.selectContact : t.noContacts} />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.email}</Label>
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.phone}</Label>
            <Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.dueDate}</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.dueTime}</Label>
            <Input
              type="time"
              value={form.dueTime ?? ""}
              onChange={(e) => update("dueTime", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.nextContactDate}</Label>
            <Input
              type="date"
              value={form.nextContactDate ?? ""}
              onChange={(e) => update("nextContactDate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.priority}</Label>
            <Select
              value={form.priority}
              onValueChange={(value) => update("priority", value as TaskPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t.low}</SelectItem>
                <SelectItem value="medium">{t.medium}</SelectItem>
                <SelectItem value="high">{t.high}</SelectItem>
                <SelectItem value="urgent">{t.urgent}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.status}</Label>
            <Select
              value={form.status}
              onValueChange={(value) => update("status", value as TaskStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="in_progress">{t.inProgress}</SelectItem>
                <SelectItem value="on_hold">{t.onHold}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
                <SelectItem value="cancelled">{t.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.contactMethod}</Label>
            <Select
              value={form.contactMethod}
              onValueChange={(value) => update("contactMethod", value as ContactMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">{t.call}</SelectItem>
                <SelectItem value="whatsapp">{t.whatsapp}</SelectItem>
                <SelectItem value="email">{t.emailMethod}</SelectItem>
                <SelectItem value="social">{t.social}</SelectItem>
                <SelectItem value="meeting">{t.meeting}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.salesperson}</Label>
            <Select
              value={form.salesperson}
              onValueChange={(value) => update("salesperson", value)}
            >
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
          <div className="space-y-1.5">
            <Label>{t.responsibleUser}</Label>
            <Select
              value={form.responsibleUser}
              onValueChange={(value) => update("responsibleUser", value)}
            >
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
          <div className="space-y-1.5">
            <Label>{t.relatedQuote}</Label>
            {(() => {
              const quoteOptions = form.partnerId
                ? store.quotesByPartner(form.partnerId)
                : store.quotes();
              return (
                <Select
                  value={form.quoteId ?? "__none__"}
                  onValueChange={(value) =>
                    update("quoteId", value === "__none__" ? undefined : value)
                  }
                  disabled={quoteOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={quoteOptions.length ? t.selectQuote : t.noQuotes} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t.none}</SelectItem>
                    {quoteOptions.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.number} — {quote.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
          </div>
          <div className="space-y-1.5">
            <Label>{t.relatedTransaction}</Label>
            <Select
              value={form.transactionId ?? "__none__"}
              onValueChange={(value) =>
                update("transactionId", value === "__none__" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    transactionOptions.length ? t.associateTransaction : t.noTransactions
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {transactionOptions.map((operation) => (
                  <SelectItem key={operation.id} value={operation.id}>
                    {operation.number} — {operation.origin} / {operation.destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.comment}</Label>
            <Textarea
              rows={3}
              value={form.comment ?? ""}
              onChange={(e) => update("comment", e.target.value)}
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
