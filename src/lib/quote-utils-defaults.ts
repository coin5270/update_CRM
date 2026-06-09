import type { ReminderRule } from "./types";

export const DEFAULT_REMINDER_PLAN: ReminderRule[] = [
  { id: "default-7", offset: -7, priority: "medium", label: "Follow up — quote expires in 1 week" },
  { id: "default-1", offset: -1, priority: "high", label: "Final follow up — quote expires tomorrow" },
  { id: "default+1", offset: 1, priority: "urgent", label: "Quote expired — confirm outcome (won/lost)" },
];
