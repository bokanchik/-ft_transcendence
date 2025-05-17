export interface CreateUserPayloadffffff {
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url?: string | null;
}
