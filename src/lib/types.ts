// Hand-written row types mirroring supabase/migrations/0001_initial_schema.sql.
// (Can be replaced later with `supabase gen types`.)

export type UUID = string;

export interface Category {
  id: UUID;
  household_id: UUID;
  name: string;
  icon: string | null;
  color: string | null;
  default_position: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Market {
  id: UUID;
  household_id: UUID;
  name: string;
  address: string | null;
  is_default: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface MarketCategoryOrder {
  market_id: UUID;
  category_id: UUID;
  position: number;
}

export interface Item {
  id: UUID;
  household_id: UUID;
  name: string;
  quantity: number | null;
  unit: string | null;
  category_id: UUID | null;
  notes: string | null;
  status: 'pending' | 'checked';
  created_by: UUID | null;
  created_at: string;
  checked_by: UUID | null;
  checked_at: string | null;
  trip_id: UUID | null;
  added_via: 'text' | 'voice';
  updated_at: string;
}
