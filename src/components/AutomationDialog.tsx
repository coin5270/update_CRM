import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { store } from "@/lib/store";
import type { AutomationEvent, AutomationStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: AutomationEvent | null;
}

export function AutomationDialog({ open, onOpenChange, initial }: Props) {
  const locale = store.getLocale();
  const [form, setForm] = React.useState<AutomationEvent | null>(initial);
  const t =
    locale === "es"
      ? {
          saved: "Automatización guardada.",
          edit: "Editar automatización",
          name: "Nombre *",
          trigger: "Disparador *",
          action: "Acción *",
          status: "Estado",
          enabled: "Activa",
          paused: "Pausada",
          failed: "Fallida",
          nextRun: "Próxima ejecución",
          cancel: "Cancelar",
          save: "Guardar automatización",
        }
      : {
          saved: "Automation saved.",
          edit: "Edit automation",
          name: "Name *",
          trigger: "Trigger *",
          action: "Action *",
          status: "Status",
          enabled: "Enabled",
          paused: "Paused",
          failed: "Failed",
          nextRun: "Next run",
          cancel: "Cancel",
          save: "Save automation",
        };

  React.useEffect(() => {
    if (open) setForm(initial ? { ...initial } : null);
  }, [initial, open]);

  const update = <K extends keyof AutomationEvent>(key: K, value: AutomationEvent[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const onSave = () => {
    if (!form || !form.name.trim() || !form.trigger.trim() || !form.action.trim()) return;
    store.upsertAutomation(form);
    toast.success(t.saved);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{t.edit}</DialogTitle>
        </DialogHeader>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t.name}</Label>
              <Input value={form.name} onChange={(event) => update("name", event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t.trigger}</Label>
              <Textarea
                rows={2}
                value={form.trigger}
                onChange={(event) => update("trigger", event.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t.action}</Label>
              <Textarea
                rows={2}
                value={form.action}
                onChange={(event) => update("action", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.status}</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", value as AutomationStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">{t.enabled}</SelectItem>
                  <SelectItem value="paused">{t.paused}</SelectItem>
                  <SelectItem value="failed">{t.failed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.nextRun}</Label>
              <Input
                type="date"
                value={form.nextRunAt ?? ""}
                onChange={(event) => update("nextRunAt", event.target.value || undefined)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={onSave} disabled={!form}>
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
