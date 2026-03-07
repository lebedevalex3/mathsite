import assert from "node:assert/strict";

import puppeteer from "puppeteer";

type ApiResult<T = unknown> = {
  status: number;
  body: T;
};

async function main() {
  const baseUrl = process.env.E2E_BASE_URL?.trim() || "http://localhost:3011";
  const marker = `E2E admin task ${Date.now()}`;
  const email = `e2e.admin.${Date.now()}@example.com`;
  const password = "e2e-password-123";

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(90_000);
  page.setDefaultNavigationTimeout(120_000);

  let csrfToken = "";
  let topicId = "";
  let createdTaskId = "";

  try {
    process.stdout.write("E2E step: open home\n");
    await page.goto(`${baseUrl}/ru`, { waitUntil: "domcontentloaded" });

    const session = await page.evaluate(async () => {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" });
      const payload = (await response.json()) as { csrfToken?: string };
      return {
        csrfToken: payload.csrfToken ?? "",
      };
    });
    csrfToken = session.csrfToken;
    assert.ok(csrfToken, "csrf token is required");

    process.stdout.write("E2E step: sign up\n");
    const signUp = await page.evaluate(
      async (params): Promise<ApiResult<{ ok?: boolean; message?: string }>> => {
        const response = await fetch("/api/auth/sign-up", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": params.csrfToken,
          },
          body: JSON.stringify({
            email: params.email,
            password: params.password,
          }),
        });
        return {
          status: response.status,
          body: (await response.json()) as { ok?: boolean; message?: string },
        };
      },
      { csrfToken, email, password },
    );
    assert.equal(signUp.status, 200, `sign-up failed: ${JSON.stringify(signUp.body)}`);

    process.stdout.write("E2E step: promote admin\n");
    const promote = await page.evaluate(
      async (params): Promise<ApiResult<{ ok?: boolean; code?: string; message?: string }>> => {
        const response = await fetch("/api/admin/become", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "x-csrf-token": params.csrfToken,
          },
        });
        return {
          status: response.status,
          body: (await response.json()) as { ok?: boolean; code?: string; message?: string },
        };
      },
      { csrfToken },
    );
    assert.equal(promote.status, 200, `admin promotion failed: ${JSON.stringify(promote.body)}`);

    process.stdout.write("E2E step: open admin page\n");
    await page.goto(`${baseUrl}/ru/admin`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.innerText.includes("Банк задач"));

    process.stdout.write("E2E step: select topic\n");
    topicId = await page.evaluate(() => {
      const section = [...document.querySelectorAll("section")].find((item) =>
        item.querySelector("h2")?.textContent?.includes("Банк задач"),
      );
      if (!section) throw new Error("task bank section not found");

      const selects = [...section.querySelectorAll("select")];
      const topicSelect = selects.find((select) =>
        [...select.querySelectorAll("option")].some((option) => option.value === "all"),
      ) as HTMLSelectElement | undefined;
      if (!topicSelect) throw new Error("topic select not found");

      const topicOption = [...topicSelect.querySelectorAll("option")].find((option) => option.value !== "all");
      if (!topicOption?.value) throw new Error("topic options are empty");

      topicSelect.value = topicOption.value;
      topicSelect.dispatchEvent(new Event("change", { bubbles: true }));
      return topicOption.value;
    });
    assert.ok(topicId, "topic should be selected");

    process.stdout.write("E2E step: select skill\n");
    const skillId = await page.waitForFunction(() => {
      const section = [...document.querySelectorAll("section")].find((item) =>
        item.querySelector("h2")?.textContent?.includes("Банк задач"),
      );
      if (!section) return "";

      const skillSelect = [...section.querySelectorAll("select")].find((select) =>
        [...select.querySelectorAll("option")].some((option) => option.textContent?.includes("Выберите навык")),
      ) as HTMLSelectElement | undefined;
      if (!skillSelect) return "";

      const firstSkillOption = [...skillSelect.querySelectorAll("option")].find((option) => option.value);
      if (!firstSkillOption?.value) return "";

      skillSelect.value = firstSkillOption.value;
      skillSelect.dispatchEvent(new Event("change", { bubbles: true }));
      return firstSkillOption.value;
    });
    assert.ok(skillId, "skill should be selected");

    const statementSelector = 'textarea[placeholder="Условие (Markdown + LaTeX)"]';
    process.stdout.write("E2E step: fill statement and create\n");
    await page.waitForSelector(statementSelector);
    await page.type(statementSelector, marker);

    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find(
        (item) => item.textContent?.trim() === "Создать задачу",
      ) as HTMLButtonElement | undefined;
      if (!button) throw new Error("create button not found");
      button.click();
    });

    await page.waitForFunction(
      (statement) => document.body.innerText.includes(statement),
      {},
      marker,
    );

    process.stdout.write("E2E step: verify created task and cleanup\n");
    const lookup = await page.evaluate(
      async (params): Promise<ApiResult<{ tasks?: Array<{ id: string; statement_md: string }> }>> => {
        const url = new URL("/api/admin/tasks", window.location.origin);
        url.searchParams.set("topicId", params.topicId);
        const response = await fetch(url.toString(), { credentials: "same-origin" });
        return {
          status: response.status,
          body: (await response.json()) as { tasks?: Array<{ id: string; statement_md: string }> },
        };
      },
      { topicId },
    );
    assert.equal(lookup.status, 200, `task lookup failed: ${JSON.stringify(lookup.body)}`);

    createdTaskId =
      lookup.body.tasks?.find((task) => task.statement_md.includes(marker))?.id ?? "";
    assert.ok(createdTaskId, "created task id should be found");

    const cleanup = await page.evaluate(
      async (params): Promise<ApiResult<{ ok?: boolean; message?: string }>> => {
        const response = await fetch(`/api/admin/tasks/${encodeURIComponent(params.taskId)}`, {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "x-csrf-token": params.csrfToken,
          },
        });
        return {
          status: response.status,
          body: (await response.json()) as { ok?: boolean; message?: string },
        };
      },
      { taskId: createdTaskId, csrfToken },
    );
    assert.equal(cleanup.status, 200, `cleanup failed: ${JSON.stringify(cleanup.body)}`);

    // Signal for wrapper script and CI logs.
    process.stdout.write(`E2E_ADMIN_CREATE_TASK_OK topic=${topicId} task=${createdTaskId}\n`);
  } finally {
    await browser.close();
  }
}

void main().catch((error) => {
  process.stderr.write(`E2E_ADMIN_CREATE_TASK_FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
