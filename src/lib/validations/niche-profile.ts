import { z } from "zod";

export const nicheProfileSchema = z.object({
  niche: z.string().trim().max(200).optional().or(z.literal("")),
  whatIDo: z.string().trim().max(2000).optional().or(z.literal("")),
  targetAudience: z.string().trim().max(2000).optional().or(z.literal("")),
  audiencePains: z.string().trim().max(2000).optional().or(z.literal("")),
  audienceDesires: z.string().trim().max(2000).optional().or(z.literal("")),
  objections: z.string().trim().max(2000).optional().or(z.literal("")),
  differentiators: z.string().trim().max(2000).optional().or(z.literal("")),
  proofAndAuthority: z.string().trim().max(2000).optional().or(z.literal("")),
  productsOrServices: z.string().trim().max(2000).optional().or(z.literal("")),
  toneOfVoice: z.string().trim().max(500).optional().or(z.literal("")),
  topicsToCover: z.string().trim().max(2000).optional().or(z.literal("")),
  topicsToAvoid: z.string().trim().max(2000).optional().or(z.literal("")),
  creatorReferences: z.string().trim().max(2000).optional().or(z.literal("")),
  publishFrequency: z.string().trim().max(200).optional().or(z.literal("")),
  mainGoal: z.string().trim().max(500).optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\//.test(v), "URL precisa começar com http:// ou https://"),
});

export type NicheProfileInput = z.infer<typeof nicheProfileSchema>;
