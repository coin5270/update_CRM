import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  CheckSquare,
  FileText,
  Bell,
  Ship,
  MessageSquare,
  History,
  CalendarDays,
  FileBarChart,
  Zap,
  Plug,
  UserCog,
  FileClock,
  Languages,
  MoonStar,
  LogOut,
  Menu,
  Search,
  Plus,
  SunMedium,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { store, useStoreVersion } from "@/lib/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/partners", label: "Business Partners", icon: Building2, permission: "partners:read" },
  { to: "/contacts", label: "Contacts", icon: Users, permission: "contacts:read" },
  { to: "/quotes", label: "Quotes", icon: FileText, permission: "quotes:read" },
  { to: "/tasks", label: "Follow-ups", icon: CheckSquare, permission: "tasks:read" },
  { to: "/operations", label: "Bookings", icon: Ship, permission: "operations:read" },
  { to: "/messages", label: "Messages", icon: MessageSquare, permission: "interactions:read" },
  { to: "/history", label: "History", icon: History, permission: "history:read" },
  {
    to: "/reports/sales-traceability",
    label: "Follow-up Report",
    icon: FileBarChart,
    permission: "history:read",
  },
  { to: "/sales-events", label: "Sales Activity", icon: CalendarDays, permission: "history:read" },
  { to: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:read" },
  { to: "/automations", label: "Automations", icon: Zap, permission: "automations:read" },
  { to: "/integration", label: "Integration", icon: Plug, permission: "integration:read" },
  { to: "/users", label: "Users", icon: UserCog, permission: "users:read" },
  { to: "/audit", label: "Audit", icon: FileClock, permission: "audit:read" },
];

export function AppLayout() {
  useStoreVersion();
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = React.useState(false);
  const [didBootstrap, setDidBootstrap] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!mounted) return;
    const saved = window.localStorage.getItem("crm.theme");
    const prefersDark =
      saved === "dark" || (!saved && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    const nextTheme: "light" | "dark" = prefersDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setTheme(nextTheme);
  }, [mounted]);
  const user = mounted ? store.getUser() : null;
  const unreadCount = mounted ? store.unreadNotifications().length : 0;
  const locale = mounted ? store.getLocale() : "en";
  const text =
    locale === "es"
      ? {
          search: "Buscar en CRM...",
          create: "Crear",
          newRecord: "Nuevo registro",
          partner: "Empresa",
          contact: "Contacto",
          followUp: "Seguimiento",
          quote: "Cotización",
          booking: "Reserva",
          interaction: "Interacción",
          quickNav: "Navegación rápida para móvil.",
          commandPlaceholder: "Buscar empresas, cotizaciones, seguimientos y reservas...",
          commandEmpty: "No se encontraron registros del CRM.",
          partnersGroup: "Empresas",
          quotesGroup: "Cotizaciones",
          followUpsGroup: "Seguimientos",
          bookingsGroup: "Reservas",
          contactsGroup: "Contactos",
          notificationsGroup: "Notificaciones",
          logOut: "Cerrar sesión",
          openMenu: "Abrir menú",
          lightMode: "Modo claro",
          darkMode: "Modo oscuro",
        }
      : {
          search: "Search CRM...",
          create: "Create",
          newRecord: "New record",
          partner: "Business partner",
          contact: "Contact",
          followUp: "Follow-up",
          quote: "Quote",
          booking: "Booking",
          interaction: "Interaction",
          quickNav: "Quick navigation for mobile.",
          commandPlaceholder: "Search partners, quotes, tasks, and operations...",
          commandEmpty: "No CRM records found.",
          partnersGroup: "Business Partners",
          quotesGroup: "Quotes",
          followUpsGroup: "Follow-ups",
          bookingsGroup: "Bookings",
          contactsGroup: "Contacts",
          notificationsGroup: "Notifications",
          logOut: "Log out",
          openMenu: "Open menu",
          lightMode: "Light mode",
          darkMode: "Dark mode",
        };
  const navLabel = (label: string) => {
    if (locale !== "es") return label;
    const translations: Record<string, string> = {
      Dashboard: "Panel",
      "Business Partners": "Empresas",
      Contacts: "Contactos",
      Quotes: "Cotizaciones",
      "Follow-ups": "Seguimientos",
      Bookings: "Reservas",
      Messages: "Mensajes",
      History: "Historial",
      "Follow-up Report": "Informe de seguimiento",
      "Sales Activity": "Actividad comercial",
      Notifications: "Notificaciones",
      Automations: "Automatizaciones",
      Integration: "Integración",
      Users: "Usuarios",
      Audit: "Auditoría",
    };
    return translations[label] ?? label;
  };

  React.useEffect(() => {
    if (mounted && !user && location.pathname !== "/login") navigate({ to: "/login" });
  }, [location.pathname, mounted, user, navigate]);

  React.useEffect(() => {
    if (!mounted || !user || didBootstrap) return;
    setDidBootstrap(true);
    void store.bootstrapFromApi();
  }, [didBootstrap, mounted, user]);

  if (!mounted || !user) return null;

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const canSee = (permission?: string) =>
    !permission || !user.permissions || user.permissions.includes(permission);
  const partners = store.partners();
  const contacts = store.contacts();
  const quotes = store.quotes();
  const tasks = store.tasks();
  const operations = store.operations();
  const notifications = store.notifications();

  const openRecord = (kind: string, id: string) => {
    setSearchOpen(false);
    setMobileNavOpen(false);
    if (kind === "partner") navigate({ to: "/partners/$id", params: { id } });
    else if (kind === "quote") navigate({ to: "/quotes/$id", params: { id } });
    else if (kind === "task") navigate({ to: "/tasks/$id", params: { id } });
    else if (kind === "operation") navigate({ to: "/operations/$id", params: { id } });
    else if (kind === "contact") navigate({ to: "/contacts/$id", params: { id } });
    else if (kind === "notification") navigate({ to: "/notifications" });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent print:block print:h-auto print:overflow-visible">
      <aside className="hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl print:hidden md:sticky md:top-0 md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-content-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-lg shadow-emerald-900/20">
              C
            </div>
            <div>
              <div className="font-semibold leading-none">SalesCRM</div>
              <div className="mt-1 text-xs text-sidebar-foreground/60">Cargo cockpit</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.filter((n) => canSee(n.permission)).map((n) => {
            const active = n.exact
              ? location.pathname === n.to
              : location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:translate-x-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.16)]",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground dark:hover:bg-white/6 dark:hover:text-sidebar-accent-foreground",
                )}
              >
                <span className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_18%,transparent_82%,rgba(255,255,255,0.08))] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_18%,transparent_82%,rgba(255,255,255,0.08))]" />
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-gradient-to-b dark:from-white/0 dark:via-white/80 dark:to-white/0" />
                <Icon className="size-4 transition-transform group-hover:scale-110" />
                <span className="flex-1">{navLabel(n.label)}</span>
                {n.to === "/notifications" && unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 flex items-center gap-3 border-t border-sidebar-border p-3">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="truncate text-xs text-sidebar-foreground/60">{user.email}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              store.logout();
              navigate({ to: "/login" });
            }}
            aria-label={text.logOut}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:block print:h-auto print:overflow-visible">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/60 bg-white/70 px-4 shadow-sm backdrop-blur-xl print:hidden dark:border-white/10 dark:bg-slate-950/75">
          <Button
            variant="outline"
            size="icon"
            className="border-white/70 bg-white/80 md:hidden dark:border-white/10 dark:bg-white/10"
            onClick={() => setMobileNavOpen(true)}
            aria-label={text.openMenu}
          >
            <Menu className="size-4" />
          </Button>
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={text.search}
              className="h-10 rounded-full border-white/70 bg-white/80 pl-8 dark:border-white/10 dark:bg-white/10"
              readOnly
              onFocus={() => setSearchOpen(true)}
              onClick={() => setSearchOpen(true)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="hidden sm:inline-flex">
                <Plus className="size-4" /> {text.create}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{text.newRecord}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canSee("partners:write") && (
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({ to: "/partners" });
                  }}
                >
                  <Building2 className="size-4" />
                  {text.partner}
                </DropdownMenuItem>
              )}
              {canSee("contacts:write") && (
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({ to: "/contacts" });
                  }}
                >
                  <Users className="size-4" />
                  {text.contact}
                </DropdownMenuItem>
              )}
              {canSee("tasks:write") && (
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({ to: "/tasks" });
                  }}
                >
                  <CheckSquare className="size-4" />
                  {text.followUp}
                </DropdownMenuItem>
              )}
              {canSee("quotes:write") && (
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({ to: "/quotes" });
                  }}
                >
                  <FileText className="size-4" />
                  {text.quote}
                </DropdownMenuItem>
              )}
              {canSee("operations:write") && (
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({ to: "/operations" });
                  }}
                >
                  <Ship className="size-4" />
                  {text.booking}
                </DropdownMenuItem>
              )}
              {canSee("interactions:write") && (
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({ to: "/messages" });
                  }}
                >
                  <MessageSquare className="size-4" />
                  {text.interaction}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="hidden border-white/70 bg-white/80 sm:inline-flex dark:border-white/10 dark:bg-white/10"
            onClick={() => store.setLocale(locale === "en" ? "es" : "en")}
            aria-label={locale === "en" ? "Switch language" : "Cambiar idioma"}
          >
            <Languages className="size-4" />
            {locale === "en" ? "EN" : "ES"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden border-white/70 bg-white/80 sm:inline-flex dark:border-white/10 dark:bg-white/10"
            aria-label={theme === "dark" ? text.lightMode : text.darkMode}
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              document.documentElement.classList.toggle("dark", next === "dark");
              window.localStorage.setItem("crm.theme", next);
              setTheme(next);
            }}
          >
            {theme === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
          </Button>
          <div className="md:hidden">
            <Avatar className="size-8 ring-1 ring-white/70 dark:ring-white/10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="crm-fade-in min-h-0 flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="flex w-[84vw] max-w-sm flex-col bg-sidebar p-4 text-sidebar-foreground"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-sidebar-foreground">SalesCRM</SheetTitle>
            <SheetDescription className="text-sidebar-foreground/60">
              {text.quickNav}
            </SheetDescription>
          </SheetHeader>
          <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {NAV.filter((n) => canSee(n.permission)).map((n) => {
              const active = n.exact
                ? location.pathname === n.to
                : location.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:translate-x-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.16)]",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground dark:hover:bg-white/6 dark:hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_18%,transparent_82%,rgba(255,255,255,0.08))] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_18%,transparent_82%,rgba(255,255,255,0.08))]" />
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-gradient-to-b dark:from-white/0 dark:via-white/80 dark:to-white/0" />
                  <Icon className="size-4 transition-transform group-hover:scale-110" />
                  <span className="flex-1">{navLabel(n.label)}</span>
                  {n.to === "/notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex shrink-0 items-center gap-3 border-t border-sidebar-border pt-4">
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="truncate text-xs text-sidebar-foreground/60">{user.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                store.logout();
                navigate({ to: "/login" });
              }}
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder={text.commandPlaceholder} />
        <CommandList>
          <CommandEmpty>{text.commandEmpty}</CommandEmpty>
          {canSee("partners:read") && (
            <CommandGroup heading={text.partnersGroup}>
              {partners.slice(0, 20).map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={`${partner.companyName} ${partner.taxId ?? ""} ${partner.emails.join(" ")}`}
                  onSelect={() => openRecord("partner", partner.id)}
                >
                  <Building2 className="size-4" />
                  <div>
                    <div>{partner.companyName}</div>
                    <div className="text-xs text-muted-foreground">{partner.status}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {canSee("quotes:read") && (
            <CommandGroup heading={text.quotesGroup}>
              {quotes.slice(0, 20).map((quote) => (
                <CommandItem
                  key={quote.id}
                  value={`${quote.number} ${quote.subject} ${quote.status}`}
                  onSelect={() => openRecord("quote", quote.id)}
                >
                  <FileText className="size-4" />
                  <div>
                    <div>
                      {quote.number} · {quote.subject}
                    </div>
                    <div className="text-xs text-muted-foreground">{quote.status}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {canSee("tasks:read") && (
            <CommandGroup heading={text.followUpsGroup}>
              {tasks.slice(0, 20).map((task) => (
                <CommandItem
                  key={task.id}
                  value={`${task.subject} ${task.status} ${task.responsibleUser}`}
                  onSelect={() => openRecord("task", task.id)}
                >
                  <CheckSquare className="size-4" />
                  <div>
                    <div>{task.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.status} · {task.dueDate}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {canSee("operations:read") && (
            <CommandGroup heading={text.bookingsGroup}>
              {operations.slice(0, 20).map((operation) => (
                <CommandItem
                  key={operation.id}
                  value={`${operation.number} ${operation.origin} ${operation.destination} ${operation.status}`}
                  onSelect={() => openRecord("operation", operation.id)}
                >
                  <Ship className="size-4" />
                  <div>
                    <div>{operation.number}</div>
                    <div className="text-xs text-muted-foreground">
                      {operation.origin} / {operation.destination}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {canSee("contacts:read") && (
            <CommandGroup heading={text.contactsGroup}>
              {contacts.slice(0, 20).map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.firstName} ${contact.lastName} ${contact.email ?? ""} ${contact.position ?? ""}`}
                  onSelect={() => openRecord("contact", contact.id)}
                >
                  <Users className="size-4" />
                  <div>
                    <div>
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {contact.email ?? "No email"}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {canSee("notifications:read") && (
            <CommandGroup heading={text.notificationsGroup}>
              {notifications.slice(0, 20).map((notification) => (
                <CommandItem
                  key={notification.id}
                  value={`${notification.title} ${notification.message}`}
                  onSelect={() => openRecord("notification", notification.id)}
                >
                  <Bell className="size-4" />
                  <div>
                    <div>{notification.title}</div>
                    <div className="text-xs text-muted-foreground">{notification.severity}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
