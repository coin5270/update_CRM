import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, useStoreVersion } from "@/lib/store";
import { PartnerDialog } from "@/components/PartnerDialog";
import type { Partner, PartnerRole } from "@/lib/types";

export const Route = createFileRoute("/_app/partners/")({
  component: PartnersPage,
});

const ROLE_LABELS: Record<PartnerRole, string> = {
  customer: "Customer",
  supplier: "Supplier",
  mixed: "Mixed",
  other: "Other",
};

function PartnersPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const partners = store.partners();
  const user = store.getUser();
  const canWritePartners = user?.permissions?.includes("partners:write") ?? false;
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Partner | null>(null);
  const t =
    locale === "es"
      ? {
          title: "Empresas",
          subtitle: "Clientes, proveedores y entidades relacionadas.",
          newPartner: "Nueva empresa",
          search: "Buscar por nombre o ID fiscal",
          allRoles: "Todos los roles",
          company: "Empresa",
          roles: "Roles",
          country: "País",
          salesperson: "Vendedor",
          status: "Estado",
          open: "Abrir",
          noPartners: "No hay empresas que coincidan con tus filtros.",
        }
      : {
          title: "Business Partners",
          subtitle: "Customers, suppliers and related entities.",
          newPartner: "New partner",
          search: "Search by name or tax ID",
          allRoles: "All roles",
          company: "Company",
          roles: "Roles",
          country: "Country",
          salesperson: "Salesperson",
          status: "Status",
          open: "Open",
          noPartners: "No partners match your filters.",
        };

  const filtered = partners.filter((p) => {
    const matchesQ =
      !q ||
      p.companyName.toLowerCase().includes(q.toLowerCase()) ||
      (p.tradeName ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (p.taxId ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesRole = role === "all" || p.roles.includes(role as PartnerRole);
    return matchesQ && matchesRole;
  });

  return (
    <div className="space-y-5 rounded-[2rem] bg-[#f8fbff] p-4 text-slate-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground dark:text-slate-300">{t.subtitle}</p>
        </div>
        <Button
          disabled={!canWritePartners}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> {t.newPartner}
        </Button>
      </div>

      <Card className="crm-surface border-white/70 bg-white/95 p-4 dark:border-white/10 dark:bg-slate-900/90">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.search}
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allRoles}</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-white/10">
              <TableHead>{t.company}</TableHead>
              <TableHead>{t.roles}</TableHead>
              <TableHead>{t.country}</TableHead>
              <TableHead>{t.salesperson}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.companyName}</div>
                  <div className="text-xs text-muted-foreground">{p.taxId ?? "—"}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {p.roles.map((r) => (
                      <Badge key={r} variant="secondary">
                        {ROLE_LABELS[r]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{p.country ?? "—"}</TableCell>
                <TableCell>{p.salesperson ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/partners/$id" params={{ id: p.id }}>
                      {t.open}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                  {t.noPartners}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <PartnerDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
