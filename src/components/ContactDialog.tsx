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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, newId } from "@/lib/store";
import { toast } from "sonner";
import type { Contact } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Contact | null;
  defaultPartnerId?: string;
}

const empty: Contact = { id: "", partnerId: "", firstName: "", lastName: "" };

export function ContactDialog({ open, onOpenChange, initial, defaultPartnerId }: Props) {
  const locale = store.getLocale();
  const partners = store.partners();
  const firstPartnerId = partners[0]?.id ?? "";
  const [form, setForm] = React.useState<Contact>(empty);
  const t =
    locale === "es"
      ? {
          editContact: "Editar contacto",
          newContact: "Nuevo contacto",
          businessPartner: "Empresa *",
          selectPartner: "Seleccionar empresa",
          firstName: "Nombre *",
          lastName: "Apellido",
          position: "Cargo",
          email: "Correo",
          phone: "Teléfono",
          whatsapp: "WhatsApp",
          notes: "Notas",
          cancel: "Cancelar",
          save: "Guardar",
          contactUpdated: "Contacto actualizado.",
          contactCreated: "Contacto creado.",
          none: "Ninguno",
        }
      : {
          editContact: "Edit contact",
          newContact: "New contact",
          businessPartner: "Business partner *",
          selectPartner: "Select partner",
          firstName: "First name *",
          lastName: "Last name",
          position: "Position",
          email: "Email",
          phone: "Phone",
          whatsapp: "WhatsApp",
          notes: "Notes",
          cancel: "Cancel",
          save: "Save",
          contactUpdated: "Contact updated.",
          contactCreated: "Contact created.",
          none: "None",
        };

  React.useEffect(() => {
    if (open) {
      if (initial) setForm({ ...initial });
      else setForm({ ...empty, id: newId("c"), partnerId: defaultPartnerId ?? firstPartnerId });
    }
  }, [open, initial, defaultPartnerId, firstPartnerId]);

  const update = <K extends keyof Contact>(k: K, v: Contact[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = () => {
    if (!form.firstName.trim() || !form.partnerId) return;
    store.upsertContact(form);
    toast.success(initial ? t.contactUpdated : t.contactCreated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? t.editContact : t.newContact}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.businessPartner}</Label>
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
            <Label>{t.firstName}</Label>
            <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.lastName}</Label>
            <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.position}</Label>
            <Input
              value={form.position ?? ""}
              onChange={(e) => update("position", e.target.value)}
            />
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.whatsapp}</Label>
            <Input
              value={form.whatsapp ?? ""}
              onChange={(e) => update("whatsapp", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.notes}</Label>
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
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
