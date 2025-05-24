export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: "blue" | "purple" | "green" | "rose";
  href: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isThinking?: boolean;
}

export interface Subscription {
  id: string;
  plan: string;
  status: "active" | "canceled" | "past_due";
  renewalDate: Date;
  credits: {
    used: number;
    total: number;
  };
}
