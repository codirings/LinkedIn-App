# LinkedInApp

A React Native (CLI, no Expo) app with Firebase Auth / Firestore and Google Sign-In.
These instructions work on **Windows, macOS and Linux**. iOS builds need macOS.

## 1. Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Node.js | 22.11 or newer (`.nvmrc` pins 22) | everything |
| npm | ships with Node | everything |
| JDK | 17 or newer | Android |
| Android Studio (SDK + an emulator or a USB device) | current | Android |
| Xcode, Ruby, CocoaPods (via Bundler) | current | iOS, macOS only |

Set `ANDROID_HOME` so Gradle can find the SDK (no `local.properties` is shipped; Android Studio creates one for you when you open `android/`, or use the variable):

```sh
# macOS / Linux  (add to ~/.zshrc or ~/.bashrc)
export ANDROID_HOME="$HOME/Library/Android/sdk"   # macOS
export ANDROID_HOME="$HOME/Android/Sdk"           # Linux
export PATH="$PATH:$ANDROID_HOME/platform-tools"
```
```powershell
# Windows (PowerShell, then restart the terminal)
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
```

Full environment guide: https://reactnative.dev/docs/set-up-your-environment

## 2. Unzip

```sh
# macOS / Linux
unzip dev-3-linkedin.zip && cd dev/LinkedInApp
```
```powershell
# Windows (PowerShell) - or right-click > Extract All
Expand-Archive dev-3-linkedin.zip -DestinationPath . ; cd dev\LinkedInApp
```

> **Windows:** unzip to a short path such as `C:\dev` (native builds break on very long paths).

## 3. Install dependencies

```sh
npm install
```

This also creates your local `.env` and generates `src/config/env.generated.js` (see step 4).
iOS only (macOS):

```sh
bundle install
npm run pod-install
```

## 4. Configure environment variables

```sh
cp .env.example .env        # macOS / Linux   (npm install already did this if .env was missing)
copy .env.example .env      # Windows cmd
```

| Variable | Description |
| --- | --- |
| `GOOGLE_WEB_CLIENT_ID` | OAuth **Web** client ID used by Google Sign-In. Defaults to the project's existing Firebase client. |

`.env` is git-ignored. After editing it, run `npm run env` (it also runs automatically before `npm start`, `npm run android`, `npm run ios` and `npm test`).

Firebase (Android): `android/app/google-services.json` is included. To use your **own** Firebase project, register an Android app with package name `com.virevo` plus your debug SHA-1 (`keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`), replace that file, and update `GOOGLE_WEB_CLIENT_ID`.
Firebase (iOS): add your `GoogleService-Info.plist` to `ios/LinkedInApp` and initialise Firebase in `AppDelegate.swift`; this is not configured in the repo yet.

## 5. Run

Use two terminals from the project root.

```sh
npm start            # terminal 1 - Metro bundler
npm run android      # terminal 2 - Android emulator/device (start the emulator first or plug in a device with USB debugging)
npm run ios          # terminal 2 - iOS simulator (macOS only)
```

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run env` | Regenerate config from `.env` |
| `npm run gradle -- clean` | Run any Gradle task with the right wrapper per OS (`gradlew.bat` on Windows) |
| `npm start -- --reset-cache` | Start Metro with a clean cache |
| `npm run lint` / `npm test` | ESLint / Jest |

## Admin dashboard

Admins get an **Admin dashboard** button on their own Profile screen, which opens the `Admin` route. The route is only registered for admins and the screen re-checks the role.

- **Who is an admin:** anyone with a document at `admins/{their uid}` in Firestore. Add it in the Firebase console (any fields, e.g. `{ email: "you@example.com" }`).
- **Widgets:** system metrics (user and post counts), site settings (`settings/site`: `postingEnabled`, `maintenanceMode`), user management (search, disable/enable), the job catalog loader, and post moderation (remove posts).
- **Security:** the client check only hides the UI. Enforce access in Firestore rules - see `firestore.rules.admin-example`. Without the `settings` and admin read rules the dashboard widgets will show permission errors.
- **Index:** the user list and metrics use `createdAt`/`disabled` filters; Firestore will log a link to create any missing index the first time.

## AI post writer

Create post has a **Write with AI** panel. Pick a length (Auto, 50, 120, 250 or 400 words) and a tone, describe the idea, then Generate. You can also tap **Improve my draft** to rewrite what you already typed.

- Length scales with the target: the prompt, structure and output-token budget all change with the word count, and a short or long result is automatically expanded or tightened (up to two passes) to land within about 15% of the target. Auto reads a number such as "300 words" from your idea, otherwise scales with how much detail you gave. The cap is the 3,000 character post limit.
- It runs on Gemini through Firebase AI Logic (no API key in the app, Spark plan). The model comes from `AI_MODEL` in `.env` (default `gemini-3.8-flash`; Gemini 2.5 is closed to new projects).
- One-time Firebase setup:
  1. Firebase console > AI Logic > Get started > Gemini Developer API.
  2. Firebase has required App Check for AI Logic since Nov 2, 2026. Put any UUID in `APPCHECK_DEBUG_TOKEN` in `.env`, then register it under App Check > Apps > your Android app > Manage debug tokens. The same token works for the emulator and a physical phone. Release builds use Play Integrity (register the app with that provider before shipping).
  3. `npm run env`, then rebuild native code: `npm run android`.

## Multi-device accounts and real-time sync

Accounts are Firebase Auth users, so the same login works on a phone and an emulator at the same time. Everything an account does is stored in Firestore and synced live to every signed-in device:

| Feature | Where |
| --- | --- |
| Profile, skills, experience, likes, saved jobs, dismissed suggestions | `users/{uid}` (live copy via `subscribeSelf`) |
| People search and profiles | `users` (every signed-in user can read it) |
| Connect, accept, decline, withdraw, remove | `connections/{uidA~uidB}` |
| Block and unblock | `blocks/{uidA~uidB}` (blocking also removes any connection, in one batch) |
| Messages, unread counts | `conversations/{uidA~uidB}` and its `messages` subcollection |
| Posts, likes, comments | `posts` and `posts/{id}/comments` |
| Jobs and applications | `jobs` and `applications/{uid~jobId}` |
| Notifications | `users/{uid}/notifications` |
| Online status | `users/{uid}.online` and a `lastActiveAt` heartbeat |

Publish the rules in `firestore.rules.admin-example`. It is the complete rule set for every collection above, so replace your rules with it (or merge it in). Without it, the synced features show permission errors.

To test with two devices: sign in with a different account on each, search the other person in Network, Connect, accept on the other device, then message or post. A new notification or application appears on the other device without reopening the app.
For a physical phone on USB run `adb reverse tcp:8081 tcp:8081` before `npm run android`.

**Friend requests.** The sender can withdraw a pending request. The recipient can accept or decline it. Either side can remove an accepted connection. Blocking hides both members from each other's search, suggestions, posts and messages. Unblock from Connections > Blocked members.

**Online status.** A signed-in device sends a heartbeat every 60 seconds while the app is in the foreground, and marks the account offline when it goes to the background. Someone shows as "Active now" only while their heartbeat is less than 3 minutes old, so an app that crashed cannot stay online forever. Presence is per account, so with the app open on two devices the last change wins until the next heartbeat.

**Still stored on the device only:** the sample members that ship with the app (their connection and message flows are simulated), event RSVPs, and a profile photo picked from the gallery. Photos and avatars need Firebase Storage (Blaze plan) to sync.

## Jobs

- **Browse and search.** Every word you type must match somewhere on a listing (title, company, skills, requirements, location, work mode, description). Results are ranked by relevance, then by how many of your skills match, then by recency. Filters: All, Remote, Hybrid, On-site, Saved, Applied and Posted by me.
- **Post and manage.** Any signed-in member can post a listing and edit it, close or reopen it, or delete it. Deleting a listing also deletes its applications. Each listing has a title, company, location, work mode, salary range (USD per year), skills, requirements and description.
- **Apply.** One application per person per job, enforced by the rules, so a second submission from another device is refused. Applicants can withdraw. Closed listings take no new applications.
- **Review applicants.** Open "View applicants" on your listing. Move each applicant through Submitted, Reviewing, Interview, Offer or Rejected. Each change notifies the applicant.
- **Sample catalog.** Admins can load 24 sample listings from the Admin dashboard under Job catalog. They use fictional companies. The load is idempotent, so running it again updates the sample listings instead of duplicating them.

## Notifications

Notifications are created for connection requests and acceptances, new applicants, application status changes, and your own "application sent" confirmation. Tapping one opens the related screen. Read state syncs across devices, and you can mark all read or remove individual items.

## Tests

`npm test` runs the unit tests for job search and ranking, job validation and formatting, relationship states and presence, plus a smoke test that renders the app with the Firebase and Google modules stubbed. These tests do not touch Firebase, so they do not verify the security rules. Test the rules with the Firestore emulator or on a development project before you ship.

## Troubleshooting

- **`SDK location not found`** - set `ANDROID_HOME` (step 1) or open `android/` once in Android Studio.
- **`Permission denied: ./gradlew`** (macOS/Linux, after unzipping with a tool that drops file modes) - `chmod +x android/gradlew`.
- **Stale native build after pulling changes** - `npm run gradle -- clean`, then `npm run android`.
- **Metro port 8081 busy** - `npm start -- --port 8082`, and run the app with `npm run android -- --port 8082`.
- **Google Sign-In error 10 / DEVELOPER_ERROR** - SHA-1 or package name is not registered in Firebase (see step 4).
