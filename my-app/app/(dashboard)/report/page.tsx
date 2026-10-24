"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LocationPicker from "@/components/map/LocationPicker";
import { APP_CONFIG } from "@/config/app";
import { useIssues } from "@/lib/hooks/useIssues";
import { coordsOf, useUserLocation } from "@/lib/hooks/useUserLocation";
import type { LatLng } from "@/lib/maps";
import { photoToJpegDataUrl } from "@/lib/utils/image";
import { REPORT_CATEGORIES, REPORT_LIMITS, type ReportCategory } from "@/lib/utils/report";
import { SEVERITY_LEVELS } from "@/lib/utils/severity";
import type { TicketSeverity } from "@/types";

const MAX_PHOTOS = REPORT_LIMITS.maxPhotos;
const MIN_DESCRIPTION = REPORT_LIMITS.minDescription;
const MAX_DESCRIPTION = REPORT_LIMITS.maxDescription;

const SEVERITY_HINTS: Record<TicketSeverity, string> = {
  High: "Dangerous or blocking",
  Medium: "Needs fixing soon",
  Low: "Minor or cosmetic",
};

interface Photo {
  id: string;
  file: File;
  previewUrl: string;
}

/**
 * Report a problem: photos, a description, and a pin on the map.
 */
export default function ReportPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState<LatLng | null>(null);
  const [locationDetails, setLocationDetails] = useState("");
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [category, setCategory] = useState<ReportCategory>("Roads");
  const [severity, setSeverity] = useState<TicketSeverity>("Medium");
  const [errors, setErrors] = useState<{ description?: string; pin?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { createReport } = useIssues();

  // Follow the user (blue dot). The map centers on them once by itself;
  // `focus` only moves it when they press "Pin my location".
  const location = useUserLocation(APP_CONFIG.defaultMapCenter, APP_CONFIG.localAreaRadiusKm);
  const userCoords = coordsOf(location);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free photo preview memory when leaving the page.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    const room = MAX_PHOTOS - photos.length;
    const added = images.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((cur) => [...cur, ...added]);
    // Reset so picking the same file again still triggers onChange.
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((cur) => {
      const target = cur.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return cur.filter((p) => p.id !== id);
    });
  }

  function pinHere(here: LatLng) {
    setPin(here);
    setFocus(here);
    setErrors((e) => ({ ...e, pin: undefined }));
    setLocateError(null);
  }

  function useMyLocation() {
    // Already tracking the blue dot: pin it right away.
    if (userCoords) {
      pinHere({ lat: userCoords.lat, lng: userCoords.lng });
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocateError("Your browser can't share its location. Tap the map instead.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pinHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocateError("Couldn't get your location. Tap the map instead.");
        setLocating(false);
      },
      { timeout: 10_000 },
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const next: typeof errors = {};
    if (description.trim().length < MIN_DESCRIPTION) {
      next.description = `Please describe the issue in at least ${MIN_DESCRIPTION} characters.`;
    }
    if (!pin) next.pin = "Tap the map to drop a pin where the problem is.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !pin) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      let encoded: string[];
      try {
        encoded = await Promise.all(photos.map((p) => photoToJpegDataUrl(p.file)));
      } catch {
        throw new Error("One of your photos couldn't be read. Try removing it or using a JPEG or PNG.");
      }
      await createReport({
        description: description.trim(),
        category,
        severity,
        lat: pin.lat,
        lng: pin.lng,
        locationDetails: locationDetails.trim() || undefined,
        photos: encoded,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't submit your report.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setDescription("");
    setPin(null);
    setLocationDetails("");
    setCategory("Roads");
    setSeverity("Medium");
    setErrors({});
    setSubmitError(null);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="grid flex-1 place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            ✓
          </div>
          <h1 className="text-xl font-bold">Report submitted</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Thanks for helping improve the city. It&apos;s now on the home feed, in City Problems, and on the map.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              See it on Home
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-emerald-600 px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
            >
              View map
            </Link>
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-5 py-2 text-sm font-semibold text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              Report another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sectionClass =
    "rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <form onSubmit={handleSubmit} noValidate className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight">Report a problem</h1>
          <p className="mt-1 text-sm text-zinc-500">Add photos, describe the issue, and show us where it is.</p>
        </header>

        {/* PHOTOS */}
        <section className={sectionClass} aria-labelledby="photos-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="photos-heading" className="text-lg font-bold">Photos</h2>
            <span className="text-xs text-zinc-500">
              {photos.length}/{MAX_PHOTOS} · optional
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={photo.previewUrl} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-500/40 text-emerald-700 transition-colors hover:bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                <span className="text-2xl leading-none" aria-hidden="true">+</span>
                <span className="text-xs font-semibold">Add photo</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => addPhotos(e.target.files)}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </section>

        {/* DESCRIPTION */}
        <section className={sectionClass} aria-labelledby="description-heading">
          <h2 id="description-heading" className="mb-3 text-lg font-bold">
            <label htmlFor="description">Describe the issue</label>
          </h2>
          <textarea
            id="description"
            rows={5}
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((er) => ({ ...er, description: undefined }));
            }}
            placeholder="What's the problem? How long has it been there? Is it dangerous?"
            aria-invalid={!!errors.description}
            aria-describedby="description-help"
            className="w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-zinc-800"
          />
          <div id="description-help" className="mt-1 flex justify-between text-xs">
            <span className="text-red-600">{errors.description}</span>
            <span className="text-zinc-500">
              {description.length}/{MAX_DESCRIPTION}
            </span>
          </div>
        </section>

        {/* TYPE + URGENCY */}
        <section className={sectionClass} aria-labelledby="details-heading">
          <h2 id="details-heading" className="mb-3 text-lg font-bold">Details</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-zinc-800"
            >
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium">How urgent is it?</legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
              {SEVERITY_LEVELS.map((level) => (
                <label
                  key={level}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-emerald-500 ${
                    severity === level
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-black/10 hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.04]"
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={level}
                    checked={severity === level}
                    onChange={() => setSeverity(level)}
                    className="sr-only"
                  />
                  <span className="block font-semibold">{level}</span>
                  <span className="block text-xs text-zinc-500">
                    {SEVERITY_HINTS[level]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {/* WHERE */}
        <section className={sectionClass} aria-labelledby="where-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="where-heading" className="text-lg font-bold">Where is it?</h2>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-black/10 disabled:opacity-60 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
            >
              {locating ? "Locating…" : "📍 Pin my location"}
            </button>
          </div>
          <p className="mb-3 text-sm text-zinc-500">
            The blue dot is you. Press &ldquo;Pin my location&rdquo; to report right where you are, or tap the map
            to drop a pin somewhere else. Drag the pin to adjust it.
          </p>

          <div
            className={`h-72 overflow-hidden rounded-xl border sm:h-80 ${
              errors.pin ? "border-red-500" : "border-black/10 dark:border-white/15"
            }`}
          >
            <LocationPicker
              value={pin}
              focus={focus}
              userLocation={userCoords}
              locating={location.status === "pending"}
              onChange={(p) => {
                setPin(p);
                setErrors((er) => ({ ...er, pin: undefined }));
              }}
            />
          </div>

          <p role="status" className="mt-2 text-xs">
            {errors.pin ? (
              <span className="text-red-600">{errors.pin}</span>
            ) : locateError ? (
              <span className="text-amber-700 dark:text-amber-400">{locateError}</span>
            ) : pin ? (
              <span className="text-zinc-500">
                Pin at {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </span>
            ) : (
              <span className="text-zinc-500">
                No pin yet.{" "}
                {location.status === "pending"
                  ? "Finding your location…"
                  : userCoords
                    ? "The blue dot shows where you are."
                    : "Location is off, so the map shows the city center. Tap the map to drop a pin."}
              </span>
            )}
          </p>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Location details <span className="font-normal text-zinc-500">(optional)</span>
            </span>
            <input
              type="text"
              maxLength={200}
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              placeholder="e.g. Corner of Merrimack St & Central St, near the bus stop"
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-zinc-800"
            />
          </label>
        </section>

        {submitError && (
          <p role="alert" className="text-center text-sm text-red-600">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
        >
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
