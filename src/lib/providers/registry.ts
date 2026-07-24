import type { ProviderConfig, CostPreflightInput, CostPreflightResult } from "@/lib/providers/types";
import { AI_COST_POLICY, isBillingModeAllowed } from "@/lib/providers/policy";

/**
 * Registro central de providers. Providers de IA cobrados por token/imagem/vídeo
 * (OpenAI, Anthropic, Google AI Studio pay-as-you-go, Replicate, etc.) NUNCA são
 * cadastrados aqui como enabled — mesmo que existam credenciais no .env.
 * Ver seção "POLÍTICA ABSOLUTA DE CUSTO EXTERNO ZERO" em IMPLEMENTATION_STATUS.md.
 */
export const PROVIDER_REGISTRY: ProviderConfig[] = [
  {
    id: "local-template-text",
    name: "Gerador local de texto (baseado em template + perfil de nicho)",
    capability: "text_generation",
    authenticationMode: "local_provider",
    billingMode: "local_self_hosted",
    officiallySupported: true,
    commercialUseAllowed: true,
    multiUserUseAllowed: true,
    watermarkPolicy: null,
    monthlyAllowance: null,
    expectedExternalCost: 0,
    enabled: true,
    lastVerifiedAt: "2026-07-24",
  },
  {
    id: "local-og-image",
    name: "Renderização local de imagem (next/og · Satori, sem custo por imagem)",
    capability: "image_generation",
    authenticationMode: "local_provider",
    billingMode: "local_self_hosted",
    officiallySupported: true,
    commercialUseAllowed: true,
    multiUserUseAllowed: true,
    watermarkPolicy: {
      visibleWatermark: false,
      providerBranding: false,
      cleanExportSupported: true,
    },
    monthlyAllowance: null,
    expectedExternalCost: 0,
    enabled: true,
    lastVerifiedAt: "2026-07-24",
  },
  {
    id: "local-ffmpeg-render",
    name: "Renderização local de vídeo (FFmpeg, sem custo por segundo)",
    capability: "video_rendering",
    authenticationMode: "local_provider",
    billingMode: "local_self_hosted",
    officiallySupported: true,
    commercialUseAllowed: true,
    multiUserUseAllowed: true,
    watermarkPolicy: {
      visibleWatermark: false,
      providerBranding: false,
      cleanExportSupported: true,
    },
    monthlyAllowance: null,
    expectedExternalCost: 0,
    enabled: true,
    lastVerifiedAt: "2026-07-24",
  },
  {
    id: "local-ocr-tesseract-wasm",
    name: "OCR local (tesseract.js, WASM, sem custo por imagem)",
    capability: "ocr",
    authenticationMode: "local_provider",
    billingMode: "local_self_hosted",
    officiallySupported: true,
    commercialUseAllowed: true,
    multiUserUseAllowed: true,
    watermarkPolicy: null,
    monthlyAllowance: null,
    expectedExternalCost: 0,
    enabled: true,
    lastVerifiedAt: "2026-07-24",
  },
  {
    id: "openai-gpt",
    name: "OpenAI (API paga por token)",
    capability: "text_generation",
    authenticationMode: "unsupported",
    billingMode: "metered_paid_api",
    officiallySupported: true,
    commercialUseAllowed: true,
    multiUserUseAllowed: false,
    watermarkPolicy: null,
    monthlyAllowance: null,
    expectedExternalCost: -1,
    enabled: false,
    lastVerifiedAt: "2026-07-24",
  },
  {
    id: "anthropic-claude",
    name: "Anthropic (API paga por token)",
    capability: "text_generation",
    authenticationMode: "unsupported",
    billingMode: "metered_paid_api",
    officiallySupported: true,
    commercialUseAllowed: true,
    multiUserUseAllowed: false,
    watermarkPolicy: null,
    monthlyAllowance: null,
    expectedExternalCost: -1,
    enabled: false,
    lastVerifiedAt: "2026-07-24",
  },
];

export function getProvider(providerId: string): ProviderConfig | undefined {
  return PROVIDER_REGISTRY.find((p) => p.id === providerId);
}

/**
 * Verificação obrigatória antes de qualquer job de geração entrar na fila.
 * Nunca trata custo desconhecido como custo zero: providers sem
 * expectedExternalCost === 0 são sempre bloqueados.
 */
export function costPreflight(input: CostPreflightInput): CostPreflightResult {
  const provider = getProvider(input.providerId);

  if (!provider) {
    return {
      allowed: false,
      billingMode: null,
      expectedExternalCost: null,
      allowanceRemaining: null,
      reason: `Provider "${input.providerId}" não está cadastrado no registry.`,
    };
  }

  if (!provider.enabled) {
    return {
      allowed: false,
      billingMode: provider.billingMode,
      expectedExternalCost: provider.expectedExternalCost,
      allowanceRemaining: provider.monthlyAllowance,
      reason: `Provider "${provider.name}" está desabilitado (infraestrutura ausente ou não verificado).`,
    };
  }

  if (!provider.officiallySupported) {
    return {
      allowed: false,
      billingMode: provider.billingMode,
      expectedExternalCost: provider.expectedExternalCost,
      allowanceRemaining: provider.monthlyAllowance,
      reason: `Provider "${provider.name}" não é oficialmente suportado para este uso.`,
    };
  }

  if (!isBillingModeAllowed(provider.billingMode)) {
    return {
      allowed: false,
      billingMode: provider.billingMode,
      expectedExternalCost: provider.expectedExternalCost,
      allowanceRemaining: provider.monthlyAllowance,
      reason: "billingMode metered_paid_api é proibido por política (EXTERNAL_AI_COST_LIMIT=0).",
    };
  }

  if (provider.expectedExternalCost !== AI_COST_POLICY.maxExternalAiCostUsd) {
    return {
      allowed: false,
      billingMode: provider.billingMode,
      expectedExternalCost: provider.expectedExternalCost,
      allowanceRemaining: provider.monthlyAllowance,
      reason: "Custo externo desconhecido ou diferente de zero. Operação bloqueada por segurança.",
    };
  }

  return {
    allowed: true,
    billingMode: provider.billingMode,
    expectedExternalCost: 0,
    allowanceRemaining: provider.monthlyAllowance,
    reason: "OK",
  };
}
