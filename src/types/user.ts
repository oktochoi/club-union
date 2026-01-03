export type UserRole = 'admin' | 'president' | 'member';
export type UserStatus = 'pending' | 'active' | 'rejected' | 'inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  club_name: string | null;
  phone_number: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  club_name: string;
  phone_number: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  club_name?: string;
  phone_number?: string;
  role?: UserRole;
  status?: UserStatus;
}

