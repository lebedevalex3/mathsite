---
skill_id: math.fractions_multiplication.s1.ff
topic_id: math.fractions_multiplication
title: Дробь · дробь
stage: S1
kind: compute
status: ready
prerequisites:
  - math.fractions_multiplication.s0.reduce
related_skills:
  - math.fractions_multiplication.s1.fi
  - math.fractions_multiplication.s1.precancel
worksheet_companions:
  - math.fractions_multiplication.s1.fi
  - math.fractions_multiplication.s1.precancel
worksheet_formats:
  - pyatiminutka
  - kartochki
  - samostoyatelnaya
---

# Дробь · дробь

## Outcome
Ученик умеет умножать обыкновенную дробь на обыкновенную дробь и сокращать результат.

## One-line rule
Чтобы умножить дробь на дробь, нужно умножить числители, умножить знаменатели и затем сократить результат.

## Prerequisites
- [[math.fractions_multiplication.s0.reduce]]

## Related
- [[math.fractions_multiplication.s1.fi]]
- [[math.fractions_multiplication.s1.precancel]]

## Typical Errors
- умножает числитель на знаменатель;
- забывает сократить;
- неправильно работает со смешанными числами;
- сокращает не те множители.

## Task Patterns
- простая дробь на дробь;
- результат меньше 1;
- результат больше 1;
- сокращение только в ответе;
- сокращение до умножения.

## Worksheet Use
Подходит для:
- пятиминутки;
- базовых карточек;
- первой самостоятельной.

## Repo Links
- [Task bank JSON](../../../../data/tasks/fractions_multiplication.json)
- [Taxonomy](../../../../docs/TAXONOMY_FRACTIONS_MULTIPLICATION.md)
- [Topic skills module](../../../../src/lib/topics/fractions-multiplication/module-data.ts)
- [SEO topic JSON](../../../../content/seo/topics/ru/umnozhenie-obyknovennyh-drobej.json)

## Search Hints
- в task bank ищите `\"skill_id\": \"math.fractions_multiplication.s1_ff\"`
- в skills module ищите `key: \"s1.ff\"`
- в taxonomy ищите `math.fractions_multiplication.s1_ff`
- в SEO worksheets ищите листы, где этот навык должен быть покрыт вручную

## Ready Criteria
- есть хороший набор задач разных уровней;
- покрыты простые и сокращаемые случаи;
- понятны соседние навыки для смешанного листа.

## Notes
Это центральный skill темы. Вокруг него строится первая витрина листов.
