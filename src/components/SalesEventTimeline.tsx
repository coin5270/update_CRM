import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store, useStoreVersion } from "@/lib/store";
import type { SalesEvent } from "@/lib/types";
import { SalesEventDialog } from "@/components/SalesEventDialog";

interface Props {
  partnerId?: string;
  taskId?: string;
  title?: string;
}

export function SalesEventTimeline({ partnerId, taskId, title = "Sales timeline" }: Props) {
  useStoreVersion();
  const locale = store.getLocale();
  const events = store.salesEvents();
  const [editingEvent, setEditingEvent] = React.useState<SalesEvent | null>(null);
  const t =
    locale === "es"
      ? {
          title: "Cronología comercial",
          nextContact: "Próximo contacto",
          empty: "Aún no hay eventos comerciales.",
        }
      : {
          title: "Sales timeline",
          nextContact: "Next contact",
          empty: "No sales events yet.",
        };

  const filtered = React.useMemo(
    () =>
      events
        .filter((event) => !partnerId || event.partnerId === partnerId)
        .filter((event) => !taskId || event.taskId === taskId)
        .slice()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id)),
    [events, partnerId, taskId],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title || t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {filtered.length > 0 ? (
          filtered.map((event: SalesEvent) => (
            <div key={event.id} className="rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{event.action}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={event.status === "closed" ? "default" : "secondary"}>
                    {event.kind}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setEditingEvent(event)}>
                    <Pencil className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {event.occurredAt} · {event.actor}
                {event.nextContactDate ? ` · ${t.nextContact} ${event.nextContactDate}` : ""}
              </div>
              {event.note && <div className="mt-2 whitespace-pre-line text-sm">{event.note}</div>}
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">{t.empty}</div>
        )}
      </CardContent>
      <SalesEventDialog
        open={Boolean(editingEvent)}
        onOpenChange={(open) => {
          if (!open) setEditingEvent(null);
        }}
        partnerId={partnerId}
        task={undefined}
        initial={editingEvent}
      />
    </Card>
  );
}
