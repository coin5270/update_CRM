import type {
  AutomationStatus,
  HistoryEventType,
  InteractionChannel,
  InteractionDirection,
  NotificationSeverity,
  OperationStatus,
  TrafficMode,
} from "./types";

export const trafficModeLabels: Record<TrafficMode, string> = {
  air: "Air",
  ocean: "Ocean",
  road: "Road",
  warehouse: "Warehouse",
};

export const operationStatusLabels: Record<OperationStatus, string> = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On hold",
};

export const channelLabels: Record<InteractionChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  call: "Call",
  meeting: "Meeting",
  note: "Note",
};

export const directionLabels: Record<InteractionDirection, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  internal: "Internal",
};

export const historyTypeLabels: Record<HistoryEventType, string> = {
  created: "Created",
  status_change: "Status change",
  quote: "Quote",
  task: "Task",
  operation: "Operation",
  interaction: "Interaction",
  automation: "Automation",
};

export const automationStatusLabels: Record<AutomationStatus, string> = {
  enabled: "Enabled",
  paused: "Paused",
  failed: "Failed",
};

export function statusBadge(status: OperationStatus | AutomationStatus) {
  if (status === "completed" || status === "enabled") return { variant: "default" as const };
  if (status === "cancelled" || status === "failed") return { variant: "destructive" as const };
  if (status === "on_hold" || status === "paused") return { variant: "secondary" as const };
  return { variant: "outline" as const };
}

export function severityBadge(severity: NotificationSeverity) {
  if (severity === "critical") return { variant: "destructive" as const };
  if (severity === "success") return { variant: "default" as const };
  if (severity === "warning") return { variant: "secondary" as const };
  return { variant: "outline" as const };
}
