import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReminderRulesEditor } from "@/components/ReminderRulesEditor";
import { store, useStoreVersion } from "@/lib/store";
import { DEFAULT_REMINDER_PLAN } from "@/lib/quote-utils";
import type { ReminderRule } from "@/lib/types";

export const Route = createFileRoute("/_app/quotes/reminders")({
  component: ReminderSettings,
});

function ReminderSettings() {
  useStoreVersion();
  const locale = store.getLocale();
  const [rules, setRules] = React.useState<ReminderRule[]>(() => store.reminderRules());
  const quotes = store.quotes();
  const reminders = store
    .notifications()
    .filter((notification) => notification.type === "reminder");
  const overriddenQuotes = quotes.filter((quote) => quote.reminderRules?.length).length;
  const activeQuotes = store
    .quotes()
    .filter(
      (quote) =>
        quote.status === "draft" || quote.status === "sent" || quote.status === "negotiation",
    ).length;
  const defaultPlanSize = rules.length;
  const reminderDepth = Math.max(0, ...rules.map((rule) => Math.abs(rule.offset)));
  const t =
    locale === "es"
      ? {
          back: "Volver",
          title: "Valores predeterminados de recordatorios",
          subtitle:
            "Estas reglas se aplican a cada cotización, salvo que se sobrescriban en la cotización misma.",
          activeQuotes: "Cotizaciones activas",
          activeQuotesDesc: "Cotizaciones que aún pueden generar recordatorios.",
          reminderNotifications: "Notificaciones de recordatorio",
          reminderNotificationsDesc: "Alertas de recordatorio ya generadas.",
          overrideMode: "Modo de sobrescritura",
          perQuote: "Por cotización",
          perQuoteDesc: "Las cotizaciones pueden definir su propio plan de recordatorios.",
          policySummary: "Resumen de política",
          policyBody:
            "Los valores globales son la base. Las sobrescrituras por cotización tienen prioridad y el motor de alertas usa ambos para generar seguimientos.",
          openNotifications: "Abrir notificaciones",
          defaultPlanSize: "Tamaño del plan predeterminado",
          defaultPlanSizeDesc: "Recordatorios base aplicados a cotizaciones sin sobrescritura.",
          overridesInUse: "Sobrescrituras en uso",
          overridesInUseDesc:
            "Estas cotizaciones reemplazan el plan global con sus propias reglas.",
          reminderHorizon: "Horizonte de recordatorios",
          reminderHorizonDesc: "Desfase máximo en días del plan predeterminado actual.",
          globalReminderRules: "Reglas globales de recordatorio",
          globalReminderRulesDesc:
            "Piensa en esto como la política de alertas predeterminada. Alimenta el motor de recordatorios para cualquier cotización que no tenga su propio plan.",
          baseline:
            "Los valores predeterminados son la base. Las reglas por cotización tienen prioridad cuando existen, y el sistema usa este plan para programar seguimientos, notificaciones y alertas de vencimiento.",
          reset: "Restablecer a valores predeterminados",
          save: "Guardar",
          reminderDefaultsSaved: "Valores predeterminados de recordatorios guardados.",
          resetToDefaults: "Restablecido a los recordatorios predeterminados.",
        }
      : {
          back: "Back",
          title: "Reminder defaults",
          subtitle: "These rules apply to every quote unless overridden on the quote itself.",
          activeQuotes: "Active quotes",
          activeQuotesDesc: "Quotes still eligible for reminders.",
          reminderNotifications: "Reminder notifications",
          reminderNotificationsDesc: "Reminder alerts already generated.",
          overrideMode: "Override mode",
          perQuote: "Per quote",
          perQuoteDesc: "Quotes can define their own reminder plan.",
          policySummary: "Policy summary",
          policyBody:
            "Global defaults are the fallback. Quote overrides take priority, and the alert engine uses both to generate follow-ups.",
          openNotifications: "Open notifications",
          defaultPlanSize: "Default plan size",
          defaultPlanSizeDesc: "Baseline reminders applied to quotes without overrides.",
          overridesInUse: "Overrides in use",
          overridesInUseDesc: "These quotes replace the global plan with their own rules.",
          reminderHorizon: "Reminder horizon",
          reminderHorizonDesc: "Farthest reminder offset in the current default plan.",
          globalReminderRules: "Global reminder rules",
          globalReminderRulesDesc:
            "Think of this as the default alert policy. It fills the reminder engine for any quote that does not have its own override plan.",
          baseline:
            "Defaults are the baseline. Quote-level reminder rules take priority when present, and the system uses this plan to schedule follow-ups, reminder notifications, and overdue alerts.",
          reset: "Reset to defaults",
          save: "Save",
          reminderDefaultsSaved: "Reminder defaults saved.",
          resetToDefaults: "Reset to default reminders.",
        };

  const save = () => {
    store.setReminderRules(rules);
    toast.success(t.reminderDefaultsSaved);
  };
  const reset = () => {
    setRules(DEFAULT_REMINDER_PLAN);
    store.resetReminderRules();
    toast.success(t.resetToDefaults);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/quotes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.activeQuotes}
          </div>
          <div className="mt-1 text-2xl font-semibold">{activeQuotes}</div>
          <div className="text-sm text-muted-foreground">{t.activeQuotesDesc}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.reminderNotifications}
          </div>
          <div className="mt-1 text-2xl font-semibold">{reminders.length}</div>
          <div className="text-sm text-muted-foreground">{t.reminderNotificationsDesc}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.overrideMode}
          </div>
          <div className="mt-1 text-2xl font-semibold">{t.perQuote}</div>
          <div className="text-sm text-muted-foreground">{t.perQuoteDesc}</div>
        </Card>
      </div>

      <Card className="border-sky-100 bg-sky-50/70">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-sky-900/70">{t.policySummary}</div>
            <div className="mt-1 text-sm font-medium text-sky-950">{t.policyBody}</div>
          </div>
          <Link
            to="/notifications"
            className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
          >
            {t.openNotifications}
          </Link>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-slate-50/70">
        <CardContent className="grid gap-4 p-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.defaultPlanSize}
            </div>
            <div className="mt-1 text-xl font-semibold">{defaultPlanSize} rules</div>
            <div className="text-sm text-muted-foreground">{t.defaultPlanSizeDesc}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.overridesInUse}
            </div>
            <div className="mt-1 text-xl font-semibold">{overriddenQuotes} quotes</div>
            <div className="text-sm text-muted-foreground">{t.overridesInUseDesc}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.reminderHorizon}
            </div>
            <div className="mt-1 text-xl font-semibold">{reminderDepth} days</div>
            <div className="text-sm text-muted-foreground">{t.reminderHorizonDesc}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">{t.globalReminderRules}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.globalReminderRulesDesc}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
            {t.baseline}
          </div>
          <ReminderRulesEditor rules={rules} onChange={setRules} />
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" /> {t.reset}
            </Button>
            <Button onClick={save}>
              <Save className="size-4" /> {t.save}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
