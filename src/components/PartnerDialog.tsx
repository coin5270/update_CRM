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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, newId } from "@/lib/store";
import type { BankDetail, Branch, Partner, PartnerRole, PartnerStatus } from "@/lib/types";

const ROLES: { value: PartnerRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "supplier", label: "Supplier" },
  { value: "mixed", label: "Mixed" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  "Argentina",
  "Brazil",
  "Chile",
  "China",
  "Colombia",
  "Germany",
  "Mexico",
  "Netherlands",
  "Paraguay",
  "Peru",
  "Spain",
  "United States",
  "Uruguay",
];

const COUNTRY_FLAGS: Record<string, string> = {
  Argentina: "🇦🇷",
  Brazil: "🇧🇷",
  Chile: "🇨🇱",
  China: "🇨🇳",
  Colombia: "🇨🇴",
  Germany: "🇩🇪",
  Mexico: "🇲🇽",
  Netherlands: "🇳🇱",
  Paraguay: "🇵🇾",
  Peru: "🇵🇪",
  Spain: "🇪🇸",
  "United States": "🇺🇸",
  Uruguay: "🇺🇾",
};

const LOCATION_OPTIONS: Record<string, { cities: string[]; states: string[] }> = {
  Argentina: {
    cities: ["Buenos Aires", "Cordoba", "Mendoza", "Rosario"],
    states: ["Buenos Aires", "CABA", "Cordoba", "Mendoza", "Santa Fe"],
  },
  Brazil: {
    cities: ["Rio de Janeiro", "Sao Paulo", "Santos", "Curitiba"],
    states: ["Rio de Janeiro", "Sao Paulo", "Parana", "Santa Catarina"],
  },
  Chile: {
    cities: ["Santiago", "Valparaiso", "Concepcion"],
    states: ["Santiago Metropolitan", "Valparaiso", "Biobio"],
  },
  Colombia: {
    cities: ["Bogota", "Medellin", "Cali"],
    states: ["Bogota D.C.", "Antioquia", "Valle del Cauca"],
  },
  Mexico: {
    cities: ["Mexico City", "Monterrey", "Guadalajara"],
    states: ["CDMX", "Nuevo Leon", "Jalisco"],
  },
  Peru: {
    cities: ["Lima", "Arequipa", "Callao"],
    states: ["Lima Province", "Arequipa", "Callao"],
  },
  Spain: {
    cities: ["Madrid", "Barcelona", "Valencia"],
    states: ["Madrid", "Catalonia", "Valencian Community"],
  },
  "United States": {
    cities: ["Miami", "New York", "Los Angeles", "Houston"],
    states: ["Florida", "New York", "California", "Texas"],
  },
  Uruguay: {
    cities: ["Montevideo", "Maldonado", "Paysandu"],
    states: ["Montevideo", "Maldonado", "Paysandu"],
  },
};

const LANGUAGES = ["en", "es", "pt", "fr", "de"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Partner | null;
}

const empty: Partner = {
  id: "",
  companyName: "",
  roles: ["customer"],
  status: "prospect",
  phones: [],
  emails: [],
  bankDetails: [],
  branches: [],
  createdAt: new Date().toISOString(),
};

export function PartnerDialog({ open, onOpenChange, initial }: Props) {
  const locale = store.getLocale();
  const salespeople = store.salespeople();
  const [form, setForm] = React.useState<Partner>(empty);
  const [countrySearch, setCountrySearch] = React.useState("");
  const locationOptions = form.country
    ? (LOCATION_OPTIONS[form.country] ?? { cities: [], states: [] })
    : { cities: [], states: [] };
  const cityOptions = locationOptions.cities;
  const stateOptions = locationOptions.states;
  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase()),
  );
  const t =
    locale === "es"
      ? {
          edit: "Editar empresa",
          new: "Nueva empresa",
          company: "Nombre de la empresa *",
          trade: "Nombre comercial",
          tax: "ID fiscal",
          website: "Sitio web",
          country: "País",
          searchCountry: "Buscar país",
          selectCountry: "Seleccionar país",
          noCountries: "No se encontraron países.",
          city: "Ciudad",
          selectCity: "Seleccionar ciudad",
          state: "Provincia / Estado",
          selectState: "Seleccionar provincia / estado",
          postal: "Código postal",
          address: "Dirección",
          phones: "Teléfonos (separados por coma)",
          emails: "Correos (separados por coma)",
          status: "Estado",
          salesperson: "Vendedor",
          unassigned: "Sin asignar",
          manager: "Gerente",
          language: "Idioma",
          selectLanguage: "Seleccionar idioma",
          roles: "Roles",
          notes: "Notas internas",
          customText: "Texto de perfil personalizado",
          bankDetails: "Datos bancarios",
          addBank: "Agregar banco",
          remove: "Eliminar",
          noBank: "No se agregaron datos bancarios.",
          branches: "Sucursales / almacenes",
          addLocation: "Agregar ubicación",
          branch: "Sucursal",
          warehouse: "Almacén",
          name: "Nombre",
          save: "Guardar",
          cancel: "Cancelar",
          partnerUpdated: "Empresa actualizada.",
          partnerCreated: "Empresa creada.",
          bankName: "Nombre del banco",
          accountNumber: "Número de cuenta",
          swift: "SWIFT",
          currency: "Moneda",
          noBranches: "No se agregaron sucursales ni almacenes.",
          lead: "Lead",
          prospect: "Prospecto",
          active: "Activa",
          inactive: "Inactiva",
          customer: "Cliente",
          supplier: "Proveedor",
          mixed: "Mixto",
          other: "Otro",
        }
      : {
          edit: "Edit partner",
          new: "New business partner",
          company: "Company name *",
          trade: "Trade name",
          tax: "Tax ID",
          website: "Website",
          country: "Country",
          searchCountry: "Search country",
          selectCountry: "Select country",
          noCountries: "No countries found.",
          city: "City",
          selectCity: "Select city",
          state: "State / Province",
          selectState: "Select state / province",
          postal: "Postal code",
          address: "Address",
          phones: "Phones (comma-separated)",
          emails: "Emails (comma-separated)",
          status: "Status",
          salesperson: "Salesperson",
          unassigned: "Unassigned",
          manager: "Manager",
          language: "Language",
          selectLanguage: "Select language",
          roles: "Roles",
          notes: "Internal notes",
          customText: "Custom profile text",
          bankDetails: "Bank details",
          addBank: "Add bank",
          remove: "Remove",
          noBank: "No bank details added.",
          branches: "Branches / Warehouses",
          addLocation: "Add location",
          branch: "Branch",
          warehouse: "Warehouse",
          name: "Name",
          save: "Save partner",
          cancel: "Cancel",
          partnerUpdated: "Partner updated.",
          partnerCreated: "Partner created.",
          bankName: "Bank name",
          accountNumber: "Account number",
          swift: "SWIFT",
          currency: "Currency",
          noBranches: "No branches or warehouses added.",
          lead: "Lead",
          prospect: "Prospect",
          active: "Active",
          inactive: "Inactive",
          customer: "Customer",
          supplier: "Supplier",
          mixed: "Mixed",
          other: "Other",
        };
  const roleLabels: Record<PartnerRole, string> = {
    customer: t.customer,
    supplier: t.supplier,
    mixed: t.mixed,
    other: t.other,
  };

  React.useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              ...initial,
              bankDetails: initial.bankDetails ?? [],
              branches: initial.branches ?? [],
            }
          : { ...empty, id: newId("p") },
      );
    }
  }, [open, initial]);

  const update = <K extends keyof Partner>(k: K, v: Partner[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updateCountry = (country: string) => {
    const nextOptions = LOCATION_OPTIONS[country] ?? { cities: [], states: [] };
    setCountrySearch("");
    setForm((current) => ({
      ...current,
      country,
      city: nextOptions.cities.includes(current.city ?? "") ? current.city : undefined,
      state: nextOptions.states.includes(current.state ?? "") ? current.state : undefined,
    }));
  };

  const toggleRole = (r: PartnerRole) => {
    const has = form.roles.includes(r);
    if (has && form.roles.length === 1) return;
    update("roles", has ? form.roles.filter((x) => x !== r) : [...form.roles, r]);
  };

  const updateBankDetail = <K extends keyof BankDetail>(
    id: string,
    key: K,
    value: BankDetail[K],
  ) => {
    update(
      "bankDetails",
      form.bankDetails.map((bank) => (bank.id === id ? { ...bank, [key]: value } : bank)),
    );
  };

  const updateBranch = <K extends keyof Branch>(id: string, key: K, value: Branch[K]) => {
    update(
      "branches",
      form.branches.map((branch) => (branch.id === id ? { ...branch, [key]: value } : branch)),
    );
  };

  const addBankDetail = () => {
    update("bankDetails", [
      ...form.bankDetails,
      { id: newId("bank"), bankName: "", accountNumber: "", currency: "USD" },
    ]);
  };

  const addBranch = () => {
    update("branches", [
      ...form.branches,
      { id: newId("branch"), name: "", address: "", type: "branch" },
    ]);
  };

  const onSave = () => {
    if (!form.companyName.trim()) return;
    store.upsertPartner({
      ...form,
      phones: typeof form.phones === "string" ? [form.phones] : form.phones,
      emails: typeof form.emails === "string" ? [form.emails] : form.emails,
    });
    toast.success(initial ? t.partnerUpdated : t.partnerCreated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? t.edit : t.new}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.company}>
            <Input
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </Field>
          <Field label={t.trade}>
            <Input
              value={form.tradeName ?? ""}
              onChange={(e) => update("tradeName", e.target.value)}
            />
          </Field>
          <Field label={t.tax}>
            <Input value={form.taxId ?? ""} onChange={(e) => update("taxId", e.target.value)} />
          </Field>
          <Field label={t.website}>
            <Input value={form.website ?? ""} onChange={(e) => update("website", e.target.value)} />
          </Field>
          <Field label={t.country}>
            <div className="space-y-2">
              <Input
                placeholder={t.searchCountry}
                value={countrySearch}
                onChange={(event) => setCountrySearch(event.target.value)}
              />
              <Select value={form.country ?? ""} onValueChange={updateCountry}>
                <SelectTrigger>
                  {form.country ? (
                    <span className="mr-2 text-base leading-none">
                      {COUNTRY_FLAGS[form.country] ?? "🌍"}
                    </span>
                  ) : null}
                  <SelectValue placeholder={t.selectCountry} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      <span className="mr-2">{COUNTRY_FLAGS[country] ?? "🌍"}</span>
                      <span>{country}</span>
                    </SelectItem>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">{t.noCountries}</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </Field>
          <Field label={t.city}>
            <Select value={form.city ?? ""} onValueChange={(value) => update("city", value)}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectCity} />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.state}>
            <Select value={form.state ?? ""} onValueChange={(value) => update("state", value)}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectState} />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.postal}>
            <Input
              value={form.postalCode ?? ""}
              onChange={(e) => update("postalCode", e.target.value)}
            />
          </Field>
          <Field label={t.address} className="sm:col-span-2">
            <Input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <Field label={t.phones}>
            <Input
              value={form.phones.join(", ")}
              onChange={(e) =>
                update(
                  "phones",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field label={t.emails}>
            <Input
              value={form.emails.join(", ")}
              onChange={(e) =>
                update(
                  "emails",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field label={t.status}>
            <Select value={form.status} onValueChange={(v) => update("status", v as PartnerStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">{t.lead}</SelectItem>
                <SelectItem value="prospect">{t.prospect}</SelectItem>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="inactive">{t.inactive}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.salesperson}>
            <Select value={form.salesperson ?? ""} onValueChange={(v) => update("salesperson", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t.unassigned} />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.manager}>
            <Input value={form.manager ?? ""} onChange={(e) => update("manager", e.target.value)} />
          </Field>
          <Field label={t.language}>
            <Select
              value={form.language ?? ""}
              onValueChange={(value) => update("language", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectLanguage} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.roles} className="sm:col-span-2">
            <div className="flex gap-4 flex-wrap">
              {ROLES.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.roles.includes(r.value)}
                    onCheckedChange={() => toggleRole(r.value)}
                  />
                  {roleLabels[r.value]}
                </label>
              ))}
            </div>
          </Field>
          <Field label={t.notes} className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Field>
          <Field label={t.customText} className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.customText ?? ""}
              onChange={(e) => update("customText", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2 space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between gap-3">
              <Label>{t.bankDetails}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addBankDetail}>
                <Plus className="size-4" /> {t.addBank}
              </Button>
            </div>
            <div className="space-y-3">
              {form.bankDetails.map((bank) => (
                <div key={bank.id} className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
                  <Input
                    placeholder={t.bankName}
                    value={bank.bankName}
                    onChange={(event) => updateBankDetail(bank.id, "bankName", event.target.value)}
                  />
                  <Input
                    placeholder={t.accountNumber}
                    value={bank.accountNumber}
                    onChange={(event) =>
                      updateBankDetail(bank.id, "accountNumber", event.target.value)
                    }
                  />
                  <Input
                    placeholder={t.swift}
                    value={bank.swift ?? ""}
                    onChange={(event) => updateBankDetail(bank.id, "swift", event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.currency}
                      value={bank.currency ?? ""}
                      onChange={(event) =>
                        updateBankDetail(bank.id, "currency", event.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() =>
                        update(
                          "bankDetails",
                          form.bankDetails.filter((item) => item.id !== bank.id),
                        )
                      }
                      aria-label={t.remove}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {form.bankDetails.length === 0 && (
                <div className="text-sm text-muted-foreground">{t.noBank}</div>
              )}
            </div>
          </div>
          <div className="sm:col-span-2 space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between gap-3">
              <Label>{t.branches}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addBranch}>
                <Plus className="size-4" /> {t.addLocation}
              </Button>
            </div>
            <div className="space-y-3">
              {form.branches.map((branch) => (
                <div
                  key={branch.id}
                  className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-2"
                >
                  <Input
                    placeholder={t.name}
                    value={branch.name}
                    onChange={(event) => updateBranch(branch.id, "name", event.target.value)}
                  />
                  <Select
                    value={branch.type}
                    onValueChange={(value) =>
                      updateBranch(branch.id, "type", value as Branch["type"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch">{t.branch}</SelectItem>
                      <SelectItem value="warehouse">{t.warehouse}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="sm:col-span-2"
                    placeholder={t.address}
                    value={branch.address}
                    onChange={(event) => updateBranch(branch.id, "address", event.target.value)}
                  />
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        update(
                          "branches",
                          form.branches.filter((item) => item.id !== branch.id),
                        )
                      }
                    >
                      <Trash2 className="size-4" /> {t.remove}
                    </Button>
                  </div>
                </div>
              ))}
              {form.branches.length === 0 && (
                <div className="text-sm text-muted-foreground">{t.noBranches}</div>
              )}
            </div>
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

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
