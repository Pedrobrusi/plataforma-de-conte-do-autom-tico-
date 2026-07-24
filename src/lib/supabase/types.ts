export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generation_outputs: {
        Row: {
          created_at: string
          generation_run_id: string
          id: string
          is_selected: boolean
          output: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          generation_run_id: string
          id?: string
          is_selected?: boolean
          output: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          generation_run_id?: string
          id?: string
          is_selected?: boolean
          output?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_outputs_generation_run_id_fkey"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_outputs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_runs: {
        Row: {
          completed_at: string | null
          content_item_id: string | null
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          input: Json
          model: string | null
          prompt_key: string
          provider: Database["public"]["Enums"]["ai_provider"]
          started_at: string | null
          status: Database["public"]["Enums"]["ai_run_status"]
          tokens_input: number | null
          tokens_output: number | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          content_item_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          prompt_key: string
          provider?: Database["public"]["Enums"]["ai_provider"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_run_status"]
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          content_item_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          prompt_key?: string
          provider?: Database["public"]["Enums"]["ai_provider"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_run_status"]
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_runs_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_catalog: {
        Row: {
          created_at: string
          external_id: string | null
          gender: string | null
          id: string
          is_active: boolean
          name: string
          provider: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider?: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          forbidden_words: string[]
          id: string
          logo_url: string | null
          preferred_words: string[]
          primary_color: string | null
          references_urls: string[]
          secondary_color: string | null
          social_links: Json
          tone_of_voice: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          forbidden_words?: string[]
          id?: string
          logo_url?: string | null
          preferred_words?: string[]
          primary_color?: string | null
          references_urls?: string[]
          secondary_color?: string | null
          social_links?: Json
          tone_of_voice?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          forbidden_words?: string[]
          id?: string
          logo_url?: string | null
          preferred_words?: string[]
          primary_color?: string | null
          references_urls?: string[]
          secondary_color?: string | null
          social_links?: Json
          tone_of_voice?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          calendar_id: string
          content_item_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          ends_at: string | null
          id: string
          platform: Database["public"]["Enums"]["social_platform"] | null
          starts_at: string
          status: Database["public"]["Enums"]["calendar_event_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          all_day?: boolean
          calendar_id: string
          content_item_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          starts_at: string
          status?: Database["public"]["Enums"]["calendar_event_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          all_day?: boolean
          calendar_id?: string
          content_item_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          starts_at?: string
          status?: Database["public"]["Enums"]["calendar_event_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendars: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          timezone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          timezone?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          timezone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendars_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_slides: {
        Row: {
          background: string | null
          body: string | null
          content_item_id: string
          created_at: string
          font: string | null
          id: string
          image_url: string | null
          position: number
          template: string | null
          text_color: string | null
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          background?: string | null
          body?: string | null
          content_item_id: string
          created_at?: string
          font?: string | null
          id?: string
          image_url?: string | null
          position?: number
          template?: string | null
          text_color?: string | null
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          background?: string | null
          body?: string | null
          content_item_id?: string
          created_at?: string
          font?: string | null
          id?: string
          image_url?: string | null
          position?: number
          template?: string | null
          text_color?: string | null
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carousel_slides_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_slides_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          block_type: string
          content_item_id: string
          created_at: string
          data: Json
          id: string
          position: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          block_type: string
          content_item_id: string
          created_at?: string
          data?: Json
          id?: string
          position?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          block_type?: string
          content_item_id?: string
          created_at?: string
          data?: Json
          id?: string
          position?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_item_tags: {
        Row: {
          content_item_id: string
          tag_id: string
        }
        Insert: {
          content_item_id: string
          tag_id: string
        }
        Update: {
          content_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_item_tags_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          deleted_at: string | null
          folder_id: string | null
          id: string
          is_favorite: boolean
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_versions: {
        Row: {
          content_item_id: string
          created_at: string
          created_by: string | null
          data: Json
          id: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          version_number: number
          workspace_id: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_briefs: {
        Row: {
          campaign_id: string | null
          created_at: string
          created_by: string | null
          data: Json
          deleted_at: string | null
          id: string
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_briefs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          reason: string
          related_job_id: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          wallet_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason: string
          related_job_id?: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          wallet_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string
          related_job_id?: string | null
          type?: Database["public"]["Enums"]["credit_transaction_type"]
          wallet_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "credit_wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          balance: number
          id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_wallets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          kind: Database["public"]["Enums"]["folder_kind"]
          name: string
          parent_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["folder_kind"]
          name: string
          parent_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["folder_kind"]
          name?: string
          parent_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          folder_id: string | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string | null
          public_url: string | null
          size_bytes: number | null
          storage_path: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          public_url?: string | null
          size_bytes?: number | null
          storage_path: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          public_url?: string | null
          size_bytes?: number | null
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_profile_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          niche_profile_id: string
          snapshot: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          niche_profile_id: string
          snapshot: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          niche_profile_id?: string
          snapshot?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_profile_versions_niche_profile_id_fkey"
            columns: ["niche_profile_id"]
            isOneToOne: false
            referencedRelation: "niche_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niche_profile_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_profiles: {
        Row: {
          audience_desires: string | null
          audience_pains: string | null
          created_at: string
          created_by: string | null
          creator_references: string | null
          differentiators: string | null
          id: string
          main_goal: string | null
          niche: string | null
          objections: string | null
          products_or_services: string | null
          proof_and_authority: string | null
          publish_frequency: string | null
          social_links: Json
          target_audience: string | null
          tone_of_voice: string | null
          topics_to_avoid: string | null
          topics_to_cover: string | null
          updated_at: string
          version: number
          website_url: string | null
          what_i_do: string | null
          workspace_id: string
        }
        Insert: {
          audience_desires?: string | null
          audience_pains?: string | null
          created_at?: string
          created_by?: string | null
          creator_references?: string | null
          differentiators?: string | null
          id?: string
          main_goal?: string | null
          niche?: string | null
          objections?: string | null
          products_or_services?: string | null
          proof_and_authority?: string | null
          publish_frequency?: string | null
          social_links?: Json
          target_audience?: string | null
          tone_of_voice?: string | null
          topics_to_avoid?: string | null
          topics_to_cover?: string | null
          updated_at?: string
          version?: number
          website_url?: string | null
          what_i_do?: string | null
          workspace_id: string
        }
        Update: {
          audience_desires?: string | null
          audience_pains?: string | null
          created_at?: string
          created_by?: string | null
          creator_references?: string | null
          differentiators?: string | null
          id?: string
          main_goal?: string | null
          niche?: string | null
          objections?: string | null
          products_or_services?: string | null
          proof_and_authority?: string | null
          publish_frequency?: string | null
          social_links?: Json
          target_audience?: string | null
          tone_of_voice?: string | null
          topics_to_avoid?: string | null
          topics_to_cover?: string | null
          updated_at?: string
          version?: number
          website_url?: string | null
          what_i_do?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_attempts: {
        Row: {
          attempt_number: number
          error: string | null
          finished_at: string | null
          id: string
          publish_job_id: string
          response: Json | null
          started_at: string
          status: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Insert: {
          attempt_number: number
          error?: string | null
          finished_at?: string | null
          id?: string
          publish_job_id: string
          response?: Json | null
          started_at?: string
          status: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Update: {
          attempt_number?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          publish_job_id?: string
          response?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_attempts_publish_job_id_fkey"
            columns: ["publish_job_id"]
            isOneToOne: false
            referencedRelation: "publish_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_attempts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_jobs: {
        Row: {
          attempts: number
          content_item_id: string
          created_at: string
          created_by: string | null
          id: string
          last_error: string | null
          payload: Json
          result: Json | null
          scheduled_at: string | null
          social_connection_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          content_item_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          result?: Json | null
          scheduled_at?: string | null
          social_connection_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          content_item_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          result?: Json | null
          scheduled_at?: string | null
          social_connection_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_jobs_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_jobs_social_connection_id_fkey"
            columns: ["social_connection_id"]
            isOneToOne: false
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      render_jobs: {
        Row: {
          avatar_id: string | null
          content_item_id: string | null
          created_at: string
          created_by: string | null
          credits_charged: number
          error: string | null
          id: string
          payload: Json
          progress: number
          provider: string
          result_url: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          voice_id: string | null
          workspace_id: string
        }
        Insert: {
          avatar_id?: string | null
          content_item_id?: string | null
          created_at?: string
          created_by?: string | null
          credits_charged?: number
          error?: string | null
          id?: string
          payload?: Json
          progress?: number
          provider?: string
          result_url?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          voice_id?: string | null
          workspace_id: string
        }
        Update: {
          avatar_id?: string | null
          content_item_id?: string | null
          created_at?: string
          created_by?: string | null
          credits_charged?: number
          error?: string | null
          id?: string
          payload?: Json
          progress?: number
          provider?: string
          result_url?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          voice_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatar_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voice_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          external_id: string
          id: string
          is_selected: boolean
          kind: string | null
          name: string | null
          social_connection_id: string
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          external_id: string
          id?: string
          is_selected?: boolean
          kind?: string | null
          name?: string | null
          social_connection_id: string
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          external_id?: string
          id?: string
          is_selected?: boolean
          kind?: string | null
          name?: string | null
          social_connection_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_social_connection_id_fkey"
            columns: ["social_connection_id"]
            isOneToOne: false
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token_encrypted: string | null
          connected_by: string | null
          created_at: string
          display_name: string | null
          expires_at: string | null
          external_account_id: string | null
          id: string
          is_mock: boolean
          last_error: string | null
          last_synced_at: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token_encrypted: string | null
          scopes: string[]
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          connected_by?: string | null
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          is_mock?: boolean
          last_error?: string | null
          last_synced_at?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token_encrypted?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          connected_by?: string | null
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          is_mock?: boolean
          last_error?: string | null
          last_synced_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          refresh_token_encrypted?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_imports: {
        Row: {
          created_at: string
          created_by: string | null
          error: string | null
          extracted_text: string | null
          id: string
          media_asset_id: string | null
          raw_text: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          status: Database["public"]["Enums"]["import_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          extracted_text?: string | null
          id?: string
          media_asset_id?: string | null
          raw_text?: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          extracted_text?: string | null
          id?: string
          media_asset_id?: string | null
          raw_text?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_imports_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_imports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          external_subscription_id: string | null
          id: string
          plan: string
          provider: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          external_subscription_id?: string | null
          id?: string
          plan?: string
          provider?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          external_subscription_id?: string | null
          id?: string
          plan?: string
          provider?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_system: boolean
          kind: string
          name: string
          thumbnail_url: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          kind: string
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          kind?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active_workspace_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed_at: string | null
          updated_at: string
        }
        Insert: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_active_workspace_id_fkey"
            columns: ["active_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_catalog: {
        Row: {
          accent: string | null
          created_at: string
          external_id: string | null
          gender: string | null
          id: string
          is_active: boolean
          language: string
          name: string
          provider: string
          sample_url: string | null
        }
        Insert: {
          accent?: string | null
          created_at?: string
          external_id?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          language?: string
          name: string
          provider?: string
          sample_url?: string | null
        }
        Update: {
          accent?: string | null
          created_at?: string
          external_id?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          language?: string
          name?: string
          provider?: string
          sample_url?: string | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          invite_token: string | null
          invited_by: string | null
          invited_email: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["workspace_member_status"]
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_token?: string | null
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_member_status"]
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_token?: string | null
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_member_status"]
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_provider: "openai" | "anthropic" | "google" | "mock"
      ai_run_status: "queued" | "processing" | "completed" | "failed"
      calendar_event_status:
        | "draft"
        | "ready"
        | "scheduled"
        | "published"
        | "failed"
      connection_status: "disconnected" | "connected" | "expired" | "error"
      content_status:
        | "draft"
        | "ready"
        | "scheduled"
        | "published"
        | "failed"
        | "archived"
      content_type:
        | "twitter_post"
        | "quote_card"
        | "youtube_post"
        | "gpt_post"
        | "google_post"
        | "carousel_ai"
        | "carousel_twitter"
        | "carousel_personal"
        | "carousel_dark"
        | "reel"
        | "reel_script"
        | "bio"
        | "creative_brief"
      credit_transaction_type: "credit" | "debit" | "refund"
      folder_kind: "content" | "media" | "template" | "brief" | "general"
      import_status: "queued" | "processing" | "completed" | "failed"
      job_status: "queued" | "processing" | "completed" | "failed" | "cancelled"
      media_kind: "image" | "video" | "audio" | "pdf" | "other"
      notification_type: "info" | "success" | "warning" | "error"
      social_platform:
        | "instagram"
        | "facebook"
        | "twitter"
        | "youtube"
        | "google_business"
        | "tiktok"
      source_type:
        | "youtube_url"
        | "instagram_url"
        | "tiktok_url"
        | "article_url"
        | "pdf"
        | "audio"
        | "video"
        | "text_file"
        | "manual_text"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
      workspace_member_status: "invited" | "active" | "removed"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_provider: ["openai", "anthropic", "google", "mock"],
      ai_run_status: ["queued", "processing", "completed", "failed"],
      calendar_event_status: [
        "draft",
        "ready",
        "scheduled",
        "published",
        "failed",
      ],
      connection_status: ["disconnected", "connected", "expired", "error"],
      content_status: [
        "draft",
        "ready",
        "scheduled",
        "published",
        "failed",
        "archived",
      ],
      content_type: [
        "twitter_post",
        "quote_card",
        "youtube_post",
        "gpt_post",
        "google_post",
        "carousel_ai",
        "carousel_twitter",
        "carousel_personal",
        "carousel_dark",
        "reel",
        "reel_script",
        "bio",
        "creative_brief",
      ],
      credit_transaction_type: ["credit", "debit", "refund"],
      folder_kind: ["content", "media", "template", "brief", "general"],
      import_status: ["queued", "processing", "completed", "failed"],
      job_status: ["queued", "processing", "completed", "failed", "cancelled"],
      media_kind: ["image", "video", "audio", "pdf", "other"],
      notification_type: ["info", "success", "warning", "error"],
      social_platform: [
        "instagram",
        "facebook",
        "twitter",
        "youtube",
        "google_business",
        "tiktok",
      ],
      source_type: [
        "youtube_url",
        "instagram_url",
        "tiktok_url",
        "article_url",
        "pdf",
        "audio",
        "video",
        "text_file",
        "manual_text",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
      ],
      workspace_member_status: ["invited", "active", "removed"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
