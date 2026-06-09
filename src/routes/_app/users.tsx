import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { newId, store, useStoreVersion } from "@/lib/store";
import type { User } from "@/lib/types";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

const PERMISSIONS = [
  "partners:read",
  "partners:write",
  "contacts:read",
  "contacts:write",
  "tasks:read",
  "tasks:write",
  "quotes:read",
  "quotes:write",
  "operations:read",
  "operations:write",
  "interactions:read",
  "interactions:write",
  "notifications:read",
  "notifications:write",
  "history:read",
  "history:write",
  "automations:read",
  "automations:write",
  "integration:read",
  "integration:write",
  "pipeline:read",
  "pipeline:write",
  "audit:read",
  "users:read",
  "users:write",
];

function UsersPage() {
  useStoreVersion();
  const locale = store.getLocale();
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const currentUser = store.getUser();
  const canWrite = currentUser?.permissions?.includes("users:write") ?? false;
  const totalPermissions = users.reduce((sum, user) => sum + (user.permissions?.length ?? 0), 0);
  const t =
    locale === "es"
      ? {
          title: "Usuarios y permisos",
          subtitle: "Control de acceso respaldado por backend para módulos CRM.",
          newUser: "Nuevo usuario",
          users: "Usuarios",
          permissionFlags: "Banderas de permisos",
          grantedAcross: "Otorgados entre usuarios.",
          current: "Actual",
          signedIn: "Operador conectado.",
          user: "Usuario",
          role: "Rol",
          permissions: "Permisos",
          name: "Nombre",
          email: "Correo",
          save: "Guardar",
          saving: "Guardando",
          salesManager: "Gerente de ventas",
          sales: "Ventas",
          operations: "Operaciones",
          readOnly: "Solo lectura",
        }
      : {
          title: "Users & Permissions",
          subtitle: "Backend-backed access control for CRM modules.",
          newUser: "New user",
          users: "Users",
          permissionFlags: "Permission flags",
          grantedAcross: "Granted across users.",
          current: "Current",
          signedIn: "Signed-in operator.",
          user: "User",
          role: "Role",
          permissions: "Permissions",
          name: "Name",
          email: "Email",
          save: "Save",
          saving: "Saving",
          salesManager: "Sales manager",
          sales: "Sales",
          operations: "Operations",
          readOnly: "Read only",
        };

  React.useEffect(() => {
    void store.users().then((items) => {
      setUsers(items);
      setSelectedId((current) => current || items[0]?.id || "");
    });
  }, []);

  const selected = users.find((user) => user.id === selectedId);
  const roleLabels =
    locale === "es"
      ? {
          sales_manager: "Gerente de ventas",
          sales: "Ventas",
          operations: "Operaciones",
          readonly: "Solo lectura",
        }
      : {
          sales_manager: "Sales manager",
          sales: "Sales",
          operations: "Operations",
          readonly: "Read only",
        };
  const emptyState = locale === "es" ? "No hay usuario seleccionado." : "No user selected.";

  const updateSelected = (next: User) => {
    setUsers((items) => items.map((item) => (item.id === next.id ? next : item)));
  };

  const togglePermission = (permission: string) => {
    if (!selected) return;
    const permissions = selected.permissions ?? [];
    const nextPermissions = permissions.includes(permission)
      ? permissions.filter((item) => item !== permission)
      : [...permissions, permission];
    updateSelected({ ...selected, permissions: nextPermissions });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    store.upsertUser(selected);
    await store.users().then(setUsers);
    setSaving(false);
  };

  const createUser = () => {
    if (!canWrite) return;
    const user: User = {
      id: newId("u"),
      name: "New User",
      email: `new-user-${Date.now()}@salescrm.app`,
      role: "sales",
      permissions: ["partners:read", "contacts:read", "tasks:read", "quotes:read"],
    };
    setUsers((items) => [user, ...items]);
    setSelectedId(user.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button variant="outline" disabled={!canWrite} onClick={createUser}>
          <Plus className="size-4" /> {t.newUser}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.users}</div>
              <div className="mt-1 text-2xl font-semibold">{users.length}</div>
              <div className="text-sm text-muted-foreground">
                {locale === "es" ? "Cuentas en el sistema." : "Accounts in the system."}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.permissionFlags}
              </div>
              <div className="mt-1 text-2xl font-semibold">{totalPermissions}</div>
              <div className="text-sm text-muted-foreground">{t.grantedAcross}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.current}
              </div>
              <div className="mt-1 text-sm font-semibold">{currentUser?.email ?? "-"}</div>
              <div className="text-sm text-muted-foreground">{t.signedIn}</div>
            </Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.user}</TableHead>
                  <TableHead>{t.role}</TableHead>
                  <TableHead>{t.permissions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className={selectedId === user.id ? "bg-muted/60" : ""}
                    onClick={() => setSelectedId(user.id)}
                  >
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[user.role ?? "sales"]}</Badge>
                    </TableCell>
                    <TableCell>{user.permissions?.length ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card className="p-5">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-content-center rounded-md bg-muted">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{selected.name}</div>
                    <div className="text-xs text-muted-foreground">{selected.email}</div>
                  </div>
                </div>
                <Button onClick={save} disabled={saving || !canWrite}>
                  <Save className="size-4" /> {saving ? t.saving : t.save}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t.name}</Label>
                  <Input
                    value={selected.name}
                    disabled={!canWrite}
                    onChange={(event) => updateSelected({ ...selected, name: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.email}</Label>
                  <Input
                    type="email"
                    value={selected.email}
                    disabled={!canWrite}
                    onChange={(event) => updateSelected({ ...selected, email: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.role}</Label>
                  <Select
                    value={selected.role ?? "sales"}
                    disabled={!canWrite}
                    onValueChange={(role) => updateSelected({ ...selected, role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_manager">{t.salesManager}</SelectItem>
                      <SelectItem value="sales">{t.sales}</SelectItem>
                      <SelectItem value="operations">{t.operations}</SelectItem>
                      <SelectItem value="readonly">{t.readOnly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={selected.permissions?.includes(permission) ?? false}
                      disabled={!canWrite}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">{emptyState}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
