"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  COUNTRIES,
  FAMILY_LOCATIONS,
  type CalculatorInput,
  type FamilyLocation,
} from "@/app/lib/types";
import { getMessages } from "@/app/lib/i18n";

const RESULT_STORAGE_KEY = "seafarer-tax-result";
const t = getMessages();

export default function HomePage() {
  const router = useRouter();
  const [citizenship, setCitizenship] = useState<string>(COUNTRIES[0]);
  const [taxResidenceCountry, setTaxResidenceCountry] = useState<string>(
    COUNTRIES[0]
  );
  const [daysAtSea, setDaysAtSea] = useState<string>("");
  const [vesselFlag, setVesselFlag] = useState<string>("");
  const [annualIncomeUsd, setAnnualIncomeUsd] = useState<string>("");
  const [familyLocation, setFamilyLocation] = useState<string>("");
  const [daysInUkraine, setDaysInUkraine] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showUkraineResidencyFields =
    citizenship === "Ukraine" && taxResidenceCountry === "Ukraine";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const days = Number(daysAtSea);
    if (!daysAtSea || Number.isNaN(days) || days < 0 || days > 366) {
      setError(t.home.validationError);
      return;
    }

    let parsedAnnualIncomeUsd: number | undefined;
    if (annualIncomeUsd.trim()) {
      const income = Number(annualIncomeUsd);
      if (Number.isNaN(income) || income < 0) {
        setError(t.home.validationError);
        return;
      }
      parsedAnnualIncomeUsd = income;
    }

    let parsedDaysInUkraine: number | undefined;
    if (showUkraineResidencyFields && daysInUkraine.trim()) {
      const value = Number(daysInUkraine);
      if (Number.isNaN(value) || value < 0 || value > 366) {
        setError(t.home.ukraineDaysInUkraineValidationError);
        return;
      }
      parsedDaysInUkraine = value;
    }

    const payload: CalculatorInput = {
      citizenship: citizenship as CalculatorInput["citizenship"],
      taxResidenceCountry:
        taxResidenceCountry as CalculatorInput["taxResidenceCountry"],
      daysAtSea: days,
      vesselFlag: vesselFlag.trim() || undefined,
      annualIncomeUsd: parsedAnnualIncomeUsd,
      familyLocation: showUkraineResidencyFields
        ? (familyLocation as FamilyLocation) || undefined
        : undefined,
      daysInUkraine: showUkraineResidencyFields
        ? parsedDaysInUkraine
        : undefined,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? t.home.genericError);
      }

      const result = await response.json();
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.home.genericError);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container">
      <header className="hero">
        <h1>{t.home.heroTitle}</h1>
        <p>{t.home.heroSubtitle}</p>
      </header>

      <div className="card">
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="citizenship">{t.home.citizenshipLabel}</label>
            <select
              id="citizenship"
              value={citizenship}
              onChange={(e) => setCitizenship(e.target.value)}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="taxResidence">{t.home.taxResidenceLabel}</label>
            <select
              id="taxResidence"
              value={taxResidenceCountry}
              onChange={(e) => setTaxResidenceCountry(e.target.value)}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="daysAtSea">{t.home.daysAtSeaLabel}</label>
            <input
              id="daysAtSea"
              type="number"
              inputMode="numeric"
              min={0}
              max={366}
              placeholder={t.home.daysAtSeaPlaceholder}
              value={daysAtSea}
              onChange={(e) => setDaysAtSea(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="vesselFlag">
              {t.home.vesselFlagLabel}{" "}
              <span style={{ fontWeight: 400 }}>
                {t.home.vesselFlagOptionalNote}
              </span>
            </label>
            <input
              id="vesselFlag"
              type="text"
              placeholder={t.home.vesselFlagPlaceholder}
              value={vesselFlag}
              onChange={(e) => setVesselFlag(e.target.value)}
            />
            <div className="hint">{t.home.vesselFlagHint}</div>
          </div>

          <div className="field">
            <label htmlFor="annualIncomeUsd">
              {t.home.annualIncomeLabel}{" "}
              <span style={{ fontWeight: 400 }}>
                {t.home.annualIncomeOptionalNote}
              </span>
            </label>
            <input
              id="annualIncomeUsd"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={t.home.annualIncomePlaceholder}
              value={annualIncomeUsd}
              onChange={(e) => setAnnualIncomeUsd(e.target.value)}
            />
            <div className="hint">{t.home.annualIncomeHint}</div>
          </div>

          {showUkraineResidencyFields && (
            <>
              <div className="field">
                <label htmlFor="familyLocation">
                  {t.home.ukraineFamilyLocationLabel}
                </label>
                <select
                  id="familyLocation"
                  value={familyLocation}
                  onChange={(e) => setFamilyLocation(e.target.value)}
                >
                  <option value="">—</option>
                  {FAMILY_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location === "Ukraine"
                        ? t.home.ukraineFamilyLocationOptionUkraine
                        : location === "Outside Ukraine"
                        ? t.home.ukraineFamilyLocationOptionOutside
                        : t.home.ukraineFamilyLocationOptionNotSure}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="daysInUkraine">
                  {t.home.ukraineDaysInUkraineLabel}
                </label>
                <input
                  id="daysInUkraine"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={366}
                  placeholder={t.home.ukraineDaysInUkrainePlaceholder}
                  value={daysInUkraine}
                  onChange={(e) => setDaysInUkraine(e.target.value)}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t.home.submitButtonLoading : t.home.submitButton}
          </button>
        </form>
      </div>

      <p className="disclaimer-box">{t.common.disclaimer}</p>
    </div>
  );
}
