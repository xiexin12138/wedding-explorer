import "@types/amap-js-api";
export interface User {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  data: Record<string, unknown>;
}

export interface AuthResponse {
  user: User | null;
  isLoggedIn: boolean;
}