---
skill_id: math.fractions_multiplication.s1.precancel
topic_id: math.fractions_multiplication
title: Предварительное сокращение
stage: S1
kind: compute
status: draft
prerequisites:
  - math.fractions_multiplication.s0.reduce
  - math.fractions_multiplication.s1.ff
related_skills:
  - math.fractions_multiplication.s1.ff
  - math.fractions_multiplication.s1.fi
worksheet_companions:
  - math.fractions_multiplication.s1.ff
  - math.fractions_multiplication.s1.mf
worksheet_formats:
  - kartochki
  - samostoyatelnaya
  - kontrolnaya
---

# Предварительное сокращение

## Outcome
Ученик умеет сокращать множители до умножения и понимает, зачем это уменьшает вычислительную нагрузку.

## One-line rule
Если числитель одной дроби и знаменатель другой имеют общий делитель, их можно сократить до умножения.

## Prerequisites
- [[math.fractions_multiplication.s0.reduce]]
- [[math.fractions_multiplication.s1.ff]]

## Related
- [[math.fractions_multiplication.s1.ff]]
- [[math.fractions_multiplication.s1.fi]]
- [[math.fractions_multiplication.s1.mf]]

## Typical Errors
- сокращает числа внутри одной дроби не по правилу;
- сокращает после того, как уже неправильно перемножил;
- сокращает числитель с числителем;
- боится сокращать до умножения и перегружает вычисления.

## Task Patterns
- простая пара дробей с очевидным общим делителем;
- умножение дроби на целое с быстрым сокращением;
- случаи, где без предварительного сокращения вычисления громоздкие;
- смешанные числа после перевода.

## Worksheet Use
Подходит для:
- средней тренировки;
- усиления карточек перед самостоятельной;
- контрольных листов как индикатор осознанности.

## Repo Links
- [Task bank JSON](../../../../data/tasks/fractions_multiplication.json)
- [Taxonomy](../../../../docs/TAXONOMY_FRACTIONS_MULTIPLICATION.md)
- [Topic skills module](../../../../src/lib/topics/fractions-multiplication/module-data.ts)

## Search Hints
- в task bank ищите `\"skill_id\": \"math.fractions_multiplication.s1_precancel\"`
- в skills module ищите `key: \"s1.precancel\"`
- в taxonomy ищите `math.fractions_multiplication.s1_precancel`

## Notes
Этот навык часто отделяет механическое умножение от реально грамотного счета, поэтому его стоит явно отслеживать в контрольных листах.
