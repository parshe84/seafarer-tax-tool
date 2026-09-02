"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalculatorResult } from "@/app/lib/types";

const RESULT_STORAGE_KEY = "seafarer-tax-result";

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
          <p>Результат не найден. Пожалуйста, заполните форму заново.</p>
          <div className="footer-actions">
            <button className="btn btn-primary" onClick={handleRestart}>
              Начать заново
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
          <p>Загрузка результата…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="hero">
        <h1>Ваш результат</h1>
      </header>

      <div className="savings-card">
        <div className="label">Ориентировочная экономия</div>
        <div className="amount">
          ${result.estimatedSavingsUsd.toLocaleString("en-US")}
        </div>
        <div className="disclaimer">{result.disclaimer}</div>
      </div>

      <div className="card">
        <div className="section-title">Чеклист действий</div>
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
          Начать заново
        </button>
      </div>

      <p className="disclaimer-box">
        Сервис даёт ориентировочную оценку и не является налоговой
        консультацией. Актуальные требования уточняйте у налогового
        консультанта в вашей стране.
      </p>
    </div>
  );
}
