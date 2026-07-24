export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Averro Content OS",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? "Averro",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "Criação, organização, geração, edição, agendamento e publicação de conteúdo para redes sociais.",
  defaultLocale: "pt-BR",
  defaultTimezone: process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "America/Sao_Paulo",
} as const;
