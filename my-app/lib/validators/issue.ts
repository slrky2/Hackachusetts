import { z } from "zod";

export const createIssueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(10, "Please provide more detail").max(2000),
  category: z.enum([
    "road_hazard",
    "road_blockage",
    "pothole",
    "broken_streetlight",
    "graffiti",
    "flooding",
    "fallen_tree",
    "abandoned_vehicle",
    "noise_complaint",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(5).optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
