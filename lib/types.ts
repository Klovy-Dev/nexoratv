export type Role = "client" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  label: string;
  server_url: string;
  username: string;
  password_enc: string;
  expires_at: string | null;
  status: "active" | "suspended";
  note: string;
  created_at: string;
}

/** Abonnement prêt pour l'affichage : mot de passe déchiffré + état calculé. */
export interface SubscriptionView
  extends Omit<Subscription, "password_enc"> {
  password: string;
  expired: boolean;
}

export type FormState = {
  error?: string;
  fieldErrors?: string[];
  ok?: boolean;
};

export interface Review {
  id: number;
  user_id: number;
  rating: number;
  body: string;
  created_at: string;
  name: string;
}

export interface ReviewStats {
  count: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
