# HWR Novice

Studienbegleiter für Studierende der HWR Berlin: Stundenplan, Termine, Module und Lern-Timer in einer Web-App.
Entstanden im Modul Software-Engineering (Gruppe F).

## Schnellstart: Live-Instanz (empfohlen)

**https://hwr-novice.apps.it25a.de**

- **Demo-Login:** `Jonas` / `demo-passwort`. Jonas ist ein Demo-Student des Kurses IT25A mit Stundenplan, Modulen, Terminen und Lernhistorie. Er darf gern zum Testen genutzt werden. Seine Daten werden täglich um 12:30 und 22:30 Uhr zurückgesetzt und aufgefrischt, eigene Änderungen gehen dabei verloren.
- **Eigener Account:** Über „Registrieren" kann zusätzlich ein neuer Account angelegt werden, um die Einrichtung selbst zu erleben.
- **Kurs IT25A:** Für diesen Kurs sind der vollständige Stundenplan und die Module des Semesters hinterlegt. Dadurch kommen Dashboard und Diagramme (Studienfortschritt, Semesterverlauf, Fokuszeit) am besten zur Geltung. Für andere Informatik-Jahrgänge (2024, 2026) sind nur die Module hinterlegt, bei allen übrigen Kursen legt man sie selbst an.
- **Android:** Dieselbe URL im Browser öffnen. Die Oberfläche ist primär für den Desktop gestaltet und mobil noch nicht überall optimiert.

## Lokal mit Docker

Voraussetzung: Docker. Ein Befehl startet die App (das Image wird automatisch geladen):

```sh
docker run --name hwr-novice -p 3000:3000 -e ORIGIN=http://localhost:3000 -e DATABASE_URL=/data/app.db -e TZ=Europe/Berlin -v hwr-novice-data:/data ghcr.io/it25a/sem3-se-group-f-hwr-novice/app:main-94c3a9c
```

Danach **http://localhost:3000** öffnen (nicht `127.0.0.1`, sonst lehnt die App Formulare ab) und einen Account registrieren.
Optional kann in einem zweiten Terminal der Demo-User wie auf der Live-Instanz angelegt werden:

```sh
docker exec hwr-novice node scripts/seed-demo.js
docker exec hwr-novice node scripts/set-asta.js Jonas on
```

Beenden mit `Strg+C`, späterer Neustart mit `docker start hwr-novice`. Die Daten bleiben im Volume erhalten.

## AStA-Berechtigung

Im Kalender gibt es drei Termintypen: privat, kursintern und öffentlich. **Öffentliche Termine dürfen nur AStA-Mitglieder anlegen und löschen.**
Standardmäßig hat niemand diese Rolle. Auf der Live-Instanz ist sie dem Demo-User `Jonas` zugewiesen. Lokal vergibt man sie mit:

```sh
docker exec hwr-novice node scripts/set-asta.js <Benutzername> on
```

(`off` entzieht die Rolle wieder.)

## Funktionen

- **Dashboard:** Tagesagenda, Studienfortschritt, Klausuren, Fokuszeit, Selbststudium und Semesterverlauf
- **Kalender:** Stundenplan der HWR sowie private, kursinterne und öffentliche Termine, mit iCal-Feed für externe Kalender-Apps
- **Module:** Module des Semesters mit Prüfungsterminen und Bestehensstatus
- **Pomodoro:** Lern-Timer mit Verlauf, die Zeit wird Modulen zugeordnet
- **Einstellungen:** Kurs, iCal-Feed und Timer-Dauern

## Technik

SvelteKit 3 (Svelte 5) · TypeScript · SQLite mit Drizzle ORM · Docker

## Abgabe und Team

UML-Diagramm, Aufwandsschätzung und Präsentationsfolien werden separat abgegeben.

**Team (Gruppe F):** Melvin Focke, Finn Margraf, Oleksii Khmara, Marc-Michel Münch
