import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { newId, store } from "@/lib/store";
import type { ReminderRule, TaskPriority } from "@/lib/types";

interface Props {
  rules: ReminderRule[];
  onChange: (rules: ReminderRule[]) => void;
  disabled?: boolean;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const priorityLabel = (
  priority: TaskPriority,
  locale: "en" | "es",
  t: {
    low: string;
    medium: string;
    high: string;
    urgent: string;
  },
) => {
  const labels = {
    low: t.low,
    medium: t.medium,
    high: t.high,
    urgent: t.urgent,
  };
  return locale === "es" ? labels[priority] : labels[priority];
};

export function ReminderRulesEditor({ rules, onChange, disabled }: Props) {
  const locale = store.getLocale();
  const t =
    locale === "es"
      ? {
          offset: "Desfase (días)",
          priority: "Prioridad",
          label: "Etiqueta",
          followUp: "Seguimiento",
          none: "No hay recordatorios configurados.",
          hint: "Negativo = antes de la fecha de vencimiento, positivo = después.",
          add: "Agregar recordatorio",
          low: "Baja",
          medium: "Media",
          high: "Alta",
          urgent: "Urgente",
        }
      : {
          offset: "Offset (days)",
          priority: "Priority",
          label: "Label",
          followUp: "Follow up",
          none: "No reminders configured.",
          hint: "Negative = before valid-until, positive = after.",
          add: "Add reminder",
          low: "Low",
          medium: "Medium",
          high: "High",
          urgent: "Urgent",
        };
  const update = (id: string, patch: Partial<ReminderRule>) =>
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(rules.filter((r) => r.id !== id));
  const add = () =>
    onChange([...rules, { id: newId("rr"), offset: 0, priority: "medium", label: t.followUp }]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
        <div className="col-span-2">{t.offset}</div>
        <div className="col-span-3">{t.priority}</div>
        <div className="col-span-6">{t.label}</div>
        <div className="col-span-1" />
      </div>
      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
            <Input
              className="col-span-2"
              type="number"
              step="1"
              value={r.offset}
              disabled={disabled}
              onChange={(e) => update(r.id, { offset: Number(e.target.value) })}
            />
            <div className="col-span-3">
              <Select
                value={r.priority}
                onValueChange={(v) => update(r.id, { priority: v as TaskPriority })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityLabel(p, locale as "en" | "es", t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              className="col-span-6"
              value={r.label}
              disabled={disabled}
              onChange={(e) => update(r.id, { label: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1 text-destructive"
              onClick={() => remove(r.id)}
              disabled={disabled}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-3 border rounded-md">
            {t.none}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">{t.hint}</p>
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={disabled}>
          <Plus className="size-4" /> {t.add}
        </Button>
      </div>
    </div>
  );
}
