import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { store, useStoreVersion } from "@/lib/store";
import { ContactDialog } from "@/components/ContactDialog";
import type { Contact } from "@/lib/types";

export const Route = createFileRoute("/_app/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const contacts = store.contacts();
  const partners = store.partners();
  const sync = store.apiSyncStatus();
  const user = store.getUser();
  const canWriteContacts = user?.permissions?.includes("contacts:write") ?? false;
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Contact | null>(null);
  const t =
    locale === "es"
      ? {
          title: "Contactos",
          subtitle: "Personas asociadas a todas tus empresas.",
          newContact: "Nuevo contacto",
          contacts: "Contactos",
          partners: "Empresas",
          backendSync: "Sincronización backend",
          search: "Buscar contactos",
          name: "Nombre",
          position: "Cargo",
          company: "Empresa",
          email: "Correo",
          phone: "Teléfono",
          edit: "Editar",
          connected: "Conectado",
          offline: "Desconectado",
          noReturned: "Todavía no se devolvieron contactos desde el backend.",
          noOffline: "No hay contactos disponibles sin conexión.",
          deleteConfirm: "¿Eliminar este contacto?",
          deleted: "Contacto eliminado.",
        }
      : {
          title: "Contacts",
          subtitle: "People across all your business partners.",
          newContact: "New contact",
          contacts: "Contacts",
          partners: "Partners",
          backendSync: "Backend sync",
          search: "Search contacts",
          name: "Name",
          position: "Position",
          company: "Company",
          email: "Email",
          phone: "Phone",
          edit: "Edit",
          connected: "Connected",
          offline: "Offline",
          noReturned: "No contacts were returned from the backend yet.",
          noOffline: "No contacts available offline.",
          deleteConfirm: "Delete this contact?",
          deleted: "Contact deleted.",
        };

  const filtered = contacts.filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(s) ||
      c.lastName.toLowerCase().includes(s) ||
      (c.email ?? "").toLowerCase().includes(s) ||
      (c.position ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button
          disabled={!canWriteContacts}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> {t.newContact}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.contacts}</div>
          <div className="mt-2 text-2xl font-semibold">{contacts.length}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {locale === "es" ? "Personas en todas las empresas." : "People across all partners."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.partners}</div>
          <div className="mt-2 text-2xl font-semibold">{partners.length}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {locale === "es" ? "Cuentas comerciales vinculadas." : "Linked business accounts."}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.backendSync}
              </div>
              <div className="mt-2 text-sm font-medium">
                {sync?.status === "connected" ? t.connected : t.offline}
              </div>
            </div>
            <Badge variant={sync?.status === "connected" ? "default" : "secondary"}>
              {sync?.status ?? "unknown"}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {sync?.status === "connected"
              ? `${locale === "es" ? "Última sincronización" : "Last synced"} ${
                  sync.lastSyncAt
                    ? new Date(sync.lastSyncAt).toLocaleString()
                    : locale === "es"
                      ? "recientemente"
                      : "recently"
                }.`
              : (sync?.message ??
                (locale === "es"
                  ? "Usando respaldo local hasta que la API esté disponible."
                  : "Using local fallback until the API is reachable."))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.search}
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.name}</TableHead>
              <TableHead>{t.position}</TableHead>
              <TableHead>{t.company}</TableHead>
              <TableHead>{t.email}</TableHead>
              <TableHead>{t.phone}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const partner = partners.find((p) => p.id === c.partnerId);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/contacts/$id"
                      params={{ id: c.id }}
                      className="text-primary hover:underline"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{c.position ?? "—"}</TableCell>
                  <TableCell>
                    {partner ? (
                      <Link
                        to="/partners/$id"
                        params={{ id: partner.id }}
                        className="text-primary hover:underline"
                      >
                        {partner.companyName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{c.email ?? "—"}</TableCell>
                  <TableCell>{c.phone ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canWriteContacts}
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                      >
                        {t.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={!canWriteContacts}
                        onClick={() => {
                          if (confirm(t.deleteConfirm)) {
                            store.deleteContact(c.id);
                            toast.success(t.deleted);
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {sync?.status === "connected" ? t.noReturned : t.noOffline}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ContactDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
