"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  TopicMapNode,
  TopicSkillPath,
  TopicSkillStepRef,
} from "@/src/lib/topicMaps";

type SkillStepperNode = Pick<TopicMapNode, "id" | "title" | "status"> & {
  href?: string;
};

type SkillStepperProps = {
  nodes: SkillStepperNode[];
  path: TopicSkillPath;
  onSelectSkill?: (id: string) => void;
};

function buildDefaultBranchChoices(path: TopicSkillPath) {
  const choices: Record<string, string> = {};

  const walk = (steps: TopicSkillStepRef[]) => {
    for (const step of steps) {
      if (step.type === "branch") {
        const first = step.options[0];
        if (first) {
          choices[step.id] = first.key;
          for (const option of step.options) {
            walk(option.steps);
          }
        }
      }
    }
  };

  walk(path.steps);
  return choices;
}

function alphaLabel(index: number) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

export function SkillStepper({ nodes, path, onSelectSkill }: SkillStepperProps) {
  const router = useRouter();
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const [branchChoice, setBranchChoice] = useState<Record<string, string>>(() =>
    buildDefaultBranchChoices(path),
  );
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  function selectSkill(nodeId: string) {
    const node = nodeMap.get(nodeId);
    if (!node || node.status === "soon") return;
    setActiveSkillId(nodeId);
  }

  function openSkill(nodeId: string) {
    const node = nodeMap.get(nodeId);
    if (!node || node.status === "soon") return;
    setActiveSkillId(nodeId);
    if (node.href) {
      router.push(node.href);
      return;
    }
    onSelectSkill?.(nodeId);
  }

  function renderSkillStep(
    step: Extract<TopicSkillStepRef, { type: "skill" }>,
    label: string,
    nested = false,
    showConnector = false,
  ) {
    const node = nodeMap.get(step.id);
    if (!node) return null;

    const disabled = node.status === "soon";
    const active = activeSkillId === step.id;

    return (
      <li key={`${nested ? "nested" : "main"}-${label}-${step.id}`} className="relative">
        {showConnector ? (
          <span className="pointer-events-none absolute left-3.5 top-8 h-[calc(100%+8px)] w-px bg-slate-300" />
        ) : null}
        <div className={nested ? "pl-6" : ""}>
          <div className="flex items-start gap-3">
            <span
              className={[
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                active
                  ? "bg-[var(--primary)] text-white"
                  : "bg-slate-900 text-white",
              ].join(" ")}
            >
              {label}
            </span>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => selectSkill(step.id)}
                className={[
                  "w-full rounded-xl border bg-white px-3 py-2 text-left transition-colors",
                  disabled
                    ? "cursor-not-allowed border-slate-200 text-slate-400"
                    : active
                      ? "border-[var(--border)] bg-[var(--info)] text-slate-900"
                      : "border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-5">{node.title}</span>
                  {disabled ? (
                    <span className="shrink-0 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Скоро
                    </span>
                  ) : null}
                </div>
              </button>
              {active && !disabled && node.href ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => openSkill(step.id)}
                    className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--info)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                  >
                    Тренировать этот навык
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </li>
    );
  }

  function renderBranchStep(
    step: Extract<TopicSkillStepRef, { type: "branch" }>,
    label: string,
    showConnector: boolean,
  ) {
    const selectedKey = branchChoice[step.id] ?? step.options[0]?.key;
    const selectedOption = step.options.find((option) => option.key === selectedKey) ?? step.options[0];

    return (
      <li key={`branch-${step.id}`} className="relative">
        {showConnector ? (
          <span className="pointer-events-none absolute left-3.5 top-8 h-[calc(100%+8px)] w-px bg-slate-300" />
        ) : null}
        <div className="flex items-start gap-3">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {label}
          </span>
          <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">Выбери ветку:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {step.options.map((option) => {
                const active = option.key === selectedOption?.key;
                return (
                  <button
                    key={`${step.id}:${option.key}`}
                    type="button"
                    onClick={() =>
                      setBranchChoice((prev) => ({
                        ...prev,
                        [step.id]: option.key,
                      }))
                    }
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-[var(--primary)] bg-[var(--info)] text-[var(--primary)]"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {selectedOption ? (
              <div className="mt-3 rounded-xl border border-white bg-white p-3">
                <ol className="space-y-2">
                  {selectedOption.steps.map((nestedStep, nestedIndex) => {
                    if (nestedStep.type !== "skill") return null;
                    return renderSkillStep(
                      nestedStep,
                      `${alphaLabel(step.options.findIndex((o) => o.key === selectedOption.key))}${nestedIndex + 1}`,
                      true,
                      false,
                    );
                  })}
                </ol>
              </div>
            ) : null}

            {step.convergeTo ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Общий следующий шаг
                </p>
                <ol>
                  {renderSkillStep({ type: "skill", id: step.convergeTo }, `${label}→`, false, false)}
                </ol>
              </div>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        Путь навыков
      </h4>
      <p className="mt-1 text-xs text-slate-500">
        Иди сверху вниз. На развилке выбери ветку.
      </p>

      <ol className="mt-4 space-y-3">
        {path.steps.map((step, index) =>
          step.type === "skill"
            ? renderSkillStep(step, String(index + 1), false, index < path.steps.length - 1)
            : renderBranchStep(step, String(index + 1), index < path.steps.length - 1),
        )}
      </ol>
    </div>
  );
}
