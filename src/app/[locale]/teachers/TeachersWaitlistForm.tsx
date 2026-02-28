"use client";

import { useState } from "react";

type FormState = {
  email: string;
  role: "teacher" | "tutor" | "school_admin" | "parent";
};

export default function TeachersWaitlistForm() {
  const [form, setForm] = useState<FormState>({
    email: "",
    role: "teacher",
  });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success-soft)] p-5 text-[var(--success)]">
        <h2 className="text-lg font-semibold">Спасибо, мы свяжемся</h2>
        <p className="mt-2 text-sm leading-6">
          Вы в списке раннего доступа. Напишем, когда откроем материалы для учителей.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div>
        <label htmlFor="teachers-email" className="mb-1 block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          id="teachers-email"
          type="email"
          required
          placeholder="teacher@example.com"
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              email: event.target.value,
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[var(--primary)]"
        />
      </div>

      <div>
        <label htmlFor="teachers-role" className="mb-1 block text-sm font-medium text-slate-800">
          Роль
        </label>
        <select
          id="teachers-role"
          value={form.role}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              role: event.target.value as FormState["role"],
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--primary)]"
        >
          <option value="teacher">Учитель</option>
          <option value="tutor">Репетитор</option>
          <option value="school_admin">Администратор школы</option>
          <option value="parent">Родитель</option>
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Получить ранний доступ
      </button>
    </form>
  );
}

