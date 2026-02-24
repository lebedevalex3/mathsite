"use client";

import { useEffect, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import type { SkillProgressMap } from "@/src/lib/progress/types";

type HomeProgressCtaProps = {
  locale: "ru" | "en" | "de";
};

type Status = "loading" | "has_progress" | "empty" | "error";

const copy = {
  ru: {
    continueLabel: "Продолжить",
    startLabel: "Начать тренировку",
  },
  en: {
    continueLabel: "Continue",
    startLabel: "Start training",
  },
  de: {
    continueLabel: "Weiter",
    startLabel: "Training starten",
  },
} as const;

export function HomeProgressCta({ locale }: HomeProgressCtaProps) {
  const [status, setStatus] = useState<Status>("loading");
  const t = copy[locale];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/progress?topicId=g5.proporcii", {
          credentials: "same-origin",
        });
        if (!response.ok) {
          if (!cancelled) setStatus("error");
          return;
        }

        const payload = (await response.json()) as {
          ok?: boolean;
          progress?: SkillProgressMap;
        };

        if (!cancelled) {
          const hasProgress = !!payload.ok && !!payload.progress && Object.values(payload.progress).some((entry) => entry.total > 0);
          setStatus(hasProgress ? "has_progress" : "empty");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "has_progress") {
    return (
      <ButtonLink href={`/${locale}/progress`} variant="primary">
        {t.continueLabel}
      </ButtonLink>
    );
  }

  return (
    <ButtonLink href={`/${locale}/5-klass/proporcii/trainer`} variant="primary">
      {t.startLabel}
    </ButtonLink>
  );
}
