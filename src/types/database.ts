export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          onboarding_completed: boolean
          premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          onboarding_completed?: boolean
          premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          onboarding_completed?: boolean
          premium?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      resolves: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          target_outcome: string
          deadline: string
          category: string
          status: 'active' | 'completed' | 'archived'
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          target_outcome: string
          deadline: string
          category: string
          status?: 'active' | 'completed' | 'archived'
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          target_outcome?: string
          deadline?: string
          category?: string
          status?: 'active' | 'completed' | 'archived'
          progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          resolve_id: string
          user_id: string
          name: string
          due_date: string
          notes: string | null
          importance: number
          completed: boolean
          completed_at: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resolve_id: string
          user_id: string
          name: string
          due_date: string
          notes?: string | null
          importance?: number
          completed?: boolean
          completed_at?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resolve_id?: string
          user_id?: string
          name?: string
          due_date?: string
          notes?: string | null
          importance?: number
          completed?: boolean
          completed_at?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          resolve_id: string
          user_id: string
          frequency: 'daily' | 'weekly' | 'custom'
          time: string
          days: string[] | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resolve_id: string
          user_id: string
          frequency: 'daily' | 'weekly' | 'custom'
          time: string
          days?: string[] | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resolve_id?: string
          user_id?: string
          frequency?: 'daily' | 'weekly' | 'custom'
          time?: string
          days?: string[] | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          description: string
          icon: string
          earned_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          description: string
          icon: string
          earned_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          description?: string
          icon?: string
          earned_at?: string
          metadata?: Json | null
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          resolve_id: string | null
          milestone_id: string | null
          action_type: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resolve_id?: string | null
          milestone_id?: string | null
          action_type: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resolve_id?: string | null
          milestone_id?: string | null
          action_type?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'password_changed' | 'pakt_created' | 'milestone_achieved' | 'milestone_missed' | 'milestone_upcoming' | 'pakt_completed' | 'achievement' | 'reminder' | 'streak_milestone' | 'welcome'
          title: string
          message: string
          read: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'password_changed' | 'pakt_created' | 'milestone_achieved' | 'milestone_missed' | 'milestone_upcoming' | 'pakt_completed' | 'achievement' | 'reminder' | 'streak_milestone' | 'welcome'
          title: string
          message: string
          read?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'password_changed' | 'pakt_created' | 'milestone_achieved' | 'milestone_missed' | 'milestone_upcoming' | 'pakt_completed' | 'achievement' | 'reminder' | 'streak_milestone' | 'welcome'
          title?: string
          message?: string
          read?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

