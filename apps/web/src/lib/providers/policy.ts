// Circuit breaker financeiro global. Lido apenas no backend — nunca no client.
// Mesmo que uma chave paga seja adicionada ao .env por engano, esses valores
// não são configuráveis via variável de ambiente: são constantes de código,
// para que nenhuma alteração de .env possa reativar cobrança externa sozinha.
export const AI_COST_POLICY = {
  policy: "ZERO_EXTERNAL_COST" as const,
  maxExternalAiCostUsd: 0,
  allowMeteredAiApis: false,
  allowPaidFallback: false,
  allowOverage: false,
  allowAutoRecharge: false,
  allowUnverifiedProviders: false,
  allowOfficialSubscriptionConnectors: true,
  allowLocalModels: true,
  allowFreeAllowance: true,
} as const;

export const AUTHENTICATION_POLICY = {
  policy: "OFFICIAL_LINK_ONLY" as const,
  allowUserApiKeys: false,
  allowMeteredApiKeys: false,
  allowSessionCookieImport: false,
  allowBrowserSessionReuse: false,
  allowPrivateEndpoints: false,
  allowBrowserAutomationForAi: false,
  allowOfficialOauth: true,
  allowOfficialPkce: true,
  allowOfficialDeviceCode: true,
  allowLocalProviders: true,
  requireEntitlementVerification: true,
  requireZeroExternalCost: true,
} as const;

const FORBIDDEN_BILLING_MODE = "metered_paid_api";

/** Bloqueia qualquer provider com billingMode metered_paid_api, mesmo que enabled=true por engano. */
export function isBillingModeAllowed(billingMode: string): boolean {
  return billingMode !== FORBIDDEN_BILLING_MODE;
}
