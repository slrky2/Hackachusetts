import { z } from "zod";
import { REPORT_CATEGORIES, REPORT_LIMITS } from "@/lib/utils/report";

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

// Anonymous per-browser id used for upvotes/comments until real auth exists.
export const viewerIdSchema = z.uuid();

export const upvoteSchema = z.object({
  viewerId: viewerIdSchema,
});

export const commentSchema = z.object({
  viewerId: viewerIdSchema,
  text: z.string().trim().min(1, "Comment can't be empty").max(500, "Keep comments under 500 characters"),
});

// Photos arrive as JPEG data URLs (the browser re-encodes them before upload).
const MAX_PHOTO_DATA_URL_LENGTH = Math.ceil((REPORT_LIMITS.maxPhotoBytes * 4) / 3) + 32;
const jpegDataUrl = z
  .string()
  .max(MAX_PHOTO_DATA_URL_LENGTH, "Each photo must be under 1.5 MB")
  .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/, "Photos must be JPEG images");

/** POST /api/issues body, sent by the Report page. */
export const createReportSchema = z.object({
  viewerId: viewerIdSchema,
  description: z
    .string()
    .trim()
    .min(REPORT_LIMITS.minDescription, `Please describe the issue in at least ${REPORT_LIMITS.minDescription} characters`)
    .max(REPORT_LIMITS.maxDescription),
  category: z.enum(REPORT_CATEGORIES),
  severity: z.enum(["High", "Medium", "Low"]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationDetails: z.string().trim().max(REPORT_LIMITS.maxLocationDetails).optional(),
  photos: z.array(jpegDataUrl).max(REPORT_LIMITS.maxPhotos, `Up to ${REPORT_LIMITS.maxPhotos} photos`).default([]),
});

/** What the client sends (viewerId is added by useIssues). */
export type CreateReportInput = Omit<z.input<typeof createReportSchema>, "viewerId">;
