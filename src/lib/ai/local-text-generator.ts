/**
 * Gerador local de texto: monta uma amostra a partir do perfil de nicho, sem
 * chamar nenhum LLM pago. Provider "local-template-text" no registry
 * (billingMode local_self_hosted, expectedExternalCost 0). Não é um modelo
 * neural — é determinístico e parametrizado pelos dados reais do usuário,
 * suficiente para validar que o contexto do Planejador está correto antes de
 * as Fases 3+ conectarem geradores mais ricos ao mesmo contexto.
 */

export type NicheContext = {
  niche?: string | null;
  targetAudience?: string | null;
  toneOfVoice?: string | null;
  mainGoal?: string | null;
  differentiators?: string | null;
};

export function buildAiContextSummary(context: NicheContext): string {
  const lines: string[] = [];
  if (context.niche) lines.push(`Nicho: ${context.niche}`);
  if (context.targetAudience) lines.push(`Público-alvo: ${context.targetAudience}`);
  if (context.toneOfVoice) lines.push(`Tom de voz: ${context.toneOfVoice}`);
  if (context.mainGoal) lines.push(`Objetivo principal: ${context.mainGoal}`);
  if (context.differentiators) lines.push(`Diferenciais: ${context.differentiators}`);

  if (lines.length === 0) {
    return "Nenhum contexto de nicho preenchido ainda. Preencha o Planejador para os geradores usarem essas informações.";
  }
  return lines.join("\n");
}

export function generateSampleFromNicheProfile(context: NicheContext): string {
  const niche = context.niche?.trim() || "seu nicho";
  const audience = context.targetAudience?.trim() || "seu público";
  const tone = context.toneOfVoice?.trim() || "direto";
  const goal = context.mainGoal?.trim();
  const diff = context.differentiators?.trim();

  const opening = `Para ${audience}, aqui vai um ponto sobre ${niche}, em tom ${tone}:`;
  const body = diff
    ? `O que diferencia essa abordagem é: ${diff.split("\n")[0]}.`
    : `Vale entender o que realmente funciona antes de tentar mais uma tática genérica.`;
  const closing = goal ? `Objetivo desse tipo de conteúdo: ${goal}.` : `Comece testando um formato simples esta semana.`;

  return [opening, body, closing].join(" ");
}
