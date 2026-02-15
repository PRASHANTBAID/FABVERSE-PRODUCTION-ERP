import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "status-completed";
    case "in progress":
      return "status-in-progress";
    case "delayed":
      return "status-delayed";
    default:
      return "status-pending";
  }
}

export function getStageClass(stage) {
  switch (stage?.toLowerCase()) {
    case "cutting":
      return "stage-cutting";
    case "stitching":
      return "stage-stitching";
    case "bartack":
      return "stage-bartack";
    case "washing/dyeing":
    case "washing":
      return "stage-washing";
    case "completed":
      return "stage-completed";
    default:
      return "stage-cutting";
  }
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function isDateInPast(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  return date < today;
}
