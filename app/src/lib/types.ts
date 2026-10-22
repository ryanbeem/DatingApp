export type Role = 'seeker' | 'worker';

export interface Photo {
  id: number;
  url: string;
  is_main: boolean;
  like_count: number;
  liked_by_me: boolean;
}

export interface Quality {
  id: number;
  name: string;
  category: string;
}

export interface Profile {
  id: number;
  role: Role;
  email?: string;
  first_name: string;
  age: number | null;
  birthdate?: string;
  city: string | null;
  state: string | null;
  bio: string | null;
  job_title: string | null;
  employer: string | null;
  years_experience: number | null;
  is_licensed: boolean;
  employment_status: 'employed' | 'self_employed' | 'between_jobs' | null;
  looking_for: string | null;
  photos: Photo[];
  qualities: Quality[];
  my_swipe?: 'like' | 'pass' | null;
  is_match?: boolean;
}

export interface Card {
  id: number;
  first_name: string;
  age: number | null;
  city: string | null;
  state: string | null;
  job_title: string | null;
  years_experience: number | null;
  is_licensed: boolean;
  main_photo_url: string | null;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface Conversation {
  partner: Card;
  last_message: Message;
  unread: number;
}

export interface Options {
  qualities: Quality[];
  trades: string[];
  employment_statuses: string[];
}
