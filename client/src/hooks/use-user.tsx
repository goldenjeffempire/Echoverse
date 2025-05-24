// client/src/hooks/use-user.ts
import { createContext, useContext } from "react";

export interface User {
  id: string;
  username: string;
  fullName?: string;
  dob?: string;
  role?: string;
  [key: string]: any;
}

export const UserContext = createContext<User | null>(null);

export function useUser(): User {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used within a UserContext.Provider");
  }
  return user;
}
