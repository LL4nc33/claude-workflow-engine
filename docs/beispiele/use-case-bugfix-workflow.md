# Use Case: Systematisches Debugging mit dem Debug-Agent

Ein praxisnahes Beispiel für die Fehlersuche bei sporadischen 500er-Fehlern in einer Produktionsumgebung -- ohne den vollen 5-Phasen-Workflow.

## Szenario

Deine Express.js API gibt seit gestern sporadisch HTTP 500 Fehler zurueck. Betroffen ist der `GET /api/users/:id/profile` Endpoint. Das Problem tritt nicht bei jedem Request auf, sondern nur unter bestimmten Bedingungen, die noch unklar sind.

**Symptome:**

- Ca. 5% der Requests auf diesen Endpoint schlagen fehl
- Fehler tritt seit gestern 14:30 Uhr auf
- Monitoring zeigt keine Speicher- oder CPU-Anomalien
- Andere Endpoints sind nicht betroffen

**Frage:** Brauchst du den vollen 5-Phasen-Workflow oder reicht der Debug-Agent direkt?

---

## Entscheidung: Voller Workflow oder Debug-Agent direkt?

### Direkt den Debug-Agent nutzen wenn:

- Das Problem klar lokalisierbar ist (ein Endpoint, ein Service)
- Es sich um einen Bug handelt, nicht um ein neues Feature
- Keine grundlegenden Architekturentscheidungen noetig sind
- Der Fix voraussichtlich wenige Dateien betrifft

### Den vollen Workflow nutzen wenn:

- Der Bug auf ein grundlegendes Design-Problem hinweist
- Der Fix Aenderungen an mehreren Services/Systemen erfordert
- Neue Standards oder Patterns eingeführt werden müssen
- Das Problem wiederkehrend ist und eine architekturelle Lösung braucht

In unserem Fall: **Debug-Agent direkt.** Der Bug ist lokalisiert, wir brauchen Investigation und einen gezielten Fix.

---

## Durchlauf mit dem Debug-Agent

### Phase 1: Reflektieren

Der Debug-Agent startet mit der Situationsanalyse:

```markdown
## Situationsanalyse

- Erwartetes Verhalten: GET /api/users/:id/profile gibt 200 mit User-Profil zurueck
- Tatsaechliches Verhalten: Sporadisch 500, ca. 5% der Requests
- Beginn: Gestern 14:30 Uhr
- Reproduzierbar: Ja, aber nicht deterministisch
- Betroffener Bereich: Nur dieser eine Endpoint
```

**Erste Fragen des Debug-Agents:**

```
- Was wurde gestern um 14:30 deployt? (git log --since="yesterday 14:00")
- Gibt es neue Dependencies oder Konfigurationsaenderungen?
- Welche User-IDs sind betroffen? Alle oder bestimmte?
```

### Phase 2: Hypothesen aufstellen

```markdown
## Hypothesen (nach Wahrscheinlichkeit)

1. Null-Reference bei optionalen Profil-Feldern
   Evidenz: Sporadisch = nicht alle User betroffen, koennte an Datenunterschieden liegen

2. Race Condition bei Cache-Invalidierung
   Evidenz: Timing-abhaengig, nicht deterministisch

3. Datenbank-Connection-Pool erschoepft
   Evidenz: Wuerde sporadisches Verhalten erklaeren, aber andere Endpoints waeren auch betroffen

4. Externer Service-Timeout (z.B. Avatar-URL Validierung)
   Evidenz: Koennte netzwerkabhaengig sein, muesste in den Logs sichtbar sein
```

### Phase 3: Diagnostizieren

**Schritt 1: Git-Forensik -- Was hat sich geaendert?**

```bash
git log --oneline --since="yesterday 12:00"
```

Ergebnis:

```
a3f2c1d feat: add social links to user profile
b891e2a chore: update prisma to 5.8.0
c72d4f6 fix: typo in email template
```

Der Commit `a3f2c1d` ist verdaechtig -- er aendert genau den betroffenen Bereich.

```bash
git diff b891e2a..a3f2c1d -- src/services/user.service.ts
```

Ergebnis:

```diff
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
-     include: { profile: true }
+     include: { profile: true, socialLinks: true }
    });

+   const formattedLinks = user.socialLinks.map(link => ({
+     platform: link.platform,
+     url: link.url,
+   }));

    return {
      ...user.profile,
+     socialLinks: formattedLinks,
    };
  }
```

**Schritt 2: Hypothese 1 validieren**

Das Problem ist sichtbar: `user.socialLinks.map()` -- wenn ein User keine `socialLinks` hat, ist `user.socialLinks` entweder `null` oder `undefined` (je nach Prisma-Relation-Typ). Der `.map()`-Aufruf auf `null` wirft einen TypeError.

**Schritt 3: Beweisfuehrung**

```bash
# Welche User haben keine socialLinks?
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users u LEFT JOIN social_links sl ON u.id = sl.user_id WHERE sl.id IS NULL;"
```

Ergebnis: 847 von 16.230 Usern haben keine Social Links -- das sind ca. 5.2%, was exakt zur Fehlerrate passt.

**Log-Bestaetigung:**

```bash
grep "TypeError" logs/app-$(date +%Y-%m-%d).log | head -5
```

```
[2024-01-22 14:31:02] TypeError: Cannot read properties of null (reading 'map')
    at UserService.getProfile (src/services/user.service.ts:47:38)
    at async ProfileController.get (src/controllers/profile.controller.ts:12:20)
```

### Phase 4: Isolieren

**Minimaler Reproduktionsfall:**

```typescript
// test: User ohne socialLinks triggert den Bug
const userWithoutLinks = await prisma.user.findFirst({
  where: { socialLinks: { none: {} } }
});

const response = await request(app)
  .get(`/api/users/${userWithoutLinks.id}/profile`)
  .set("Authorization", `Bearer ${token}`);

// Erwartet: 200, Tatsaechlich: 500
expect(response.status).toBe(200);
```

**Root Cause bestaetigt:** Null-Reference auf `user.socialLinks` wenn ein User keine Social Links gespeichert hat.

### Phase 5: Fixen

**Minimaler Fix in `src/services/user.service.ts`:**

```typescript
async getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, socialLinks: true }
  });

  if (!user) {
    return null;
  }

  const formattedLinks = (user.socialLinks ?? []).map(link => ({
    platform: link.platform,
    url: link.url,
  }));

  return {
    ...user.profile,
    socialLinks: formattedLinks,
  };
}
```

Aenderungen:

1. Null-Check für den gesamten User (defensiv, war vorher auch nicht da)
2. Nullish Coalescing (`??`) für socialLinks -- leeres Array als Fallback

**Regressionstest hinzugefuegt:**

```typescript
// tests/integration/user-profile.test.ts
describe("GET /api/users/:id/profile", () => {
  it("gibt Profil ohne Social Links zurueck", async () => {
    const user = await createTestUser({ withSocialLinks: false });
    const token = generateToken(user.id);

    const res = await request(app)
      .get(`/api/users/${user.id}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.socialLinks).toEqual([]);
  });

  it("gibt Profil mit Social Links zurueck", async () => {
    const user = await createTestUser({
      withSocialLinks: true,
      links: [{ platform: "github", url: "https://github.com/testuser" }]
    });
    const token = generateToken(user.id);

    const res = await request(app)
      .get(`/api/users/${user.id}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.socialLinks).toHaveLength(1);
    expect(res.body.data.socialLinks[0].platform).toBe("github");
  });

  it("gibt 404 für nicht-existierenden User", async () => {
    const token = generateToken("existing-user-id");

    const res = await request(app)
      .get("/api/users/non-existent-uuid/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
```

---

## Bug-Report

```markdown
## Bug-Report: Sporadische 500er auf GET /api/users/:id/profile

### Symptome
Ca. 5% der Requests auf den Profile-Endpoint geben HTTP 500 zurueck.
TypeError: Cannot read properties of null (reading 'map').

### Root Cause
Commit a3f2c1d führte Social Links in den Profile-Response ein.
Der Code geht davon aus, dass jeder User socialLinks hat (non-null).
847 User haben keine Social Links, was zu einem Null-Reference-Fehler führt.

### Fix angewendet
- Nullish Coalescing Operator für socialLinks (Fallback auf leeres Array)
- Defensiver Null-Check für den gesamten User
- Datei: src/services/user.service.ts

### Praevention
- Code Review Checklist um "Null-Safety bei optionalen Relationen" erweitern
- Prisma-Relations die optional sind IMMER mit Fallback behandeln
- Standard-Regel: Neue Includes immer mit Test für "Relation existiert nicht" absichern

### Regressionstest
tests/integration/user-profile.test.ts
- Test für User ohne Social Links
- Test für User mit Social Links
- Test für nicht-existierenden User
```

---

## Ergebnis

| Schritt | Dauer | Ergebnis |
|---------|-------|----------|
| Reflektieren | 2 min | Symptome und Zeitraum dokumentiert |
| Hypothesen | 3 min | 4 Hypothesen aufgestellt |
| Diagnostizieren | 10 min | Root Cause in Commit a3f2c1d gefunden |
| Isolieren | 5 min | Reproduktionsfall erstellt |
| Fixen | 10 min | Fix + 3 Regressionstests |
| **Gesamt** | **~30 min** | Bug behoben und abgesichert |

---

## Variationen

### Race Condition statt Null-Reference

Wenn die Hypothese 2 (Race Condition) zutreffen wuerde, waere der Debugging-Ansatz anders:

- Diagnostisches Logging mit Timestamps an kritischen Stellen
- Concurrency-Tests mit mehreren parallelen Requests
- Moeglicherweise Lock-Mechanismen oder optimistic Concurrency Control

### Bug erfordert architekturelle Aenderung

Wenn der Bug aufzeigt, dass das System grundsaetzlich falsch designt ist (z.B. synchrone statt asynchrone Verarbeitung), wechsle zum vollen Workflow:

1. Debug-Agent dokumentiert das Problem und die Analyse
2. Architect-Agent erstellt ein ADR für die neue Architektur
3. Spec wird geschrieben für den Umbau
4. Tasks werden erstellt und orchestriert

### Heisenbug (verschwindet unter Beobachtung)

Bei Bugs die nur in Produktion auftreten:

- Distributed Tracing einsetzen (OpenTelemetry)
- Structured Logging mit Correlation IDs
- Feature Flags zum kontrollierten Rollback
- Canary Deployments für den Fix

---

## Verwandte Dokumentation

- [Workflow-Phasen](../workflow.md) -- Wann der volle Workflow sinnvoll ist
- [Agenten-Referenz](../agenten.md) -- Debug-Agent Capabilities
- [How-To: Neues Feature entwickeln](../how-to/neues-feature-entwickeln.md) -- Workflow-Patterns im Detail
