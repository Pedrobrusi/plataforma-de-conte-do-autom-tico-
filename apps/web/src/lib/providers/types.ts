export type BillingMode =
  | "subscription_included"
  | "free_allowance"
  | "local_self_hosted"
  | "manual_handoff"
  | "metered_paid_api";

export type ProviderAuthenticationMode =
  | "official_oauth"
  | "official_pkce"
  | "official_device_code"
  | "official_subscription_login"
  | "local_provider"
  | "manual_handoff"
  | "unsupported";

export type ProviderCapability =
  | "text_generation"
  | "image_generation"
  | "video_rendering"
  | "transcription"
  | "ocr"
  | "text_to_speech"
  | "social_publishing";

export interface ProviderConfig {
  id: string;
  name: string;
  capability: ProviderCapability;
  authenticationMode: ProviderAuthenticationMode;
  billingMode: BillingMode;
  officiallySupported: boolean;
  commercialUseAllowed: boolean;
  multiUserUseAllowed: boolean;
  /** null = não aplicável (ex: providers de texto/local) */
  watermarkPolicy: {
    visibleWatermark: boolean;
    providerBranding: boolean;
    cleanExportSupported: boolean;
  } | null;
  monthlyAllowance: number | null;
  /** custo externo esperado em USD por operação — deve ser sempre 0 para providers habilitados */
  expectedExternalCost: number;
  enabled: boolean;
  lastVerifiedAt: string;
}

export interface CostPreflightInput {
  providerId: string;
  operation: string;
  estimatedInput?: number;
  estimatedOutput?: number;
  mediaDurationSeconds?: number;
  imageCount?: number;
}

export interface CostPreflightResult {
  allowed: boolean;
  billingMode: BillingMode | null;
  expectedExternalCost: number | null;
  allowanceRemaining: number | null;
  reason: string;
}
