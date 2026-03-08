---
skill_id: math.fractions_multiplication.s1.fi
topic_id: math.fractions_multiplication
title: Дробь · целое / целое · дробь
stage: S1
kind: compute
status: draft
prerequisites:
  - math.fractions_multiplication.s0.reduce
  - math.fractions_multiplication.s1.ff
related_skills:
  - math.fractions_multiplication.s1.ff
  - math.fractions_multiplication.s1.precancel
worksheet_companions:
  - math.fractions_multiplication.s1.ff
  - math.fractions_multiplication.s2.frac_of
worksheet_formats:
  - pyatiminutka
  - kartochki
  - samostoyatelnaya
---

# Дробь · целое / целое · дробь

## Outcome
Ученик уверенно умножает обыкновенную дробь на целое число и распознает эквивалентность записей `a * b/c` и `b/c * a`.

## One-line rule
Целое число можно рассматривать как дробь со знаменателем 1, а затем действовать по правилу умножения дробей.

## Prerequisites
- [[math.fractions_multiplication.s0.reduce]]
- [[math.fractions_multiplication.s1.ff]]

## Related
- [[math.fractions_multiplication.s1.ff]]
- [[math.fractions_multiplication.s1.precancel]]

## Typical Errors
- умножает только числитель и забывает про знаменатель;
- неверно переводит целое число в дробь;
- не сокращает до умножения;
- считает, что порядок множителей меняет результат.

## Task Patterns
- дробь на маленькое целое;
- целое на дробь в перевернутой записи;
- задачи с быстрым сокращением до умножения;
- связь с нахождением дроби от числа.

## Worksheet Use
Подходит для:
- базовых карточек;
- смешанных листов вместе с `дробь · дробь`;
- короткой самостоятельной после объяснения.

## Repo Links
- [Task bank JSON](../../../../data/tasks/fractions_multiplication.json)
- [Taxonomy](../../../../docs/TAXONOMY_FRACTIONS_MULTIPLICATION.md)
- [Topic skills module](../../../../src/lib/topics/fractions-multiplication/module-data.ts)

## Search Hints
- в task bank ищите `\"skill_id\": \"math.fractions_multiplication.s1_fi\"`
- в skills module ищите `key: \"s1.fi\"`
- в taxonomy ищите `math.fractions_multiplication.s1_fi`

## Notes
Это один из самых естественных соседей для `s1.ff`, поэтому его почти всегда стоит держать рядом в листах начального уровня.
