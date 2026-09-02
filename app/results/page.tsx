"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalculatorResult } from "@/app/lib/types";
import { getMessages } from "@/app/lib/i18n";

const RESULT_STORAGE_KEY = "seafarer-tax-result";
const t = getMessages();

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) {
      setNotFound(true);
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      setNotFound(true);
    }
  }, []);

  function handleRestart() {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
    router.push("/");
  }

  if (notFound) {
    return (
      <div className="container">
        <div className="card">
          <p>{t.results.notFoundMessage}</p>
          <div className="footer-actions">
            <button className="btn btn-primary" onClick={handleRestart}>
              {t.results.restartButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container">
        <div className="card">
          <p>{t.results.loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="hero">
        <h1>{t.results.pageTitle}</h1>
      </header>

      <div className="savings-card">
        <div className="label">{t.results.savingsLabel}</div>
        {result.estimatedSavingsUsd !== null ? (
          <div className="amount">
            ${result.estimatedSavingsUsd.toLocaleString("en-US")}
          </div>
        ) : (
          <div className="amount-note">{result.estimatedSavingsNote}</div>
        )}
      </div>

      <div className="notice-box">
        <div className="notice-title">⚠ {t.results.disclaimerTitle}</div>
        <div>{result.disclaimer}</div>
      </div>

      <div className="card">
        <div className="section-title">{t.results.checklistTitle}</div>
        <ul className="checklist">
          {result.checklist.map((item, index) => (
            <li key={index}>
              <div className="check-icon">{index + 1}</div>
              <div className="check-text">
                <div className="title">{item.title}</div>
                <div className="desc">{item.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="footer-actions">
        <button className="btn btn-secondary" onClick={handleRestart}>
          {t.results.restartButton}
        </button>
      </div>

      <p className="disclaimer-box">{t.common.disclaimer}</p>
    </div>
  );
}
