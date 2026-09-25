export interface SessionPayload {
  email: string;
  role: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}
