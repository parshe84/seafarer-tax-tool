"use client";

import { useState } from "react";
import { getMessages } from "@/app/lib/i18n";

const t = getMessages();

interface Voyage {
  id: number;
  embarkation: string;
  disembarkation: string;
}

interface DaysInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

let voyageIdCounter = 0;

function daysBetween(startIso: string, endIso: string): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// Reusable days-of-the-year input: a plain manual number field by default,
// with an optional toggle to a voyage log (embarkation/disembarkation date
// pairs) that computes the total automatically. Used wherever a country's
// logic needs a day count — the general "days at sea" field and Ukraine's
// "days in Ukraine" field both use this same component.
export default function DaysInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
}: DaysInputProps) {
  const [mode, setMode] = useState<"manual" | "voyages">("manual");
  const [voyages, setVoyages] = useState<Voyage[]>([
    { id: voyageIdCounter++, embarkation: "", disembarkation: "" },
  ]);

  function applyTotal(nextVoyages: Voyage[]) {
    const total = nextVoyages.reduce((sum, voyage) => {
      const days = daysBetween(voyage.embarkation, voyage.disembarkation);
      return days !== null && days >= 0 ? sum + days : sum;
    }, 0);
    onChange(String(total));
  }

  function updateVoyage(
    voyageId: number,
    field: "embarkation" | "disembarkation",
    fieldValue: string
  ) {
    const next = voyages.map((voyage) =>
      voyage.id === voyageId ? { ...voyage, [field]: fieldValue } : voyage
    );
    setVoyages(next);
    applyTotal(next);
  }

  function addVoyage() {
    setVoyages([
      ...voyages,
      { id: voyageIdCounter++, embarkation: "", disembarkation: "" },
    ]);
  }

  function removeVoyage(voyageId: number) {
    const next = voyages.filter((voyage) => voyage.id !== voyageId);
    setVoyages(next);
    applyTotal(next);
  }

  const totalDays = voyages.reduce((sum, voyage) => {
    const days = daysBetween(voyage.embarkation, voyage.disembarkation);
    return days !== null && days >= 0 ? sum + days : sum;
  }, 0);

  return (
    <div className="field">
      <div className="days-input-header">
        <label htmlFor={id}>{label}</label>
        <button
          type="button"
          className="link-button"
          onClick={() => setMode(mode === "manual" ? "voyages" : "manual")}
        >
          {mode === "manual"
            ? t.home.enterVoyageDatesToggle
            : t.home.useManualDaysToggle}
        </button>
      </div>

      {mode === "manual" ? (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={366}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <div className="voyage-log">
          {voyages.map((voyage) => {
            const days = daysBetween(voyage.embarkation, voyage.disembarkation);
            const isInvalid = days !== null && days < 0;
            return (
              <div className="voyage-row" key={voyage.id}>
                <div className="voyage-row-fields">
                  <div>
                    <label className="voyage-sublabel">
                      {t.home.voyageLogEmbarkationLabel}
                    </label>
                    <input
                      type="date"
                      value={voyage.embarkation}
                      onChange={(e) =>
                        updateVoyage(voyage.id, "embarkation", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="voyage-sublabel">
                      {t.home.voyageLogDisembarkationLabel}
                    </label>
                    <input
                      type="date"
                      value={voyage.disembarkation}
                      onChange={(e) =>
                        updateVoyage(
                          voyage.id,
                          "disembarkation",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  {voyages.length > 1 && (
                    <button
                      type="button"
                      className="link-button voyage-remove"
                      onClick={() => removeVoyage(voyage.id)}
                    >
                      {t.home.voyageLogRemoveButton}
                    </button>
                  )}
                </div>
                {isInvalid && (
                  <div className="voyage-error">
                    {t.home.voyageLogInvalidRangeError}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-secondary voyage-add"
            onClick={addVoyage}
          >
            {t.home.voyageLogAddButton}
          </button>

          <div className="voyage-total">
            {t.home.voyageLogTotalDaysLabel}: <strong>{totalDays}</strong>
          </div>

          {totalDays > 366 && (
            <div className="voyage-warning">
              {t.home.voyageLogExceeds366Warning}
            </div>
          )}
        </div>
      )}

      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
