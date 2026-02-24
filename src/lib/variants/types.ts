import type { Task } from "@/lib/tasks/schema";

export type VariantTemplateSection = {
  label: string;
  skillIds: string[];
  count: number;
  difficulty: [number, number];
};

export type VariantTemplate = {
  id: string;
  title: string;
  topicId: string;
  sections: VariantTemplateSection[];
  header: {
    gradeLabel: string;
    topicLabel: string;
  };
};

export type VariantTaskWithContent = {
  id: string;
  taskId: string;
  sectionLabel: string;
  orderIndex: number;
  task: Task;
};

export type VariantDetail = {
  id: string;
  ownerUserId: string;
  topicId: string;
  templateId: string;
  title: string;
  seed: string;
  createdAt: Date;
  tasks: VariantTaskWithContent[];
};
