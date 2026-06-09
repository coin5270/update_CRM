import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { store } from "@/lib/store";
import { toast } from "sonner";
import type { SalesEvent, SalesTask } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: SalesTask | null;
}

export function TaskFollowUpDialog({ open, onOpenChange, task }: Props) {
  const locale = store.getLocale();
  const [note, setNote] = React.useState("");
  const [nextContactDate, setNextContactDate] = React.useState("");
  const t =
    locale === "es"
      ? {
          title: "Actualizar seguimiento",
          nextContact: "Próximo contacto",
          whatDidYouDo: "¿Qué hiciste?",
          placeholder: "Escribe el resultado de la llamada, el correo o la siguiente acción...",
          cancel: "Cancelar",
          close: "Cerrar seguimiento",
          save: "Guardar seguimiento",
        }
      : {
          title: "Update follow-up",
          nextContact: "Next contact date",
          whatDidYouDo: "What did you do?",
          placeholder: "Write the call result, email content, or next action...",
          cancel: "Cancel",
          close: "Close follow-up",
          save: "Save follow-up",
        };

  React.useEffect(() => {
    if (!open || !task) return;
    setNote("");
    setNextContactDate(task.nextContactDate ?? task.dueDate);
  }, [open, task]);

  const writeSalesEvent = (kind: string, action: string, status?: string) => {
    if (!task) return;
    const event: SalesEvent = {
      id: `${kind}-${task.id}-${Date.now()}`,
      partnerId: task.partnerId ?? "",
      taskId: task.id,
      quoteId: task.quoteId,
      contactId: task.contactId,
      kind,
      action,
      note: note || undefined,
      nextContactDate: nextContactDate || undefined,
      status,
      occurredAt: new Date().toISOString().slice(0, 10),
      actor: store.getUser()?.name ?? task.responsibleUser,
    };
    store.upsertSalesEvent(event);
  };

  const save = () => {
    if (!task) return;
    const mergedNote = [task.comment, note].filter(Boolean).join("\n\n");
    store.upsertTask({
      ...task,
      comment: mergedNote || undefined,
      nextContactDate: nextContactDate || undefined,
      dueDate: nextContactDate || task.dueDate,
      status: task.status === "completed" ? "completed" : "in_progress",
    });
    store.upsertHistoryEvent({
      id: `followup-${task.id}-${Date.now()}`,
      partnerId: task.partnerId ?? "",
      type: "interaction",
      title: `Follow-up updated: ${task.subject}`,
      description: note || `Next follow-up set for ${nextContactDate || task.dueDate}.`,
      occurredAt: new Date().toISOString().slice(0, 10),
      actor: store.getUser()?.name ?? task.responsibleUser,
      quoteId: task.quoteId,
      taskId: task.id,
    });
    writeSalesEvent(
      "follow_up",
      note || `Next follow-up set for ${nextContactDate || task.dueDate}.`,
      "open",
    );
    toast.success(locale === "es" ? "Seguimiento guardado." : "Follow-up saved.");
    onOpenChange(false);
  };

  const closeTask = () => {
    if (!task) return;
    const mergedNote = [task.comment, note].filter(Boolean).join("\n\n");
    store.upsertTask({
      ...task,
      comment: mergedNote || undefined,
      nextContactDate: nextContactDate || undefined,
      dueDate: nextContactDate || task.dueDate,
      status: "completed",
    });
    store.upsertHistoryEvent({
      id: `followup-close-${task.id}-${Date.now()}`,
      partnerId: task.partnerId ?? "",
      type: "task",
      title: `Task closed: ${task.subject}`,
      description: note || "Task was closed from the follow-up report.",
      occurredAt: new Date().toISOString().slice(0, 10),
      actor: store.getUser()?.name ?? task.responsibleUser,
      quoteId: task.quoteId,
      taskId: task.id,
    });
    writeSalesEvent("closure", note || "Task was closed from the follow-up report.", "closed");
    toast.success(locale === "es" ? "Seguimiento cerrado." : "Task closed.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t.nextContact}</Label>
            <Input
              type="date"
              value={nextContactDate}
              onChange={(event) => setNextContactDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.whatDidYouDo}</Label>
            <Textarea
              rows={5}
              placeholder={t.placeholder}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button variant="secondary" onClick={closeTask} disabled={!task}>
            {t.close}
          </Button>
          <Button onClick={save} disabled={!task}>
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
