// ==============================================================================
// GYM CRM SaaS - Database Types (auto-generated from schema v3.0)
// Multi-tenant types matching the Supabase schema.
// ==============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface Gym {
  id: string
  name: string
  slug: string
  owner_id: string | null
  logo_url: string | null
  address: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  timezone: string
  currency: string
  plan: 'free' | 'pro' | 'enterprise'
  max_members: number
  is_active: boolean
  settings: Json
  created_at: string
  updated_at: string
}

export type ProfileRole = 'owner' | 'admin' | 'trainer' | 'member'
export type SubscriptionStatus = 'active' | 'inactive' | 'suspended' | 'trial'

export interface Profile {
  id: string
  gym_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  dni: string | null
  role: ProfileRole
  level: number
  xp: number
  rank_name: string
  qr_code_token: string | null
  subscription_status: SubscriptionStatus
  emergency_contact: string | null
  birth_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Trainer {
  id: string
  gym_id: string
  user_id: string
  specialty: string | null
  bio: string | null
  certifications: Json
  hourly_rate: number | null
  commission_rate: number
  max_clients: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Membership & Subscriptions ──────────────────────────────────────────────

export interface Membership {
  id: string
  gym_id: string
  name: string
  description: string | null
  duration_days: number
  price: number
  currency: string
  features: Json
  max_freezes: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type SubscriptionPlanStatus = 'active' | 'paused' | 'cancelled' | 'expired'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'stripe' | 'paypal'

export interface Subscription {
  id: string
  gym_id: string
  user_id: string
  membership_id: string | null
  start_date: string
  end_date: string
  status: SubscriptionPlanStatus
  payment_method: PaymentMethod | null
  auto_renew: boolean
  base_price: number | null
  discount_pct: number
  final_price: number | null
  freeze_start: string | null
  freeze_end: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export type Recurrence = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface GymClass {
  id: string
  gym_id: string
  trainer_id: string | null
  title: string
  description: string | null
  category: string | null
  day_of_week: number | null
  start_time: string
  end_time: string
  capacity: number
  enrolled: number
  room: string | null
  image_url: string | null
  is_active: boolean
  recurrence: Recurrence
  created_at: string
  updated_at: string
}

export type EnrollmentStatus = 'enrolled' | 'attended' | 'cancelled' | 'no_show'

export interface ClassEnrollment {
  id: string
  gym_id: string
  class_id: string
  user_id: string
  status: EnrollmentStatus
  enrolled_at: string
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Payment {
  id: string
  gym_id: string
  member_id: string | null
  subscription_id: string | null
  amount: number
  plan_name: string | null
  payment_method: PaymentMethod | null
  status: PaymentStatus
  reference_code: string | null
  notes: string | null
  created_at: string
}

// ─── Check-ins ───────────────────────────────────────────────────────────────

export type CheckinMethod = 'qr' | 'manual' | 'nfc' | 'biometric'

export interface Checkin {
  id: string
  gym_id: string
  user_id: string
  checked_in_at: string
  checked_out_at: string | null
  method: CheckinMethod
}

// ─── Training ────────────────────────────────────────────────────────────────

export type Difficulty = 'principiante' | 'intermedio' | 'avanzado'

export interface Routine {
  id: string
  gym_id: string
  trainer_id: string | null
  assigned_to: string | null
  name: string
  description: string | null
  difficulty: Difficulty
  duration_min: number
  exercise_count: number
  image_url: string | null
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  gym_id: string
  name: string
  muscle_group: string | null
  video_url: string | null
  description: string | null
  created_at: string
}

export interface RoutineExercise {
  id: string
  gym_id: string
  routine_id: string
  exercise_id: string
  order_index: number
  sets: number
  reps: string
  rest_seconds: number
  notes: string | null
  created_at: string
}

export interface WorkoutLog {
  id: string
  gym_id: string
  user_id: string
  routine_id: string | null
  exercise_id: string | null
  set_number: number | null
  weight: number | null
  reps: number | null
  duration_sec: number | null
  notes: string | null
  completed_at: string
}

// ─── Social / Communication ──────────────────────────────────────────────────

export type AssignmentStatus = 'active' | 'paused' | 'completed'

export interface TrainerAssignment {
  id: string
  gym_id: string
  trainer_id: string
  client_id: string
  status: AssignmentStatus
  assigned_at: string
}

export interface Message {
  id: string
  gym_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface MembershipRequest {
  id: string
  gym_id: string
  full_name: string
  email: string
  phone: string | null
  goal: string | null
  status: RequestStatus
  reviewed_by: string | null
  created_at: string
}

// ─── JWT App Metadata ────────────────────────────────────────────────────────

export interface GymAppMetadata {
  gym_id: string
  role?: ProfileRole
}

// ─── Database Type Map (for Supabase client) ─────────────────────────────────

export interface Database {
  public: {
    Tables: {
      gyms: { Row: Gym; Insert: Partial<Gym> & Pick<Gym, 'name' | 'slug'>; Update: Partial<Gym> }
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, 'id' | 'gym_id'>; Update: Partial<Profile> }
      trainers: { Row: Trainer; Insert: Partial<Trainer> & Pick<Trainer, 'gym_id' | 'user_id'>; Update: Partial<Trainer> }
      memberships: { Row: Membership; Insert: Partial<Membership> & Pick<Membership, 'gym_id' | 'name' | 'price'>; Update: Partial<Membership> }
      subscriptions: { Row: Subscription; Insert: Partial<Subscription> & Pick<Subscription, 'gym_id' | 'user_id' | 'end_date'>; Update: Partial<Subscription> }
      classes: { Row: GymClass; Insert: Partial<GymClass> & Pick<GymClass, 'gym_id' | 'title' | 'start_time' | 'end_time'>; Update: Partial<GymClass> }
      class_enrollments: { Row: ClassEnrollment; Insert: Partial<ClassEnrollment> & Pick<ClassEnrollment, 'gym_id' | 'class_id' | 'user_id'>; Update: Partial<ClassEnrollment> }
      payments: { Row: Payment; Insert: Partial<Payment> & Pick<Payment, 'gym_id' | 'amount'>; Update: Partial<Payment> }
      checkins: { Row: Checkin; Insert: Partial<Checkin> & Pick<Checkin, 'gym_id' | 'user_id'>; Update: Partial<Checkin> }
      routines: { Row: Routine; Insert: Partial<Routine> & Pick<Routine, 'gym_id' | 'name'>; Update: Partial<Routine> }
      exercises: { Row: Exercise; Insert: Partial<Exercise> & Pick<Exercise, 'gym_id' | 'name'>; Update: Partial<Exercise> }
      routine_exercises: { Row: RoutineExercise; Insert: Partial<RoutineExercise> & Pick<RoutineExercise, 'gym_id' | 'routine_id' | 'exercise_id'>; Update: Partial<RoutineExercise> }
      workout_logs: { Row: WorkoutLog; Insert: Partial<WorkoutLog> & Pick<WorkoutLog, 'gym_id' | 'user_id'>; Update: Partial<WorkoutLog> }
      trainer_assignments: { Row: TrainerAssignment; Insert: Partial<TrainerAssignment> & Pick<TrainerAssignment, 'gym_id' | 'trainer_id' | 'client_id'>; Update: Partial<TrainerAssignment> }
      messages: { Row: Message; Insert: Partial<Message> & Pick<Message, 'gym_id' | 'sender_id' | 'receiver_id' | 'content'>; Update: Partial<Message> }
      membership_requests: { Row: MembershipRequest; Insert: Partial<MembershipRequest> & Pick<MembershipRequest, 'gym_id' | 'full_name' | 'email'>; Update: Partial<MembershipRequest> }
    }
  }
}
