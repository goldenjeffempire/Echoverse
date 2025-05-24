// client/src/types/user.ts

export type UserRole = "work" | "personal" | "school" | "general" | "admin" | "moderator";

export interface User {
  id: string;
  name: string;
  username?: string; // optional but useful
  email: string;
  avatar?: string; // optional — fallback UI on frontend
  role: UserRole;
  plan?: string; // optional subscription plan info
  // Add other custom user properties here
}
