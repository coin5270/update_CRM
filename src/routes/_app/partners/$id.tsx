import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { store, useStoreVersion } from "@/lib/store";
import { PartnerDialog } from "@/components/PartnerDialog";
import { ContactDialog } from "@/components/ContactDialog";
import { TaskDialog } from "@/components/TaskDialog";
import { QuoteDialog } from "@/components/QuoteDialog";
import { InteractionDialog } from "@/components/InteractionDialog";
import { SalesEventTimeline } from "@/components/SalesEventTimeline";
import { SalesEventDialog } from "@/components/SalesEventDialog";
import { priorityBadge, statusBadge } from "@/lib/task-utils";
import { formatMoney, quoteStatusBadge } from "@/lib/quote-utils";
import {
  channelLabels,
  historyTypeLabels,
  operationStatusLabels,
  statusBadge as crmStatusBadge,
  trafficModeLabels,
} from "@/lib/crm-labels";
import { cn } from "@/lib/utils";
import type { Contact, Interaction, PartnerRole, Quote, SalesTask } from "@/lib/types";

export const Route = createFileRoute("/_app/partners/$id")({
  component: PartnerDetail,
});

function PartnerDetail() {
  useStoreVersion();
  const locale = store.getLocale();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const partner = store.partner(id);
  const user = store.getUser();
  const canWritePartners = user?.permissions?.includes("partners:write") ?? false;
  const canWriteContacts = user?.permissions?.includes("contacts:write") ?? false;
  const canWriteTasks = user?.permissions?.includes("tasks:write") ?? false;
  const canWriteQuotes = user?.permissions?.includes("quotes:write") ?? false;
  const canWriteInteractions = user?.permissions?.includes("interactions:write") ?? false;

  const [editOpen, setEditOpen] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<SalesTask | null>(null);
  const [quoteOpen, setQuoteOpen] = React.useState(false);
  const [editingQuote, setEditingQuote] = React.useState<Quote | null>(null);
  const [interactionOpen, setInteractionOpen] = React.useState(false);
  const [editingInteraction, setEditingInteraction] = React.useState<Interaction | null>(null);
  const [eventOpen, setEventOpen] = React.useState(false);
  const [bankEditorOpen, setBankEditorOpen] = React.useState(false);
  const [branchEditorOpen, setBranchEditorOpen] = React.useState(false);
  const [editingBankIndex, setEditingBankIndex] = React.useState<number | null>(null);
  const [editingBranchIndex, setEditingBranchIndex] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState("general");
  const [bankForm, setBankForm] = React.useState({
    bankName: "",
    accountNumber: "",
    swift: "",
    currency: "",
  });
  const [branchForm, setBranchForm] = React.useState({
    name: "",
    address: "",
    type: "branch" as "branch" | "warehouse",
  });

  const contacts = store.contactsByPartner(partner.id);
  const tasks = store.tasksByPartner(partner.id);
  const quotes = store.quotesByPartner(partner.id);
  const operations = store.operationsByPartner(partner.id);
  const interactions = store.interactionsByPartner(partner.id);
  const history = store.historyByPartner(partner.id);
  const lastOperation = operations.slice().sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0];
  const openQuotes = quotes.filter((quote) =>
    ["draft", "sent", "negotiation"].includes(quote.status),
  );
  const activeTasks = tasks.filter(
    (task) => task.status !== "completed" && task.status !== "cancelled",
  );
  const lastQuote = quotes.slice().sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];
  const bankDetails = React.useMemo(() => partner.bankDetails ?? [], [partner.bankDetails]);
  const branches = React.useMemo(() => partner.branches ?? [], [partner.branches]);
  const t =
    locale === "es"
      ? {
          back: "Volver",
          notFound: "Empresa no encontrada.",
          edit: "Editar",
          newEvent: "Nuevo evento",
          deletePartnerConfirm: "¿Eliminar esta empresa?",
          partnerDeleted: "Empresa eliminada.",
          lifecycle: "Ciclo de vida",
          tasks: "Tareas",
          quotes: "Cotizaciones",
          operations: "Operaciones",
          lifecycleCopy: "Estado del ciclo de vida y rol comercial.",
          tasksCopy: "Seguimientos activos y acciones pendientes.",
          quotesCopy: "Oportunidades comerciales abiertas.",
          operationsCopy: "Transacciones activas e históricas.",
          general: "General",
          contacts: "Contactos",
          positions: "Posiciones relacionadas",
          tasksTab: "Tareas",
          transactions: "Transacciones",
          messages: "Mensajes",
          history: "Historial",
          admin: "Administración",
          bankDetails: "Datos bancarios",
          branches: "Sucursales / almacenes",
          notes: "Notas internas",
          profile: "Perfil comercial",
          companyInformation: "Información de la empresa",
          contactAddress: "Contacto y dirección",
          relatedContacts: "Contactos relacionados",
          relatedPositions: "Posiciones relacionadas",
          salesTasks: "Tareas comerciales",
          bankDetailsCard: "Datos bancarios",
          branchesWarehouses: "Sucursales y almacenes",
          internalNotes: "Notas internas",
          quotesCard: "Cotizaciones",
          relatedOperations: "Operaciones y transacciones relacionadas",
          commercialMessages: "Mensajes comerciales",
          commercialHistory: "Historial comercial",
          commercialProfile: "Perfil comercial",
          customProfile: "Texto de perfil personalizado",
          noContactsYet: "Todavía no hay contactos.",
          noContactsAssigned: "Aún no hay contactos asignados.",
          noTasksYet: "Todavía no hay tareas.",
          noBankDetails: "No se registraron datos bancarios.",
          noBranches: "No se registraron sucursales.",
          noInternalNotes: "No hay notas internas.",
          noQuotesYet: "Todavía no hay cotizaciones.",
          noOperationsYet: "Todavía no hay operaciones.",
          noMessagesYet: "Todavía no hay mensajes.",
          noHistoryYet: "Todavía no hay eventos de historial.",
          noCustomText: "No hay texto de perfil personalizado.",
          addBankDetail: "Agregar dato bancario",
          editBankDetail: "Editar dato bancario",
          addBranch: "Agregar sucursal / almacén",
          editBranch: "Editar sucursal / almacén",
          save: "Guardar",
          cancel: "Cancelar",
          bankDetailUpdated: "Dato bancario actualizado.",
          bankDetailAdded: "Dato bancario agregado.",
          branchUpdated: "Sucursal actualizada.",
          branchAdded: "Sucursal agregada.",
          deleteContact: "¿Eliminar contacto?",
          contactDeleted: "Contacto eliminado.",
          deleteBankDetail: "¿Eliminar este dato bancario?",
          bankDetailDeleted: "Dato bancario eliminado.",
          deleteBranch: "¿Eliminar esta sucursal/almacén?",
          branchDeleted: "Sucursal eliminada.",
          deleteInteraction: "¿Eliminar esta interacción?",
          interactionDeleted: "Interacción eliminada.",
          open: "Abrir",
          manage: "Gestionar",
          addContact: "Nuevo contacto",
          editContact: "Editar",
          delete: "Eliminar",
          newQuote: "Nueva cotización",
          newTask: "Nueva tarea",
          newInteraction: "Nueva interacción",
          addBankDetailButton: "Agregar dato bancario",
          addBranchButton: "Agregar sucursal / almacén",
          addBankLabel: "Agregar dato bancario",
          addBranchLabel: "Agregar sucursal / almacén",
          addQuote: "Nueva cotización",
          addTask: "Nueva tarea",
          addInteraction: "Nueva interacción",
          creditLimit: "Límite de crédito",
          paymentTerms: "Condiciones de pago",
          invoicingProfile: "Perfil de facturación",
          permissionsSource: "Fuente de permisos",
          verified: "Verificado",
          missingTaxData: "Faltan datos fiscales",
          pendingApproval: "Pendiente de aprobación",
          prepaid: "Prepago",
          managementApi: "API del software de gestión",
          bankAccounts: "Cuentas bancarias",
          branchLocations: "Ubicaciones de sucursales",
          bankSwifts: "SWIFT bancarios",
          quoteOperationRatio: "Relación cotización-operación",
          openQuotes: "Cotizaciones abiertas",
          activeTasks: "Tareas activas",
          numberOfOperations: "Número de operaciones",
          lastOperation: "Última operación",
          latestQuote: "Última cotización",
          customerRoles: "Roles de cliente",
          added: "agregado",
          updated: "actualizado",
          openLabel: "Abrir",
        }
      : {
          back: "Back",
          notFound: "Partner not found.",
          edit: "Edit",
          newEvent: "New event",
          deletePartnerConfirm: "Delete this partner?",
          partnerDeleted: "Partner deleted.",
          lifecycle: "Lifecycle",
          tasks: "Tasks",
          quotes: "Quotes",
          operations: "Operations",
          lifecycleCopy: "Lifecycle status and commercial role.",
          tasksCopy: "Active follow-ups and pending actions.",
          quotesCopy: "Open commercial opportunities.",
          operationsCopy: "Live and historical transactions.",
          general: "General",
          contacts: "Contacts",
          positions: "Related Positions",
          tasksTab: "Tasks",
          transactions: "Transactions",
          messages: "Messages",
          history: "History",
          admin: "Administration",
          bankDetails: "Bank Details",
          branches: "Branches / Warehouses",
          notes: "Internal Notes",
          profile: "Commercial Profile",
          companyInformation: "Company information",
          contactAddress: "Contact & address",
          relatedContacts: "Related contacts",
          relatedPositions: "Related positions",
          salesTasks: "Sales tasks",
          bankDetailsCard: "Bank details",
          branchesWarehouses: "Branches & warehouses",
          internalNotes: "Internal notes",
          quotesCard: "Quotes",
          relatedOperations: "Related operations and transactions",
          commercialMessages: "Commercial messages",
          commercialHistory: "Commercial history",
          commercialProfile: "Commercial profile",
          customProfile: "Custom profile text",
          noContactsYet: "No contacts yet.",
          noContactsAssigned: "No contacts assigned yet.",
          noTasksYet: "No tasks yet.",
          noBankDetails: "No bank details recorded.",
          noBranches: "No branches recorded.",
          noInternalNotes: "No internal notes.",
          noQuotesYet: "No quotes yet.",
          noOperationsYet: "No operations yet.",
          noMessagesYet: "No messages yet.",
          noHistoryYet: "No history events yet.",
          noCustomText: "No custom profile text.",
          addBankDetail: "Add bank detail",
          editBankDetail: "Edit bank detail",
          addBranch: "Add branch / warehouse",
          editBranch: "Edit branch / warehouse",
          save: "Save",
          cancel: "Cancel",
          bankDetailUpdated: "Bank detail updated.",
          bankDetailAdded: "Bank detail added.",
          branchUpdated: "Branch updated.",
          branchAdded: "Branch added.",
          deleteContact: "Delete contact?",
          contactDeleted: "Contact deleted.",
          deleteBankDetail: "Delete this bank detail?",
          bankDetailDeleted: "Bank detail deleted.",
          deleteBranch: "Delete this branch/warehouse?",
          branchDeleted: "Branch deleted.",
          deleteInteraction: "Delete this interaction?",
          interactionDeleted: "Interaction deleted.",
          open: "Open",
          manage: "Manage",
          addContact: "New contact",
          editContact: "Edit",
          delete: "Delete",
          newQuote: "New quote",
          newTask: "New task",
          newInteraction: "New interaction",
          addBankDetailButton: "Add bank detail",
          addBranchButton: "Add branch / warehouse",
          addBankLabel: "Add bank detail",
          addBranchLabel: "Add branch / warehouse",
          addQuote: "New quote",
          addTask: "New task",
          addInteraction: "New interaction",
          creditLimit: "Credit limit",
          paymentTerms: "Payment terms",
          invoicingProfile: "Invoicing profile",
          permissionsSource: "Permissions source",
          verified: "Verified",
          missingTaxData: "Missing tax data",
          pendingApproval: "Pending approval",
          prepaid: "Prepaid",
          managementApi: "Management software API",
          bankAccounts: "Bank accounts",
          branchLocations: "Branch locations",
          bankSwifts: "Bank SWIFTs",
          quoteOperationRatio: "Quote-operation ratio",
          openQuotes: "Open quotes",
          activeTasks: "Active tasks",
          numberOfOperations: "Number of operations",
          lastOperation: "Last operation",
          latestQuote: "Latest quote",
          customerRoles: "Customer roles",
          added: "added",
          updated: "updated",
          openLabel: "Open",
        };
  const roleLabels: Record<PartnerRole, string> =
    locale === "es"
      ? { customer: "Cliente", supplier: "Proveedor", mixed: "Mixto", other: "Otro" }
      : { customer: "Customer", supplier: "Supplier", mixed: "Mixed", other: "Other" };

  React.useEffect(() => {
    if (!bankEditorOpen) return;
    const current = editingBankIndex !== null ? bankDetails[editingBankIndex] : undefined;
    setBankForm({
      bankName: current?.bankName ?? "",
      accountNumber: current?.accountNumber ?? "",
      swift: current?.swift ?? "",
      currency: current?.currency ?? "",
    });
  }, [bankEditorOpen, editingBankIndex, bankDetails]);

  React.useEffect(() => {
    if (!branchEditorOpen) return;
    const current = editingBranchIndex !== null ? branches[editingBranchIndex] : undefined;
    setBranchForm({
      name: current?.name ?? "",
      address: current?.address ?? "",
      type: current?.type ?? "branch",
    });
  }, [branchEditorOpen, editingBranchIndex, branches]);

  if (!partner) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/partners">
            <ArrowLeft className="size-4" /> {t.back}
          </Link>
        </Button>
        <Card className="border-white/70 bg-white/95 p-10 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-900">
          {t.notFound}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/partners">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="size-12 rounded-md bg-primary/10 text-primary grid place-content-center dark:bg-primary/20">
            <Building2 className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight text-slate-950 dark:text-slate-50">
              {partner.companyName}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {partner.roles.map((r) => (
                <Badge key={r} variant="secondary">
                  {ROLE_LABELS[r]}
                </Badge>
              ))}
              <Badge variant="outline" className="capitalize">
                {partner.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!canWritePartners} onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> {t.edit}
          </Button>
          <Button
            variant="outline"
            disabled={!canWriteInteractions}
            onClick={() => setEventOpen(true)}
          >
            {t.newEvent}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={!canWritePartners}
            onClick={() => {
              if (confirm(t.deletePartnerConfirm)) {
                store.deletePartner(partner.id);
                toast.success(t.partnerDeleted);
                navigate({ to: "/partners" });
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/70 bg-white/95 p-4 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
          <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            {t.lifecycle}
          </div>
          <div className="mt-1 text-2xl font-semibold capitalize text-slate-950 dark:text-slate-50">
            {partner.status}
          </div>
          <div className="text-sm text-muted-foreground dark:text-slate-300">{t.lifecycleCopy}</div>
        </Card>
        <Card className="border-white/70 bg-white/95 p-4 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
          <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            {t.tasks}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
            {activeTasks.length}
          </div>
          <div className="text-sm text-muted-foreground dark:text-slate-300">{t.tasksCopy}</div>
        </Card>
        <Card className="border-white/70 bg-white/95 p-4 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
          <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            {t.quotes}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
            {openQuotes.length}
          </div>
          <div className="text-sm text-muted-foreground dark:text-slate-300">{t.quotesCopy}</div>
        </Card>
        <Card className="border-white/70 bg-white/95 p-4 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
          <div className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            {t.operations}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
            {operations.length}
          </div>
          <div className="text-sm text-muted-foreground dark:text-slate-300">
            {t.operationsCopy}
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto dark:border-white/10 dark:bg-slate-800/70">
          <TabsTrigger value="general">{t.general}</TabsTrigger>
          <TabsTrigger value="contacts">{t.contacts}</TabsTrigger>
          <TabsTrigger value="positions">{t.positions}</TabsTrigger>
          <TabsTrigger value="tasks">{t.tasksTab}</TabsTrigger>
          <TabsTrigger value="quotes">{t.quotes}</TabsTrigger>
          <TabsTrigger value="transactions">{t.transactions}</TabsTrigger>
          <TabsTrigger value="messages">{t.messages}</TabsTrigger>
          <TabsTrigger value="history">{t.history}</TabsTrigger>
          <TabsTrigger value="admin">{t.admin}</TabsTrigger>
          <TabsTrigger value="bank">{t.bankDetails}</TabsTrigger>
          <TabsTrigger value="branches">{t.branches}</TabsTrigger>
          <TabsTrigger value="notes">{t.notes}</TabsTrigger>
          <TabsTrigger value="profile">{t.profile}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">{t.companyInformation}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <Field
                label={locale === "es" ? "Nombre de la empresa" : "Company name"}
                value={partner.companyName}
              />
              <Field
                label={locale === "es" ? "Nombre comercial" : "Trade name"}
                value={partner.tradeName}
              />
              <Field label={locale === "es" ? "Tax ID" : "Tax ID"} value={partner.taxId} />
              <Field
                label={locale === "es" ? "Roles" : "Roles"}
                value={partner.roles.map((role) => roleLabels[role]).join(", ")}
              />
              <Field label={locale === "es" ? "País" : "Country"} value={partner.country} />
              <Field label={locale === "es" ? "Ciudad" : "City"} value={partner.city} />
              <Field
                label={locale === "es" ? "Provincia / Estado" : "State / Province"}
                value={partner.state}
              />
              <Field
                label={locale === "es" ? "Código postal" : "Postal code"}
                value={partner.postalCode}
              />
              <Field label={locale === "es" ? "Dirección" : "Address"} value={partner.address} />
              <Field label={locale === "es" ? "Sitio web" : "Website"} value={partner.website} />
              <Field label={locale === "es" ? "Idioma" : "Language"} value={partner.language} />
              <Field
                label={locale === "es" ? "Vendedor" : "Salesperson"}
                value={partner.salesperson}
              />
              <Field label={locale === "es" ? "Gerente" : "Manager"} value={partner.manager} />
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">{t.contactAddress}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={locale === "es" ? "Teléfonos" : "Phones"}
                  value={partner.phones.join(", ")}
                />
                <Field
                  label={locale === "es" ? "Correos" : "Emails"}
                  value={partner.emails.join(", ")}
                />
              </div>
              {partner.emails.map((e) => (
                <div key={e} className="flex gap-2 items-center">
                  <Mail className="size-3.5 text-muted-foreground" /> {e}
                </div>
              ))}
              {partner.phones.map((p) => (
                <div key={p} className="flex gap-2 items-center">
                  <Phone className="size-3.5 text-muted-foreground" /> {p}
                </div>
              ))}
              {partner.website && (
                <div className="flex gap-2 items-center">
                  <Globe className="size-3.5 text-muted-foreground" />{" "}
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {partner.website}
                  </a>
                </div>
              )}
              <div className="flex gap-2 items-start">
                <MapPin className="size-3.5 text-muted-foreground mt-0.5" />{" "}
                <span>
                  {[
                    partner.address,
                    partner.city,
                    partner.state,
                    partner.postalCode,
                    partner.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </span>
              </div>
              <div className="pt-2">
                <Field label={t.internalNotes} value={partner.notes} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.relatedContacts}</CardTitle>
              <Button
                size="sm"
                disabled={!canWriteContacts}
                onClick={() => {
                  setEditingContact(null);
                  setContactOpen(true);
                }}
              >
                <Plus className="size-4" /> {locale === "es" ? "Nuevo contacto" : "New contact"}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "es" ? "Nombre" : "Name"}</TableHead>
                    <TableHead>{locale === "es" ? "Cargo" : "Position"}</TableHead>
                    <TableHead>{locale === "es" ? "Correo" : "Email"}</TableHead>
                    <TableHead>{locale === "es" ? "Teléfono" : "Phone"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.firstName} {c.lastName}
                      </TableCell>
                      <TableCell>{c.position ?? "—"}</TableCell>
                      <TableCell>{c.email ?? "—"}</TableCell>
                      <TableCell>{c.phone ?? "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canWriteContacts}
                          onClick={() => {
                            setEditingContact(c);
                            setContactOpen(true);
                          }}
                        >
                          {t.edit}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={!canWriteContacts}
                          onClick={() => {
                            if (
                              confirm(locale === "es" ? "¿Eliminar contacto?" : "Delete contact?")
                            ) {
                              store.deleteContact(c.id);
                              toast.success(
                                locale === "es" ? "Contacto eliminado." : "Contact deleted.",
                              );
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {contacts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {t.noContactsYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">{t.relatedPositions}</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.noContactsAssigned}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "es" ? "Contacto" : "Contact"}</TableHead>
                      <TableHead>{locale === "es" ? "Cargo" : "Position"}</TableHead>
                      <TableHead>{locale === "es" ? "Correo" : "Email"}</TableHead>
                      <TableHead>{locale === "es" ? "Teléfono" : "Phone"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </TableCell>
                        <TableCell>{contact.position ?? "—"}</TableCell>
                        <TableCell>{contact.email ?? "—"}</TableCell>
                        <TableCell>{contact.phone ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.salesTasks}</CardTitle>
              <Button
                size="sm"
                disabled={!canWriteTasks}
                onClick={() => {
                  setEditingTask(null);
                  setTaskOpen(true);
                }}
              >
                <Plus className="size-4" /> {t.newTask}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "es" ? "Asunto" : "Subject"}</TableHead>
                    <TableHead>{locale === "es" ? "Vence" : "Due"}</TableHead>
                    <TableHead>{locale === "es" ? "Prioridad" : "Priority"}</TableHead>
                    <TableHead>{locale === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        <Link
                          to="/tasks/$id"
                          params={{ id: t.id }}
                          className="text-primary hover:underline"
                        >
                          {t.subject}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {t.dueDate} {t.dueTime ?? ""}
                      </TableCell>
                      <TableCell>
                        <Badge {...priorityBadge(t.priority)} />
                      </TableCell>
                      <TableCell>
                        <Badge {...statusBadge(t.status)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canWriteTasks}
                          onClick={() => {
                            setEditingTask(t);
                            setTaskOpen(true);
                          }}
                        >
                          {t.edit}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {t.noTasksYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardContent className="grid gap-4 p-6 text-sm md:grid-cols-2">
              <Field
                label={t.creditLimit}
                value={partner.status === "active" ? "USD 50,000" : t.pendingApproval}
              />
              <Field
                label={t.paymentTerms}
                value={partner.status === "active" ? "30 days" : t.prepaid}
              />
              <Field
                label={t.invoicingProfile}
                value={partner.taxId ? t.verified : t.missingTaxData}
              />
              <Field label={t.permissionsSource} value={t.managementApi} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{t.bankDetailsCard}</CardTitle>
                <Button
                  size="sm"
                  disabled={!canWritePartners}
                  onClick={() => {
                    setEditingBankIndex(null);
                    setBankEditorOpen(true);
                  }}
                >
                  <Plus className="size-4" /> {t.addBankDetail}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-sm text-muted-foreground dark:text-slate-300">
                {locale === "es"
                  ? "Las cuentas bancarias se gestionan aquí y se guardan en el registro de la empresa."
                  : "Bank accounts are managed directly here and stored with the partner record."}
              </div>
              {bankDetails.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.noBankDetails}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "es" ? "Banco" : "Bank"}</TableHead>
                      <TableHead>{locale === "es" ? "Cuenta" : "Account"}</TableHead>
                      <TableHead>{locale === "es" ? "SWIFT" : "SWIFT"}</TableHead>
                      <TableHead>{locale === "es" ? "Moneda" : "Currency"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankDetails.map((b, index) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.bankName}</TableCell>
                        <TableCell>{b.accountNumber}</TableCell>
                        <TableCell>{b.swift ?? "—"}</TableCell>
                        <TableCell>{b.currency ?? "—"}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canWritePartners}
                            onClick={() => {
                              setEditingBankIndex(index);
                              setBankEditorOpen(true);
                            }}
                          >
                            {t.edit}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={!canWritePartners}
                            onClick={() => {
                              if (confirm(t.deleteBankDetail)) {
                                store.upsertPartner({
                                  ...partner,
                                  bankDetails: bankDetails.filter((item) => item.id !== b.id),
                                });
                                toast.success(t.bankDetailDeleted);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{t.branchesWarehouses}</CardTitle>
                <Button
                  size="sm"
                  disabled={!canWritePartners}
                  onClick={() => {
                    setEditingBranchIndex(null);
                    setBranchEditorOpen(true);
                  }}
                >
                  <Plus className="size-4" /> {t.addBranchButton}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-sm text-muted-foreground dark:text-slate-300">
                {locale === "es"
                  ? "Las sucursales y almacenes se gestionan aquí y se guardan con el registro."
                  : "Branch and warehouse locations are managed directly here and stored with the record."}
              </div>
              {branches.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.noBranches}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "es" ? "Nombre" : "Name"}</TableHead>
                      <TableHead>{locale === "es" ? "Tipo" : "Type"}</TableHead>
                      <TableHead>{locale === "es" ? "Dirección" : "Address"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((b, index) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.name}</TableCell>
                        <TableCell className="capitalize">{b.type}</TableCell>
                        <TableCell>{b.address}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canWritePartners}
                            onClick={() => {
                              setEditingBranchIndex(index);
                              setBranchEditorOpen(true);
                            }}
                          >
                            {t.edit}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={!canWritePartners}
                            onClick={() => {
                              if (confirm(t.deleteBranch)) {
                                store.upsertPartner({
                                  ...partner,
                                  branches: branches.filter((item) => item.id !== b.id),
                                });
                                toast.success(t.branchDeleted);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">{t.internalNotes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {partner.notes || (
                  <span className="text-muted-foreground">{t.noInternalNotes}</span>
                )}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.quotesCard}</CardTitle>
              <Button
                size="sm"
                disabled={!canWriteQuotes}
                onClick={() => {
                  setEditingQuote(null);
                  setQuoteOpen(true);
                }}
              >
                <Plus className="size-4" /> {t.newQuote}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "es" ? "Número" : "Number"}</TableHead>
                    <TableHead>{locale === "es" ? "Asunto" : "Subject"}</TableHead>
                    <TableHead>{locale === "es" ? "Monto" : "Amount"}</TableHead>
                    <TableHead>{locale === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead>{locale === "es" ? "Válida hasta" : "Valid until"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((qq) => (
                    <TableRow key={qq.id}>
                      <TableCell className="font-mono text-xs">{qq.number}</TableCell>
                      <TableCell className="font-medium">
                        <Link to="/quotes/$id" params={{ id: qq.id }} className="hover:underline">
                          {qq.subject}
                        </Link>
                      </TableCell>
                      <TableCell>{formatMoney(qq.amount, qq.currency)}</TableCell>
                      <TableCell>
                        <Badge {...quoteStatusBadge(qq.status)} />
                      </TableCell>
                      <TableCell>{qq.validUntil}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/quotes/$id" params={{ id: qq.id }}>
                            {t.open}
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canWriteQuotes}
                          onClick={() => {
                            setEditingQuote(qq);
                            setQuoteOpen(true);
                          }}
                        >
                          {t.edit}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {quotes.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {t.noQuotesYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.relatedOperations}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "es" ? "Operación" : "Operation"}</TableHead>
                    <TableHead>{locale === "es" ? "Ruta" : "Route"}</TableHead>
                    <TableHead>{locale === "es" ? "Tráfico" : "Traffic"}</TableHead>
                    <TableHead>{locale === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead>{locale === "es" ? "Ingresos" : "Revenue"}</TableHead>
                    <TableHead>{locale === "es" ? "Abierta" : "Opened"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          to="/operations/$id"
                          params={{ id: operation.id }}
                          className="hover:underline"
                        >
                          {operation.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {operation.origin} / {operation.destination}
                      </TableCell>
                      <TableCell>{trafficModeLabels[operation.trafficMode]}</TableCell>
                      <TableCell>
                        <Badge {...crmStatusBadge(operation.status)}>
                          {operationStatusLabels[operation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatMoney(operation.revenue, operation.currency)}</TableCell>
                      <TableCell>{operation.openedAt}</TableCell>
                    </TableRow>
                  ))}
                  {operations.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {t.noOperationsYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.commercialMessages}</CardTitle>
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
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "es" ? "Asunto" : "Subject"}</TableHead>
                    <TableHead>{locale === "es" ? "Canal" : "Channel"}</TableHead>
                    <TableHead>{locale === "es" ? "Fecha" : "Date"}</TableHead>
                    <TableHead>{locale === "es" ? "Responsable" : "Owner"}</TableHead>
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
                      <TableCell>
                        <Badge variant="secondary">{channelLabels[interaction.channel]}</Badge>
                      </TableCell>
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
                            if (confirm(t.deleteInteraction)) {
                              store.deleteInteraction(interaction.id);
                              toast.success(t.interactionDeleted);
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
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {t.noMessagesYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.commercialHistory}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "es" ? "Evento" : "Event"}</TableHead>
                    <TableHead>{locale === "es" ? "Tipo" : "Type"}</TableHead>
                    <TableHead>{locale === "es" ? "Fecha" : "Date"}</TableHead>
                    <TableHead>{locale === "es" ? "Actor" : "Actor"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-muted-foreground">{event.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{historyTypeLabels[event.type]}</Badge>
                      </TableCell>
                      <TableCell>{event.occurredAt}</TableCell>
                      <TableCell>{event.actor}</TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {t.noHistoryYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="mt-4">
            <SalesEventTimeline
              partnerId={partner.id}
              title={locale === "es" ? "Cronología de eventos comerciales" : "Sales event timeline"}
            />
          </div>
        </TabsContent>

        <TabsContent value="profile" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.commercialProfile}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Field
                label={locale === "es" ? "Estado de ciclo de vida" : "Lifecycle status"}
                value={partner.status}
              />
              <Field
                label={locale === "es" ? "Vendedor asignado" : "Assigned salesperson"}
                value={partner.salesperson}
              />
              <Field
                label={t.customerRoles}
                value={partner.roles.map((role) => roleLabels[role]).join(", ")}
              />
              <Field
                label={t.numberOfOperations}
                value={String(operations.length)}
                action={
                  operations.length ? (
                    <Link to="/operations" className="text-primary hover:underline">
                      {t.openLabel}
                    </Link>
                  ) : undefined
                }
              />
              <Field
                label={t.lastOperation}
                value={lastOperation?.number}
                action={
                  lastOperation ? (
                    <Link
                      to="/operations/$id"
                      params={{ id: lastOperation.id }}
                      className="text-primary hover:underline"
                    >
                      {t.openLabel}
                    </Link>
                  ) : undefined
                }
              />
              <Field
                label={t.latestQuote}
                value={lastQuote?.number}
                action={
                  lastQuote ? (
                    <Link
                      to="/quotes/$id"
                      params={{ id: lastQuote.id }}
                      className="text-primary hover:underline"
                    >
                      {t.openLabel}
                    </Link>
                  ) : undefined
                }
              />
              <Field
                label={t.quoteOperationRatio}
                value={`${operations.length}/${quotes.length || 0}`}
              />
              <Field
                label={t.openQuotes}
                value={String(openQuotes.length)}
                action={
                  openQuotes.length ? (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setActiveTab("quotes")}
                    >
                      {t.openLabel}
                    </button>
                  ) : undefined
                }
              />
              <Field
                label={t.activeTasks}
                value={String(activeTasks.length)}
                action={
                  activeTasks.length ? (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setActiveTab("tasks")}
                    >
                      {t.openLabel}
                    </button>
                  ) : undefined
                }
              />
              <Field
                label={t.bankAccounts}
                value={String(bankDetails.length)}
                action={
                  canWritePartners ? (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setActiveTab("bank")}
                    >
                      {t.manage}
                    </button>
                  ) : undefined
                }
              />
              <Field
                label={t.branchesWarehouses}
                value={String(branches.length)}
                action={
                  canWritePartners ? (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setActiveTab("branches")}
                    >
                      {t.manage}
                    </button>
                  ) : undefined
                }
              />
              <Field
                label={t.bankSwifts}
                value={String(bankDetails.filter((item) => item.swift).length)}
              />
              <Field
                label={t.branchLocations}
                value={String(branches.filter((item) => item.address).length)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.customProfile}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {partner.customText || (
                  <span className="text-muted-foreground">{t.noCustomText}</span>
                )}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PartnerDialog open={editOpen} onOpenChange={setEditOpen} initial={partner} />
      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        initial={editingContact}
        defaultPartnerId={partner.id}
      />
      <TaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        initial={editingTask}
        defaultPartnerId={partner.id}
      />
      <QuoteDialog
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        initial={editingQuote}
        defaultPartnerId={partner.id}
      />
      <InteractionDialog
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
        initial={editingInteraction}
        defaultPartnerId={partner.id}
      />
      <SalesEventDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        partnerId={partner.id}
        initial={null}
      />
      <Dialog
        open={bankEditorOpen}
        onOpenChange={(open) => {
          setBankEditorOpen(open);
          if (!open) setEditingBankIndex(null);
        }}
      >
        <DialogContent className="dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>
              {editingBankIndex === null ? t.addBankDetail : t.editBankDetail}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput label={locale === "es" ? "Nombre del banco" : "Bank name"}>
              <Input
                value={bankForm.bankName}
                onChange={(event) =>
                  setBankForm((current) => ({ ...current, bankName: event.target.value }))
                }
              />
            </FieldInput>
            <FieldInput label={locale === "es" ? "Número de cuenta" : "Account number"}>
              <Input
                value={bankForm.accountNumber}
                onChange={(event) =>
                  setBankForm((current) => ({ ...current, accountNumber: event.target.value }))
                }
              />
            </FieldInput>
            <FieldInput label="SWIFT">
              <Input
                value={bankForm.swift}
                onChange={(event) =>
                  setBankForm((current) => ({ ...current, swift: event.target.value }))
                }
              />
            </FieldInput>
            <FieldInput label={locale === "es" ? "Moneda" : "Currency"}>
              <Input
                value={bankForm.currency}
                onChange={(event) =>
                  setBankForm((current) => ({ ...current, currency: event.target.value }))
                }
              />
            </FieldInput>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBankEditorOpen(false);
                setEditingBankIndex(null);
              }}
            >
              {t.cancel}
            </Button>
            <Button
              disabled={!canWritePartners}
              onClick={() => {
                const next = {
                  id:
                    editingBankIndex !== null
                      ? (partner.bankDetails[editingBankIndex]?.id ?? `bank-${Date.now()}`)
                      : `bank-${Date.now()}`,
                  bankName: bankForm.bankName.trim(),
                  accountNumber: bankForm.accountNumber.trim(),
                  swift: bankForm.swift.trim() || undefined,
                  currency: bankForm.currency.trim() || undefined,
                };
                const bankDetails =
                  editingBankIndex !== null
                    ? partner.bankDetails.map((item, index) =>
                        index === editingBankIndex ? next : item,
                      )
                    : [...partner.bankDetails, next];
                store.upsertPartner({ ...partner, bankDetails });
                toast.success(editingBankIndex !== null ? t.bankDetailUpdated : t.bankDetailAdded);
                setBankEditorOpen(false);
                setEditingBankIndex(null);
              }}
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={branchEditorOpen}
        onOpenChange={(open) => {
          setBranchEditorOpen(open);
          if (!open) setEditingBranchIndex(null);
        }}
      >
        <DialogContent className="dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>{editingBranchIndex === null ? t.addBranch : t.editBranch}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput label={locale === "es" ? "Nombre" : "Name"}>
              <Input
                value={branchForm.name}
                onChange={(event) =>
                  setBranchForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </FieldInput>
            <FieldInput label={locale === "es" ? "Tipo" : "Type"}>
              <Input
                value={branchForm.type}
                onChange={(event) =>
                  setBranchForm((current) => ({
                    ...current,
                    type: event.target.value === "warehouse" ? "warehouse" : "branch",
                  }))
                }
              />
            </FieldInput>
            <FieldInput label={locale === "es" ? "Dirección" : "Address"} className="sm:col-span-2">
              <Input
                value={branchForm.address}
                onChange={(event) =>
                  setBranchForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </FieldInput>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBranchEditorOpen(false);
                setEditingBranchIndex(null);
              }}
            >
              {t.cancel}
            </Button>
            <Button
              disabled={!canWritePartners}
              onClick={() => {
                const next = {
                  id:
                    editingBranchIndex !== null
                      ? (partner.branches[editingBranchIndex]?.id ?? `branch-${Date.now()}`)
                      : `branch-${Date.now()}`,
                  name: branchForm.name.trim(),
                  address: branchForm.address.trim(),
                  type: branchForm.type,
                };
                const branches =
                  editingBranchIndex !== null
                    ? partner.branches.map((item, index) =>
                        index === editingBranchIndex ? next : item,
                      )
                    : [...partner.branches, next];
                store.upsertPartner({ ...partner, branches });
                toast.success(editingBranchIndex !== null ? t.branchUpdated : t.branchAdded);
                setBranchEditorOpen(false);
                setEditingBranchIndex(null);
              }}
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  action,
}: {
  label: string;
  value?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground dark:text-slate-300">{label}</span>
      <span className="text-right">
        {value || "—"}
        {action ? <span className="ml-2 text-xs uppercase tracking-wide">{action}</span> : null}
      </span>
    </div>
  );
}

function FieldInput({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
