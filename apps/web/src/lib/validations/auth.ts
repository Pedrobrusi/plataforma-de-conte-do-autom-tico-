import { z } from "zod";

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome completo").max(120),
    email: z.string().trim().email("E-mail inválido"),
    password: z
      .string()
      .min(8, "A senha precisa ter no mínimo 8 caracteres")
      .max(72)
      .regex(/[A-Za-z]/, "A senha precisa ter ao menos uma letra")
      .regex(/[0-9]/, "A senha precisa ter ao menos um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha precisa ter no mínimo 8 caracteres")
      .max(72)
      .regex(/[A-Za-z]/, "A senha precisa ter ao menos uma letra")
      .regex(/[0-9]/, "A senha precisa ter ao menos um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const onboardingSchema = z.object({
  workspaceName: z.string().trim().min(2, "Dê um nome ao seu workspace").max(80),
  niche: z.string().trim().max(200).optional().or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
