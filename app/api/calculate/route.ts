import { NextRequest, NextResponse } from "next/server";
import type { CalculatorInput, CalculatorResult } from "@/app/lib/types";

// TODO: Заменить всё содержимое этого файла на реальную базу налоговых правил
// по странам (Philippines / Ukraine / India / Indonesia / Croatia / Poland / ...).
// Реальная логика должна учитывать:
//   - гражданство и страну налогового резидентства (могут отличаться);
//   - количество дней в море за отчётный период (пороги для льгот отличаются
//     по странам, например OFW exemption на Филиппинах, seafarer's earnings
//     deduction в UK и т.д.);
//   - флаг судна и тип контракта (в некоторых странах влияет на применимость льгот);
//   - актуальные сроки подачи документов и формы, которые меняются год от года.
// Пока что ниже — фиксированная тестовая заглушка для проверки UI/UX и потока данных.

export async function POST(request: NextRequest) {
  let body: CalculatorInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректный формат запроса." },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body.citizenship !== "string" ||
    typeof body.taxResidenceCountry !== "string" ||
    typeof body.daysAtSea !== "number" ||
    Number.isNaN(body.daysAtSea) ||
    body.daysAtSea < 0 ||
    body.daysAtSea > 366
  ) {
    return NextResponse.json(
      { error: "Проверьте введённые данные и попробуйте снова." },
      { status: 400 }
    );
  }

  // TODO: здесь должна быть реальная логика подбора чеклиста и суммы экономии
  // на основе body.citizenship, body.taxResidenceCountry, body.daysAtSea, body.vesselFlag.
  const result: CalculatorResult = {
    checklist: [
      {
        title: "Подать форму X до 30 апреля",
        description:
          "Заглушка: здесь появится конкретная форма для вашей страны налогового резидентства.",
      },
      {
        title: "Собрать документ Z (подтверждение дней в море)",
        description:
          "Заглушка: список необходимых судовых документов будет зависеть от вашей страны и флага судна.",
      },
      {
        title: "Подать заявление на льготу в налоговую службу",
        description:
          "Заглушка: точная процедура и орган подачи будут определены реальной базой правил.",
      },
    ],
    estimatedSavingsUsd: 1250,
    disclaimer:
      "Это тестовая оценка на основе заглушки, а не реальный расчёт. Итоговые суммы появятся после подключения базы налоговых правил по странам.",
  };

  return NextResponse.json(result);
}
