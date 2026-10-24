import { z } from "zod";

export const createBountySchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum(["issue_fix", "community_task", "cleanup", "survey", "other"]),
  reward: z.number().positive(),
  rewardType: z.enum(["points", "gift_card", "recognition"]).default("points"),
  deadline: z.string().datetime().optional(),
  linkedIssueId: z.string().uuid().optional(),
  requirements: z.array(z.string().min(1)).max(10),
});

export type CreateBountyInput = z.infer<typeof createBountySchema>;
