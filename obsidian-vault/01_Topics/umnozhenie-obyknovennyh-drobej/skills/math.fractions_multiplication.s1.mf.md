---
skill_id: math.fractions_multiplication.s1.mf
topic_id: math.fractions_multiplication
title: Смешанное · дробь
stage: S1
kind: compute
status: draft
prerequisites:
  - math.fractions_multiplication.s0.reduce
  - math.fractions_multiplication.s1.ff
  - math.fractions_multiplication.s1.precancel
related_skills:
  - math.fractions_multiplication.s1.mm
  - math.fractions_multiplication.s1.precancel
worksheet_companions:
  - math.fractions_multiplication.s1.precancel
  - math.fractions_multiplication.s1.mm
worksheet_formats:
  - kartochki
  - samostoyatelnaya
  - kontrolnaya
---

# Смешанное · дробь

## Outcome
Ученик переводит смешанное число в неправильную дробь и после этого без ошибки выполняет умножение.

## One-line rule
Сначала переводим смешанное число в неправильную дробь, затем умножаем как обычные дроби и сокращаем результат.

## Prerequisites
- [[math.fractions_multiplication.s0.reduce]]
- [[math.fractions_multiplication.s1.ff]]
- [[math.fractions_multiplication.s1.precancel]]

## Related
- [[math.fractions_multiplication.s1.precancel]]
- `math.fractions_multiplication.s1.mm`

## Typical Errors
- неверно переводит смешанное число;
- забывает сохранить целую часть в числителе;
- умножает целую часть отдельно от дробной;
- не сокращает после перевода.

## Task Patterns
- смешанное число на правильную дробь;
- смешанное число на неправильную дробь;
- задачи с удобным сокращением после перевода;
- пары задач `смешанное · дробь` и `смешанное · смешанное`.

## Worksheet Use
Подходит для:
- средней карточки;
- самостоятельной второй волны;
- контрольного листа как переход к более тяжелым вычислениям.

## Repo Links
- [Task bank JSON](../../../../data/tasks/fractions_multiplication.json)
- [Taxonomy](../../../../docs/TAXONOMY_FRACTIONS_MULTIPLICATION.md)
- [Topic skills module](../../../../src/lib/topics/fractions-multiplication/module-data.ts)

## Search Hints
- в task bank ищите `\"skill_id\": \"math.fractions_multiplication.s1_mf\"`
- в skills module ищите `key: \"s1.mf\"`
- в taxonomy ищите `math.fractions_multiplication.s1_mf`

## Notes
Этот навык стоит давать только после устойчивого понимания `дробь · дробь`; иначе ученик тонет не в умножении, а в переводе смешанных чисел.
