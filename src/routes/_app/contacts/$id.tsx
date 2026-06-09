import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Pencil, Phone, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ContactDialog } from "@/components/ContactDialog";
import { InteractionDialog } from "@/components/InteractionDialog";
import { SalesEventDialog } from "@/components/SalesEventDialog";
import { priorityBadge, statusBadge } from "@/lib/task-utils";
import { quoteStatusBadge, formatMoney } from "@/lib/quote-utils";
import { channelLabels } from "@/lib/crm-labels";
import { store, useStoreVersion } from "@/lib/store";
import type { Interaction } from "@/lib/types";

export const Route = createFileRoute("/_app/contacts/$id")({
  component: ContactDetail,
});

function ContactDetail() {
  useStoreVersion();
  const locale = store.getLocale();
  const { id } = Route.useParams();
  const [editOpen, setEditOpen] = React.useState(false);
  const [interactionOpen, setInteractionOpen] = React.useState(false);
  const [editingInteraction, setEditingInteraction] = React.useState<Interaction | null>(null);
  const [eventOpen, setEventOpen] = React.useState(false);
  const contact = React.useMemo(() => store.contacts().find((item) => item.id === id), [id]);
  const user = store.getUser();
  const canWriteContacts = user?.permissions?.includes("contacts:write") ?? false;
  const canWriteInteractions = user?.permissions?.includes("interactions:write") ?? false;
  const t =
    locale === "es"
      ? {
          back: "Volver",
          notFound: "Contacto no encontrado.",
          interaction: "Interacción",
          edit: "Editar",
          delete: "Eliminar",
          deleteConfirm: "¿Eliminar este contacto?",
          deleted: "Contacto eliminado.",
          contactDetails: "Detalles del contacto",
          whatsapp: "WhatsApp",
          notes: "Notas",
          relatedQuotes: "Cotizaciones relacionadas",
          quote: "Cotización",
          status: "Estado",
          amount: "Monto",
          validUntil: "Válida hasta",
          noQuotes: "No hay cotizaciones vinculadas a este contacto.",
          relatedTasks: "Tareas relacionadas",
          subject: "Asunto",
          due: "Vence",
          priority: "Prioridad",
          noTasks: "No hay tareas vinculadas a este contacto.",
          interactions: "Interacciones",
          newEvent: "Nuevo evento",
          newInteraction: "Nueva interacción",
          channel: "Canal",
          date: "Fecha",
          owner: "Responsable",
          noInteractions: "No hay interacciones vinculadas a este contacto.",
          history: "Historial",
          event: "Evento",
          type: "Tipo",
          actor: "Actor",
          noHistory: "No hay eventos de historial vinculados a este contacto.",
        }
      : {
          back: "Back",
          notFound: "Contact not found.",
          interaction: "Interaction",
          edit: "Edit",
          delete: "Delete",
          deleteConfirm: "Delete this contact?",
          deleted: "Contact deleted.",
          contactDetails: "Contact details",
          whatsapp: "WhatsApp",
          notes: "Notes",
          relatedQuotes: "Related quotes",
          quote: "Quote",
          status: "Status",
          amount: "Amount",
          validUntil: "Valid until",
          noQuotes: "No quotes linked to this contact.",
          relatedTasks: "Related tasks",
          subject: "Subject",
          due: "Due",
          priority: "Priority",
          noTasks: "No tasks linked to this contact.",
          interactions: "Interactions",
          newEvent: "New event",
          newInteraction: "New interaction",
          channel: "Channel",
          date: "Date",
          owner: "Owner",
          noInteractions: "No interactions linked to this contact.",
          history: "History",
          event: "Event",
          type: "Type",
          actor: "Actor",
          noHistory: "No history events linked to this contact.",
        };

  if (!contact) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/contacts">
            <ArrowLeft className="size-4" /> {t.back}
          </Link>
        </Button>
        <Card className="p-10 text-center text-sm text-muted-foreground">{t.notFound}</Card>
      </div>
    );
  }

  const partner = store.partner(contact.partnerId);
  const tasks = store.tasks().filter((task) => task.contactId === contact.id);
  const quotes = store.quotes().filter((quote) => quote.contactId === contact.id);
  const interactions = store
    .interactions()
    .filter((interaction) => interaction.contactId === contact.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/contacts">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="size-12 rounded-md bg-primary/10 text-primary grid place-content-center">
            <UserRound className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              {contact.position && <span>{contact.position}</span>}
              {partner && (
                <Link
                  to="/partners/$id"
                  params={{ id: partner.id }}
                  className="text-primary hover:underline"
                >
                  {partner.companyName}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!canWriteInteractions}
            onClick={() => {
              setEditingInteraction(null);
              setInteractionOpen(true);
            }}
          >
            <Plus className="size-4" /> {t.interaction}
          </Button>
          <Button variant="outline" disabled={!canWriteContacts} onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> {t.edit}
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={!canWriteContacts}
            onClick={() => {
              if (confirm(t.deleteConfirm)) {
                store.deleteContact(contact.id);
                toast.success(t.deleted);
                window.location.href = "/contacts";
              }
            }}
          >
            <Trash2 className="size-4" /> {t.delete}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.contactDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ContactLine icon={<Mail className="size-4" />} value={contact.email} />
            <ContactLine icon={<Phone className="size-4" />} value={contact.phone} />
            <ContactLine label={t.whatsapp} value={contact.whatsapp} />
            <ContactLine label={t.notes} value={contact.notes} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t.relatedQuotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.quote}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.amount}</TableHead>
                  <TableHead>{t.validUntil}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/quotes/$id"
                        params={{ id: quote.id }}
                        className="text-primary hover:underline"
                      >
                        {quote.number}
                      </Link>
                      <div className="text-xs text-muted-foreground">{quote.subject}</div>
                    </TableCell>
                    <TableCell>
                      <Badge {...quoteStatusBadge(quote.status)}>{quote.status}</Badge>
                    </TableCell>
                    <TableCell>{formatMoney(quote.amount, quote.currency)}</TableCell>
                    <TableCell>{quote.validUntil}</TableCell>
                  </TableRow>
                ))}
                {quotes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      {t.noQuotes}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.relatedTasks}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.subject}</TableHead>
                <TableHead>{t.due}</TableHead>
                <TableHead>{t.priority}</TableHead>
                <TableHead>{t.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/tasks/$id"
                      params={{ id: task.id }}
                      className="text-primary hover:underline"
                    >
                      {task.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {task.dueDate} {task.dueTime ?? ""}
                  </TableCell>
                  <TableCell>
                    <Badge {...priorityBadge(task.priority)} />
                  </TableCell>
                  <TableCell>
                    <Badge {...statusBadge(task.status)} />
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t.noTasks}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t.interactions}</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!canWriteInteractions}
              onClick={() => setEventOpen(true)}
            >
              <Plus className="size-4" /> {t.newEvent}
            </Button>
            <Button
              size="sm"
              disabled={!canWriteInteractions}
              onClick={() => {
                setEditingInteraction(null);
                setInteractionOpen(true);
              }}
            >
              <Plus className="size-4" /> {t.newInteraction}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.subject}</TableHead>
                <TableHead>{t.channel}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.owner}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interactions.map((interaction) => (
                <TableRow key={interaction.id}>
                  <TableCell>
                    <div className="font-medium">{interaction.subject}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {interaction.body}
                    </div>
                  </TableCell>
                  <TableCell>{channelLabels[interaction.channel]}</TableCell>
                  <TableCell>{interaction.occurredAt}</TableCell>
                  <TableCell>{interaction.createdBy}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWriteInteractions}
                      onClick={() => {
                        setEditingInteraction(interaction);
                        setInteractionOpen(true);
                      }}
                    >
                      {t.edit}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={!canWriteInteractions}
                      onClick={() => {
                        if (confirm(t.deleteConfirm)) {
                          store.deleteInteraction(interaction.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {interactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t.noInteractions}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={contact}
        defaultPartnerId={contact.partnerId}
      />
      <InteractionDialog
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
        initial={editingInteraction}
        defaultPartnerId={contact.partnerId}
        defaultContactId={contact.id}
      />
      <SalesEventDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        partnerId={contact.partnerId}
        initial={null}
      />
    </div>
  );
}

function ContactLine({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label?: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      {label && <span className="min-w-20 text-muted-foreground">{label}</span>}
      <span className="break-words">{value || "—"}</span>
    </div>
  );
}
