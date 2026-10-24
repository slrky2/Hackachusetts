/** Categories a resident can pick when filing a report. */
export const REPORT_CATEGORIES = [
  "Roads",
  "Lighting",
  "Sanitation",
  "Parks",
  "Traffic",
  "Drainage",
  "Vandalism",
  "Other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_LIMITS = {
  maxPhotos: 5,
  minDescription: 10,
  maxDescription: 2000,
  maxLocationDetails: 200,
  /** Per photo, after the browser shrinks it. */
  maxPhotoBytes: 1_500_000,
} as const;
