"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalculatorResult } from "@/app/lib/types";
import { getMessages } from "@/app/lib/i18n";

const RESULT_STORAGE_KEY = "seafarer-tax-result";
const RESULT_CONTEXT_STORAGE_KEY = "seafarer-tax-result-context";
const NOTIFY_ENDPOINT = "https://formspree.io/f/meaqkrgy";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const t = getMessages();

interface ResultContext {
  citizenship: string;
  taxResidenceCountry: string;
}

type NotifyStatus = "idle" | "submitting" | "success" | "error";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [context, setContext] = useState<ResultContext | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<NotifyStatus>("idle");
  const [notifyError, setNotifyError] = useState<string | null>(null);

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
      return;
    }

    const rawContext = sessionStorage.getItem(RESULT_CONTEXT_STORAGE_KEY);
    if (rawContext) {
      try {
        setContext(JSON.parse(rawContext));
      } catch {
        setContext(null);
      }
    }
  }, []);

  function handleRestart() {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
    sessionStorage.removeItem(RESULT_CONTEXT_STORAGE_KEY);
    router.push("/");
  }

  function handlePrint() {
    window.print();
  }

  async function handleNotifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotifyError(null);

    if (!EMAIL_PATTERN.test(notifyEmail.trim())) {
      setNotifyStatus("error");
      setNotifyError(t.results.notifyValidationError);
      return;
    }

    setNotifyStatus("submitting");
    try {
      const response = await fetch(NOTIFY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          citizenship: context?.citizenship ?? "",
          taxResidencyCountry: context?.taxResidenceCountry ?? "",
        }),
      });

      if (!response.ok) {
        throw new Error(t.results.notifyErrorMessage);
      }

      setNotifyStatus("success");
    } catch {
      setNotifyStatus("error");
      setNotifyError(t.results.notifyErrorMessage);
    }
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

      <div className={`savings-card ${result.estimatedAmountKind ?? "savings"}`}>
        <div className="label">
          {result.estimatedAmountLabel ?? t.results.savingsLabel}
        </div>
        {result.estimatedSavingsUsd !== null && (
          <div className="amount">
            ${result.estimatedSavingsUsd.toLocaleString("en-US")}
          </div>
        )}
        {result.estimatedSavingsNote && (
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

      <div className="card notify-card">
        <div className="section-title">{t.results.notifyTitle}</div>
        {notifyStatus === "success" ? (
          <p>
            {t.results.notifySuccessPrefix}
            {context?.citizenship}
            {t.results.notifySuccessSuffix}
          </p>
        ) : (
          <>
            <p className="notify-text">
              {context?.citizenship === "Ukraine"
                ? t.results.notifyTextUkraine
                : context?.citizenship === "Poland"
                ? t.results.notifyTextPoland
                : t.results.notifyTextGeneric}
            </p>
            <form onSubmit={handleNotifySubmit} noValidate>
              <div className="field">
                <label htmlFor="notifyEmail" className="visually-hidden">
                  {t.results.notifyEmailLabel}
                </label>
                <input
                  id="notifyEmail"
                  type="email"
                  placeholder={t.results.notifyEmailPlaceholder}
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  required
                />
              </div>
              {notifyStatus === "error" && (
                <div className="error-box">{notifyError}</div>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={notifyStatus === "submitting"}
              >
                {t.results.notifyButton}
              </button>
            </form>
            <p className="notify-subtext">{t.results.notifySubtext}</p>
          </>
        )}
      </div>

      <div className="footer-actions">
        <button className="btn btn-secondary" onClick={handlePrint}>
          {t.results.printButton}
        </button>
        <button className="btn btn-secondary" onClick={handleRestart}>
          {t.results.restartButton}
        </button>
      </div>

      <p className="disclaimer-box">{t.common.disclaimer}</p>
    </div>
  );
}
