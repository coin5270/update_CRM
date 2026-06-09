import type { SalesTask, TaskPriority, TaskStatus } from "./types";

export function isToday(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
export function isOverdue(t: SalesTask) {
  if (t.status === "completed" || t.status === "cancelled" || t.status === "on_hold") return false;
  const due = new Date(t.dueDate + "T" + (t.dueTime || "23:59"));
  return due.getTime() < Date.now();
}
export function daysOverdue(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function priorityBadge(p: TaskPriority): { variant: "default" | "secondary" | "destructive" | "outline"; children: string; className?: string } {
  switch (p) {
    case "urgent":
      return { variant: "destructive", children: "Urgent" };
    case "high":
      return { variant: "default", children: "High" };
    case "medium":
      return { variant: "secondary", children: "Medium" };
    default:
      return { variant: "outline", children: "Low" };
  }
}
export function statusBadge(s: TaskStatus): { variant: "default" | "secondary" | "destructive" | "outline"; children: string } {
  switch (s) {
    case "completed":
      return { variant: "secondary", children: "Completed" };
    case "in_progress":
      return { variant: "default", children: "In progress" };
    case "on_hold":
      return { variant: "outline", children: "On hold" };
    case "cancelled":
      return { variant: "outline", children: "Cancelled" };
    default:
      return { variant: "outline", children: "Pending" };
  }
}
