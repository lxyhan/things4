export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface RepeatRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  on_completion: boolean;
  weekdays?: number[];
  day_of_month?: number;
  until?: string;
  count?: number;
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  checklist: ChecklistItem[] | null;
  status: "active" | "completed" | "cancelled";
  project_id: string | null;
  area_id: string | null;
  heading_id: string | null;
  when_date: string | null;
  reminder_time: string | null;
  deadline: string | null;
  waiting_for: string | null;
  waiting_since: string | null;
  repeat_rule: RepeatRule | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Project {
  id: string;
  title: string;
  notes: string | null;
  status: "active" | "completed" | "cancelled" | "someday";
  area_id: string | null;
  when_date: string | null;
  deadline: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Area {
  id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Heading {
  id: string;
  title: string;
  project_id: string;
  position: number;
  archived_at: string | null;
}

export interface Tag {
  id: string;
  name: string;
  shortcut: string | null;
  color: string | null;
  position: number;
}
