"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, type CalculatorInput } from "@/app/lib/types";

const RESULT_STORAGE_KEY = "seafarer-tax-result";

export default function HomePage() {
  const router = useRouter();
  const [citizenship, setCitizenship] = useState<string>(COUNTRIES[0]);
  const [taxResidenceCountry, setTaxResidenceCountry] = useState<string>(
    COUNTRIES[0]
  );
  const [daysAtSea, setDaysAtSea] = useState<string>("");
  const [vesselFlag, setVesselFlag] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const days = Number(daysAtSea);
    if (!daysAtSea || Number.isNaN(days) || days < 0 || days > 366) {
      setError("Введите корректное количество дней в море (0–366).");
      return;
    }

    const payload: CalculatorInput = {
      citizenship: citizenship as CalculatorInput["citizenship"],
      taxResidenceCountry:
        taxResidenceCountry as CalculatorInput["taxResidenceCountry"],
      daysAtSea: days,
      vesselFlag: vesselFlag.trim() || undefined,
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
        throw new Error(data?.error ?? "Не удалось выполнить расчёт.");
      }

      const result = await response.json();
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка. Попробуйте ещё раз."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container">
      <header className="hero">
        <h1>Налоговый оптимизатор для моряков</h1>
        <p>
          Узнайте, какие налоговые льготы вам положены, и сколько денег вы
          можете вернуть или сэкономить.
        </p>
      </header>

      <div className="card">
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="citizenship">Гражданство</label>
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
            <label htmlFor="taxResidence">
              Страна налогового резидентства
            </label>
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
            <label htmlFor="daysAtSea">Дней в море за последние 12 месяцев</label>
            <input
              id="daysAtSea"
              type="number"
              inputMode="numeric"
              min={0}
              max={366}
              placeholder="Например, 240"
              value={daysAtSea}
              onChange={(e) => setDaysAtSea(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="vesselFlag">
              Флаг судна <span style={{ fontWeight: 400 }}>(необязательно)</span>
            </label>
            <input
              id="vesselFlag"
              type="text"
              placeholder="Например, Panama"
              value={vesselFlag}
              onChange={(e) => setVesselFlag(e.target.value)}
            />
            <div className="hint">
              Иногда влияет на применимость льгот в вашей стране.
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Считаем…" : "Рассчитать льготы"}
          </button>
        </form>
      </div>

      <p className="disclaimer-box">
        Сервис даёт ориентировочную оценку и не является налоговой
        консультацией. Актуальные требования уточняйте у налогового
        консультанта в вашей стране.
      </p>
    </div>
  );
}
