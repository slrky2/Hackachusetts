"use client";

import type { Allergen, DietaryRestriction } from "@/types";

const DIETARY_OPTIONS: DietaryRestriction[] = [
  "vegetarian", "vegan", "halal", "kosher", "gluten_free", "dairy_free",
];

const ALLERGEN_OPTIONS: Allergen[] = [
  "nuts", "peanuts", "shellfish", "fish", "eggs", "milk", "wheat", "soy", "sesame",
];

interface Props {
  selected: { dietary: DietaryRestriction[]; allergens: Allergen[] };
  onSave: (prefs: { dietary: DietaryRestriction[]; allergens: Allergen[] }) => void;
  onClose: () => void;
}

/**
 * Modal to let users set their dietary restrictions and allergen profile
 * before chatting with CivicBot.
 */
export default function DietaryPrefsModal({ selected, onSave, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">Dietary Preferences</h2>
        <section>
          <p className="text-sm font-medium mb-2">Restrictions</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((d) => (
              <span key={d} className="text-xs px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 capitalize">
                {d.replace("_", " ")}
              </span>
            ))}
          </div>
        </section>
        <section>
          <p className="text-sm font-medium mb-2">Allergens</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((a) => (
              <span key={a} className="text-xs px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 capitalize">
                {a}
              </span>
            ))}
          </div>
        </section>
        {/* TODO: make checkboxes interactive */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700">
            Cancel
          </button>
          <button
            onClick={() => { onSave(selected); onClose(); }}
            className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
