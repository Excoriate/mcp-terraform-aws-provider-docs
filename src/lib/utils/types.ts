/**
 * Type representing a GitHub Issue (partial, extend as needed)
 */
export interface Issue {
  number: number;
  title: string;
  state: "open" | "closed";
  body?: string;
  user: { login: string };
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  comments: number;
}
