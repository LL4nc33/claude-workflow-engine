---
name: planning
description: >
  Use PROACTIVELY when user asks to: plan, create implementation plan,
  prioritize, design architecture, scope a feature, roadmap.
  Triggers EnterPlanMode for structured planning.
---

# Planning Skill

Dieses Skill triggert den Plan-Mode fuer strukturierte Planungsaufgaben.

## Wann Plan-Mode nutzen

### Trigger-Keywords (Deutsch)

- erstelle Plan, Implementierungsplan, Planungsdokument
- priorisiere, Prioritaeten setzen
- entwerfe Architektur, Systemdesign
- scope, Umfang definieren
- Roadmap, Meilensteine
- Phase planen, Reihenfolge festlegen

### Trigger-Keywords (Englisch)

- plan, implementation plan, planning document
- prioritize, set priorities
- design architecture, system design
- scope, define scope
- roadmap, milestones
- phase planning, sequence

## Kriterien fuer Plan-Mode

### NUTZE EnterPlanMode wenn:

1. **Multi-Step Task** (>3 Dateien betroffen)
   - Feature-Implementierung
   - Refactoring ueber mehrere Module
   - Migration von Daten/APIs

2. **Architektur-Entscheidungen**
   - Neues System-Design
   - Technologie-Wahl
   - API-Design

3. **Unklarer Scope**
   - "Verbessere die Performance"
   - "Mach das skalierbarer"
   - Exploratorische Aufgaben

4. **Cross-Domain Work**
   - Frontend + Backend + Database
   - Infrastruktur + Code
   - Security + Implementation

### NUTZE NICHT EnterPlanMode wenn:

1. **Single-File Fix**
   - Typo korrigieren
   - Einfacher Bug in einer Datei
   - Kleine Aenderung (<50 Zeilen)

2. **Expliziter Command**
   - User hat /workflow:* Command verwendet
   - User sagt "mach einfach"
   - Klare, spezifische Anweisung

3. **Erklaerung/Frage**
   - "Was macht dieser Code?"
   - "Erklaere mir X"
   - Reine Information, keine Aenderung

## Aktion bei Trigger

Wenn ein Planning-Keyword erkannt wird:

```
1. Pruefe ob Kriterien fuer Plan-Mode erfuellt
2. Wenn ja:
   → Rufe EnterPlanMode auf
   → Sage dem User: "Das ist eine Planungsaufgabe. Ich wechsle in den Plan-Mode um einen strukturierten Ansatz zu entwickeln."
3. Wenn nein:
   → Fahre normal fort (ggf. Auto-Delegation)
```

## Beispiele

### Plan-Mode aktivieren

```
User: "Erstelle einen Implementierungsplan fuer das neue Auth-System"
→ EnterPlanMode (Multi-Step, Architektur)

User: "Wie sollen wir das Datenmodell designen?"
→ EnterPlanMode (Architektur-Entscheidung)

User: "Plane die Migration zu TypeScript"
→ EnterPlanMode (Multi-Step, Cross-Domain)

User: "Priorisiere die naechsten Features"
→ EnterPlanMode (Roadmap/Planung)
```

### NICHT Plan-Mode

```
User: "Fix den Typo in der README"
→ Direkt fixen (Single-File, trivial)

User: "/workflow:create-tasks"
→ Expliziter Command, kein Plan-Mode

User: "Erklaere mir wie das Auth funktioniert"
→ Delegiere an explainer (Erklaerung, keine Aenderung)
```

## Integration mit Workflow

Der Plan-Mode produziert einen Plan der dann via:
- `/workflow:create-tasks` → Tasks erstellt
- `/workflow:orchestrate-tasks` → Tasks ausgefuehrt

werden kann. Das gewaehrleistet strukturiertes Vorgehen.
