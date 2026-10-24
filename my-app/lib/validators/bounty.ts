import { z } from "zod";
import { MAX_IMAGE_DATA_URL_LENGTH } from "@/lib/bounties/image";

/**
 * Body for POST /api/bounties. Who is posting comes from the Clerk session,
 * never from the body.
 */
export const createBountySchema = z
  .object({
    title: z.string().trim().min(1, "Give the job a title.").max(120, "Keep the title under 120 characters."),
    details: z.string().trim().max(2000, "Keep the details under 2,000 characters.").default(""),
    reward: z
      .number({ error: "Reward must be a number." })
      .gt(0, "The reward must be more than $0.")
      .max(1000, "The reward can be at most $1,000."),
    place: z
      .string({ error: "Say where the job is, like a street or neighborhood." })
      .trim()
      .min(1, "Say where the job is, like a street or neighborhood.")
      .max(120, "Keep the place under 120 characters."),
    lat: z.number().min(-90).max(90).nullable().default(null),
    lng: z.number().min(-180).max(180).nullable().default(null),
    /** Optional photo as a base64 data URL; decoded and checked in lib/bounties/image.ts. */
    image: z.string().max(MAX_IMAGE_DATA_URL_LENGTH, "That photo is too large (2 MB max).").nullable().default(null),
    /** Post as the city (city staff only). */
    asCity: z.boolean().default(false),
  })
  .refine((b) => (b.lat === null) === (b.lng === null), {
    message: "Send both lat and lng, or neither.",
  });

export type CreateBountyInput = z.infer<typeof createBountySchema>;

/** The step in POST /api/bounties/:bountyId/:action. */
export const bountyActionSchema = z.enum(["claim", "done", "approve"]);
