import type { SkillKind } from "@/src/lib/skills/kind";

export type FractionsMultiplicationStage = "S0" | "S1" | "S2" | "S3" | "S4" | "S5";

export type FractionsMultiplicationSkill = {
  key: string;
  id: string;
  title: string;
  stage: FractionsMultiplicationStage;
  kind: SkillKind;
  summary: string;
};

const TOPIC_ID = "math.fractions_multiplication";

function makeSkillId(key: string) {
  return `${TOPIC_ID}.${key.replace(/\./g, "_")}`;
}

export const fractionsMultiplicationSkills: FractionsMultiplicationSkill[] = [
  { key: "s0.reduce", id: makeSkillId("s0.reduce"), title: "Сокращение дробей", stage: "S0", kind: "compute", summary: "НОД и сокращение дробей." },
  { key: "s0.mixed", id: makeSkillId("s0.mixed"), title: "Смешанное ↔ неправильная дробь", stage: "S0", kind: "compute", summary: "Перевод смешанных чисел в неправильные дроби и обратно." },
  { key: "s0.decimal", id: makeSkillId("s0.decimal"), title: "Десятичная ↔ дробь", stage: "S0", kind: "compute", summary: "Типовые переходы между десятичными и обыкновенными дробями." },
  { key: "s0.addsub", id: makeSkillId("s0.addsub"), title: "Сложение и вычитание дробей", stage: "S0", kind: "compute", summary: "Базовые операции с дробями." },
  { key: "s0.like_terms", id: makeSkillId("s0.like_terms"), title: "Подобные слагаемые ax+bx", stage: "S0", kind: "algebra", summary: "Сбор коэффициентов при одной переменной." },

  { key: "s1.ff", id: makeSkillId("s1.ff"), title: "Дробь · дробь", stage: "S1", kind: "compute", summary: "Умножение обыкновенных дробей с сокращением результата." },
  { key: "s1.fi", id: makeSkillId("s1.fi"), title: "Дробь · целое / целое · дробь", stage: "S1", kind: "compute", summary: "Умножение дроби на целое число." },
  { key: "s1.precancel", id: makeSkillId("s1.precancel"), title: "Предварительное сокращение", stage: "S1", kind: "compute", summary: "Сокращение множителей до перемножения." },
  { key: "s1.mf", id: makeSkillId("s1.mf"), title: "Смешанное · дробь", stage: "S1", kind: "compute", summary: "Умножение через перевод смешанного числа." },
  { key: "s1.mm", id: makeSkillId("s1.mm"), title: "Смешанное · смешанное", stage: "S1", kind: "compute", summary: "Умножение двух смешанных чисел." },
  { key: "s1.dec_mul", id: makeSkillId("s1.dec_mul"), title: "Умножение с десятичным множителем", stage: "S1", kind: "compute", summary: "Перевод десятичного множителя в дробь и вычисление." },
  { key: "s1.multi_factor", id: makeSkillId("s1.multi_factor"), title: "Цепочка из 2–3 множителей", stage: "S1", kind: "expression", summary: "Удобный порядок и сокращение при нескольких множителях." },
  { key: "s1.order_ops", id: makeSkillId("s1.order_ops"), title: "Порядок действий в выражениях", stage: "S1", kind: "expression", summary: "Скобки, умножение и сложение/вычитание в одном выражении." },

  { key: "s2.frac_of", id: makeSkillId("s2.frac_of"), title: "Дробь от числа", stage: "S2", kind: "apply", summary: "Нахождение m/n от числа через умножение." },
  { key: "s2.percent_of", id: makeSkillId("s2.percent_of"), title: "Процент от числа", stage: "S2", kind: "apply", summary: "Переход от процента к дроби и вычисление." },
  { key: "s2.dist_law", id: makeSkillId("s2.dist_law"), title: "(a±b)·N и распределительный закон", stage: "S2", kind: "expression", summary: "Рациональные преобразования для вычислений." },
  { key: "s2.factor_common", id: makeSkillId("s2.factor_common"), title: "ab+cb=(a+c)b", stage: "S2", kind: "expression", summary: "Вынос общего множителя в числовых и дробных выражениях." },

  { key: "s3.lin_coeff", id: makeSkillId("s3.lin_coeff"), title: "Коэффициенты при x", stage: "S3", kind: "algebra", summary: "Сбор коэффициентов с дробными числами." },
  { key: "s3.lin_a", id: makeSkillId("s3.lin_a"), title: "Упростить и подставить a", stage: "S3", kind: "algebra", summary: "Упрощение p/a-q/a и вычисление значения." },
  { key: "s3.parens_a", id: makeSkillId("s3.parens_a"), title: "Скобки с дробными коэффициентами", stage: "S3", kind: "algebra", summary: "Преобразование pa-(qa-ra) с последующей подстановкой." },
  { key: "s3.subst_hard", id: makeSkillId("s3.subst_hard"), title: "Подстановка неудобных значений", stage: "S3", kind: "algebra", summary: "Подстановка десятичных и сокращаемых дробей." },

  { key: "s4.eq_factor", id: makeSkillId("s4.eq_factor"), title: "(px+qx)·N=M", stage: "S4", kind: "equation", summary: "Линейные уравнения с внешним множителем." },
  { key: "s4.eq_parens", id: makeSkillId("s4.eq_parens"), title: "N·(px−qx)=M", stage: "S4", kind: "equation", summary: "Уравнения со скобками и внешним множителем." },
  { key: "s4.eq_decimal", id: makeSkillId("s4.eq_decimal"), title: "Уравнения с десятичными коэффициентами", stage: "S4", kind: "equation", summary: "Решение уравнений с десятичными/смешанными коэффициентами." },

  { key: "s5.price", id: makeSkillId("s5.price"), title: "Цена·количество", stage: "S5", kind: "word", summary: "Текстовые задачи на стоимость и остаток денег." },
  { key: "s5.speed", id: makeSkillId("s5.speed"), title: "Путь = скорость·время", stage: "S5", kind: "word", summary: "Текстовые задачи на движение." },
  { key: "s5.remain_frac", id: makeSkillId("s5.remain_frac"), title: "Осталось после доли", stage: "S5", kind: "word", summary: "N·(1-m/n) в прикладных сюжетах." },
  { key: "s5.seq_frac", id: makeSkillId("s5.seq_frac"), title: "Последовательные доли", stage: "S5", kind: "word", summary: "Доля от целого, затем доля от остатка." },
  { key: "s5.geometry_basic", id: makeSkillId("s5.geometry_basic"), title: "Геометрия с дробями", stage: "S5", kind: "word", summary: "Периметр и длины с дробными связями." },
  { key: "s5.area", id: makeSkillId("s5.area"), title: "Площадь и прикладная геометрия", stage: "S5", kind: "word", summary: "Площади с цепочками долей в текстовых задачах." },
  { key: "s5.volume", id: makeSkillId("s5.volume"), title: "Объём параллелепипеда", stage: "S5", kind: "word", summary: "V=a·b·c с дробями и смешанными числами." },
];

export const fractionsMultiplicationSkillIdByKey = new Map(
  fractionsMultiplicationSkills.map((skill) => [skill.key, skill.id] as const),
);
