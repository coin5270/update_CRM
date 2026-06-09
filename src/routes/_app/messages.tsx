import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailPlus, MessageSquare, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InteractionDialog } from "@/components/InteractionDialog";
import { store, useStoreVersion } from "@/lib/store";
import type { Interaction, InteractionChannel } from "@/lib/types";

export const Route = createFileRoute("/_app/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const interactions = store.interactions();
  const partners = store.partners();
  const contacts = store.contacts();
  const sync = store.apiSyncStatus();
  const user = store.getUser();
  const canWriteInteractions = user?.permissions?.includes("interactions:write") ?? false;

  const [q, setQ] = React.useState("");
  const [channel, setChannel] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Interaction | null>(null);
  const t =
    locale === "es"
      ? {
          title: "Mensajes comerciales",
          subtitle: "Historial de conversación y seguimiento con clientes y prospectos.",
          newInteraction: "Nueva interacción",
          interactions: "Interacciones",
          outboundCount: "Salientes",
          inboundCount: "Entrantes",
          backendSync: "Sincronización backend",
          connected: "Conectado",
          offline: "Desconectado",
          unknown: "Desconocido",
          search: "Buscar mensajes",
          allChannels: "Todos los canales",
          message: "Mensaje",
          partner: "Empresa",
          contact: "Contacto",
          channel: "Canal",
          direction: "Dirección",
          date: "Fecha",
          owner: "Responsable",
          edit: "Editar",
          noBackend: "Aún no se devolvieron mensajes desde el backend.",
          noOffline: "No hay conversaciones disponibles sin conexión.",
          email: "Correo",
          whatsapp: "WhatsApp",
          call: "Llamada",
          meeting: "Reunión",
          note: "Nota",
          inbound: "Entrante",
          outbound: "Saliente",
          internal: "Interno",
          deleteConfirm: "¿Eliminar esta interacción?",
          interactionDeleted: "Interacción eliminada.",
        }
      : {
          title: "Commercial Messaging",
          subtitle: "Conversation and follow-up history across clients and prospects.",
          newInteraction: "New interaction",
          interactions: "Interactions",
          outboundCount: "Outbound",
          inboundCount: "Inbound",
          backendSync: "Backend sync",
          connected: "Connected",
          offline: "Offline",
          unknown: "Unknown",
          search: "Search messages",
          allChannels: "All channels",
          message: "Message",
          partner: "Partner",
          contact: "Contact",
          channel: "Channel",
          direction: "Direction",
          date: "Date",
          owner: "Owner",
          edit: "Edit",
          noBackend: "No interactions were returned from the backend yet.",
          noOffline: "No messages match the current filters.",
          email: "Email",
          whatsapp: "WhatsApp",
          call: "Call",
          meeting: "Meeting",
          note: "Note",
          inbound: "Inbound",
          outbound: "Outbound",
          internal: "Internal",
          deleteConfirm: "Delete this interaction?",
          interactionDeleted: "Interaction deleted.",
        };
  const channelLabel =
    locale === "es"
      ? {
          email: t.email,
          whatsapp: t.whatsapp,
          call: t.call,
          meeting: t.meeting,
          note: t.note,
        }
      : {
          email: t.email,
          whatsapp: t.whatsapp,
          call: t.call,
          meeting: t.meeting,
          note: t.note,
        };
  const directionLabel =
    locale === "es"
      ? {
          inbound: t.inbound,
          outbound: t.outbound,
          internal: t.internal,
        }
      : {
          inbound: t.inbound,
          outbound: t.outbound,
          internal: t.internal,
        };

  const filtered = interactions
    .filter(
      (interaction) => channel === "all" || interaction.channel === (channel as InteractionChannel),
    )
    .filter((interaction) => {
      if (!q) return true;
      const partner = partners.find((p) => p.id === interaction.partnerId);
      const contact = contacts.find((c) => c.id === interaction.contactId);
      const needle = q.toLowerCase();
      return (
        interaction.subject.toLowerCase().includes(needle) ||
        interaction.body.toLowerCase().includes(needle) ||
        (partner?.companyName ?? "").toLowerCase().includes(needle) ||
        `${contact?.firstName ?? ""} ${contact?.lastName ?? ""}`.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button
          disabled={!canWriteInteractions}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> {t.newInteraction}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.interactions}</div>
          <div className="mt-1 text-2xl font-semibold">{interactions.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.outboundCount}</div>
          <div className="mt-1 text-2xl font-semibold">
            {interactions.filter((interaction) => interaction.direction === "outbound").length}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">{t.inboundCount}</div>
          <div className="mt-1 text-2xl font-semibold">
            {interactions.filter((interaction) => interaction.direction === "inbound").length}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.backendSync}
            </div>
            <div className="mt-1 text-sm font-medium">
              {sync?.status === "connected" ? t.connected : t.offline}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {sync?.status === "connected"
                ? locale === "es"
                  ? "El historial de mensajes se está leyendo desde el backend."
                  : "Message history is being read from the backend."
                : (sync?.message ??
                  (locale === "es"
                    ? "Mostrando conversaciones locales de respaldo hasta que responda la API."
                    : "Showing local fallback conversations until the API returns."))}
            </div>
          </div>
          <Badge variant={sync?.status === "connected" ? "default" : "secondary"}>
            {sync?.status === "connected"
              ? t.connected
              : sync?.status === "offline"
                ? t.offline
                : t.unknown}
          </Badge>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t.search}
              className="pl-8"
            />
          </div>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t.allChannels} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allChannels}</SelectItem>
              <SelectItem value="email">{t.email}</SelectItem>
              <SelectItem value="whatsapp">{t.whatsapp}</SelectItem>
              <SelectItem value="call">{t.call}</SelectItem>
              <SelectItem value="meeting">{t.meeting}</SelectItem>
              <SelectItem value="note">{t.note}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.message}</TableHead>
              <TableHead>{t.partner}</TableHead>
              <TableHead>{t.contact}</TableHead>
              <TableHead>{t.channel}</TableHead>
              <TableHead>{t.direction}</TableHead>
              <TableHead>{t.date}</TableHead>
              <TableHead>{t.owner}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((interaction) => {
              const partner = partners.find((p) => p.id === interaction.partnerId);
              const contact = contacts.find((c) => c.id === interaction.contactId);
              return (
                <TableRow key={interaction.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid size-8 shrink-0 place-content-center rounded-md bg-muted">
                        {interaction.channel === "email" ? (
                          <MailPlus className="size-4 text-muted-foreground" />
                        ) : (
                          <MessageSquare className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium">{interaction.subject}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {interaction.body}
                        </div>
                      </div>
                    </div>
                  </TableCell>
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
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {contact ? `${contact.firstName} ${contact.lastName}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{channelLabel[interaction.channel]}</Badge>
                  </TableCell>
                  <TableCell>{directionLabel[interaction.direction]}</TableCell>
                  <TableCell>{interaction.occurredAt}</TableCell>
                  <TableCell>{interaction.createdBy}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWriteInteractions}
                      onClick={() => {
                        setEditing(interaction);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" /> {t.edit}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={!canWriteInteractions}
                      onClick={() => {
                        if (confirm(t.deleteConfirm)) {
                          store.deleteInteraction(interaction.id);
                          toast.success(t.interactionDeleted);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  {sync?.status === "connected" ? t.noBackend : t.noOffline}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <InteractionDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
