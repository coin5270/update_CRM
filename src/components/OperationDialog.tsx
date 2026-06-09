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
import type { Operation, OperationStatus, TrafficMode } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Operation | null;
  defaultPartnerId?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const empty: Operation = {
  id: "",
  number: "",
  partnerId: "",
  trafficMode: "ocean",
  origin: "",
  destination: "",
  status: "active",
  openedAt: today(),
  revenue: 0,
  currency: "USD",
  assignedTo: store.salespeople()[0] ?? "Sales User",
};

export function OperationDialog({ open, onOpenChange, initial, defaultPartnerId }: Props) {
  const locale = store.getLocale();
  const salespeople = store.salespeople();
  const [form, setForm] = React.useState<Operation>(empty);
  const partners = store.partners();
  const firstPartnerId = partners[0]?.id ?? "";
  const defaultAssignedTo = salespeople[0] ?? "Sales User";
  const t =
    locale === "es"
      ? {
          edit: "Editar operación",
          new: "Nueva operación",
          number: "Número de operación *",
          partner: "Empresa *",
          selectPartner: "Seleccionar empresa",
          quote: "Cotización",
          selectQuote: "Seleccionar cotización",
          noQuotes: "Sin cotizaciones",
          none: "Ninguno",
          status: "Estado",
          trafficMode: "Modo de tráfico",
          origin: "Origen",
          destination: "Destino",
          openedAt: "Abierta el",
          closedAt: "Cerrada el",
          revenue: "Ingresos",
          currency: "Moneda",
          assignedTo: "Asignado a",
          active: "Activa",
          completed: "Completada",
          onHold: "En pausa",
          cancelled: "Cancelada",
          air: "Aéreo",
          ocean: "Marítimo",
          road: "Terrestre",
          warehouse: "Depósito",
          save: "Guardar operación",
          cancel: "Cancelar",
          operationUpdated: "Operación actualizada.",
          operationCreated: "Operación creada.",
        }
      : {
          edit: "Edit operation",
          new: "New operation",
          number: "Operation number *",
          partner: "Business partner *",
          selectPartner: "Select partner",
          quote: "Quote",
          selectQuote: "Select quote",
          noQuotes: "No quotes",
          none: "None",
          status: "Status",
          trafficMode: "Traffic mode",
          origin: "Origin",
          destination: "Destination",
          openedAt: "Opened at",
          closedAt: "Closed at",
          revenue: "Revenue",
          currency: "Currency",
          assignedTo: "Assigned to",
          active: "Active",
          completed: "Completed",
          onHold: "On hold",
          cancelled: "Cancelled",
          air: "Air",
          ocean: "Ocean",
          road: "Road",
          warehouse: "Warehouse",
          save: "Save operation",
          cancel: "Cancel",
          operationUpdated: "Operation updated.",
          operationCreated: "Operation created.",
        };

  React.useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ ...initial });
      } else {
        const partnerId = defaultPartnerId ?? firstPartnerId;
        setForm({
          ...empty,
          id: newId("op"),
          number: `OP-${String(Math.floor(Date.now() % 100000)).padStart(5, "0")}`,
          partnerId,
          quoteId: partnerId ? store.quotesByPartner(partnerId)[0]?.id : undefined,
          assignedTo: defaultAssignedTo,
        });
      }
    }
  }, [defaultAssignedTo, defaultPartnerId, firstPartnerId, initial, open]);

  const update = <K extends keyof Operation>(key: K, value: Operation[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const partnerQuotes = form.partnerId ? store.quotesByPartner(form.partnerId) : store.quotes();
  const hasPartners = partners.length > 0;

  const onSave = () => {
    if (!form.number.trim() || !form.partnerId) return;
    store.upsertOperation(form);
    toast.success(initial ? t.operationUpdated : t.operationCreated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? t.edit : t.new}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t.number}</Label>
            <Input value={form.number} onChange={(event) => update("number", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.partner}</Label>
            {!hasPartners && (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                {locale === "es"
                  ? "No hay empresas disponibles. Cree una empresa primero."
                  : "No partners are available. Create a business partner first."}
              </div>
            )}
            <Select
              value={form.partnerId || "__none__"}
              onValueChange={(value) => {
                if (value === "__none__") return;
                update("partnerId", value);
                update("quoteId", store.quotesByPartner(value)[0]?.id);
              }}
              disabled={!hasPartners}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectPartner} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.selectPartner}</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.quote}</Label>
            <Select
              value={form.quoteId ?? "__none__"}
              onValueChange={(value) => update("quoteId", value === "__none__" ? undefined : value)}
              disabled={partnerQuotes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={partnerQuotes.length ? t.selectQuote : t.noQuotes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {partnerQuotes.map((quote) => (
                  <SelectItem key={quote.id} value={quote.id}>
                    {quote.number} — {quote.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.status}</Label>
            <Select
              value={form.status}
              onValueChange={(value) => update("status", value as OperationStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
                <SelectItem value="on_hold">{t.onHold}</SelectItem>
                <SelectItem value="cancelled">{t.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.trafficMode}</Label>
            <Select
              value={form.trafficMode}
              onValueChange={(value) => update("trafficMode", value as TrafficMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="air">{t.air}</SelectItem>
                <SelectItem value="ocean">{t.ocean}</SelectItem>
                <SelectItem value="road">{t.road}</SelectItem>
                <SelectItem value="warehouse">{t.warehouse}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.origin}</Label>
            <Input value={form.origin} onChange={(event) => update("origin", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.destination}</Label>
            <Input
              value={form.destination}
              onChange={(event) => update("destination", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.openedAt}</Label>
            <Input
              type="date"
              value={form.openedAt}
              onChange={(event) => update("openedAt", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.closedAt}</Label>
            <Input
              type="date"
              value={form.closedAt ?? ""}
              onChange={(event) => update("closedAt", event.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.revenue}</Label>
            <Input
              type="number"
              step="0.01"
              value={form.revenue}
              onChange={(event) => update("revenue", Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.currency}</Label>
            <Input
              value={form.currency}
              onChange={(event) => update("currency", event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.assignedTo}</Label>
            <Select value={form.assignedTo} onValueChange={(value) => update("assignedTo", value)}>
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
