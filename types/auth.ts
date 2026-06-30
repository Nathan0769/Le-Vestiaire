export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt?: string | Date;
};

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, returnTo?: string) => Promise<void>;
  signUp: (email: string, password: string, returnTo?: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
}
