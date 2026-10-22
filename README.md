# Blue Collar Match

A dating app where women meet employed, skilled tradesmen: mechanics, electricians,
plumbers, welders, linemen and more. One codebase runs on **iPhone, Android and the web**.

- Swipe cards show the main photo with the man's trade underneath (e.g. **Mechanic**).
  Drag right to like, left to pass, or use the buttons.
- Tap a card to open the full profile: all photos, work details, bio and qualities.
  Like individual photos, like/pass, message, report or block.
- Profiles have up to 6 photos, a trade/job title, employer, years of experience,
  licensed and employment status, and a pick list of 44 qualities.
- Mutual likes become matches. A Likes tab shows matches and who liked you.
- Messaging between women and tradesmen, with unread counts.
- Account deletion, blocking and reporting (both app stores require these).

> "Blue Collar Match" is a working name. Change it in `app/app.json` (`name`) and on the welcome screen.

## How it is built

```
app/            Expo (React Native) app for iOS, Android and web
  src/app/      Screens (Expo Router: each file is a route)
  src/components/  Swipe deck, profile view, UI pieces
  src/lib/      API client, auth, types, theme
server/api/     PHP + MySQL API, upload this folder to Turbify
  index.php     All endpoints (index.php?r=/route)
  lib/          Handlers, auth, photo processing
  install/      schema.sql, install.php and demo data
  uploads/      User photos (scripts blocked from running here)
```

The API is plain PHP 8 with PDO/MySQL and GD, which Turbify shared hosting supports.
No Composer, no Node on the server. Routes use `index.php?r=/path` so they work
without URL rewriting, and the auth token travels in an `X-Auth-Token` header because
some shared hosts strip `Authorization`.

## 1. Set up the server on Turbify

1. **PHP version.** In the Turbify control panel, set PHP to 8.1 or newer for the site.
2. **Database.** Create a MySQL database and user in the control panel. Note the host
   (often `localhost`), database name, user and password.
3. **Upload.** Upload the contents of `server/api/` to `public_html/api/` on
   dating.formoreoptions.com (File Manager or FTP). The API will live at
   `https://dating.formoreoptions.com/api/`.
4. **Config.** On the server, copy `api/config.sample.php` to `api/config.php` and fill
   in the database details and a long random `setup_key`. Keep this file private.
5. **Permissions.** Make sure `api/uploads/` is writable by PHP (usually 755 is enough;
   use 775 if uploads fail).
6. **Create tables and test users.** Visit:
   `https://dating.formoreoptions.com/api/install/install.php?key=YOUR_SETUP_KEY&demo=1`
   It is safe to run again. Add `&remove_demo=1` to wipe and rebuild the demo users.
7. **Check it.** `https://dating.formoreoptions.com/api/index.php?r=/health` should show `{"ok":true,...}`.

Before real users join, delete or rename the `api/install/` folder.

### Test users

The installer creates 30 demo users (24 tradesmen, 6 women). The password for all of them is `demo1234`.

| Sign in as | Email |
|---|---|
| A woman browsing tradesmen | `sarah.seeker@demo.local` (already matched and chatting with Jake; 4 men already liked her, so swiping right on them makes a match) |
| A tradesman | `jake.worker@demo.local` |

Other accounts follow the same pattern: `firstname.worker@demo.local` and
`firstname.seeker@demo.local`. See `server/api/install/demo_data.php` for the full list.

**Demo photos.** For each demo user the installer uses, in order:
1. Your own pictures from `server/api/install/demo_photos/`, named after the user
   (`jake.jpg`, `jake-2.jpg`, `sarah.png`, up to 4 each). Use stock photos or AI-generated
   portraits here. Upload them with the rest of the api folder and rerun the installer with `&remove_demo=1&demo=1`.
2. Otherwise a free stock portrait downloaded from randomuser.me by your server
   (small, 128px, but real faces with the right gender).
3. A generated placeholder card with their initial, if the download is not possible.

## 2. Run the app on your phones (sideloading)

You need Node.js 20+ on your computer.

```bash
cd app
npm install
npx expo start --tunnel
```

### iPhone and Android, quickest: Expo Go
Install **Expo Go** from the App Store or Google Play, then scan the QR code shown by
`expo start` (Camera app on iPhone, Expo Go on Android). No developer accounts needed.
The app talks to the live API at dating.formoreoptions.com.

### Android: install a real APK
```bash
npm install -g eas-cli
eas login            # free Expo account
eas build -p android --profile preview
```
EAS gives you a download link for an `.apk` you can install on any Android phone
(allow "install unknown apps" when asked).

### iPhone: a standalone install
A standalone iPhone build that is not in the App Store needs an Apple Developer account
($99/year): register the phones with `eas device:create`, then run
`eas build -p ios --profile preview`. Until then, use Expo Go.

### Point the app at another server
Copy `app/.env.example` to `app/.env` and change `EXPO_PUBLIC_API_URL`.
Add your dev origin to `cors_origins` in `config.php` if you test the web app from your computer.

## 3. Publish the web version

```bash
cd app
npm run build:web
```
Upload everything in `app/dist/` (including the hidden `.htaccess`) to `public_html/`
on dating.formoreoptions.com, next to the `api/` folder. The site then serves the app at
`https://dating.formoreoptions.com/`.

## API reference

All requests go to `https://dating.formoreoptions.com/api/index.php?r=<route>`. Send
`X-Auth-Token: <token>` after signing in. JSON in, JSON out; errors are `{"error": "..."}`.

| Method | Route | What it does |
|---|---|---|
| GET | `/health` | Server check |
| GET | `/options` | Qualities list, suggested trades |
| POST | `/auth/register` | `{email, password, role: seeker\|worker, first_name, birthdate}` |
| POST | `/auth/login` | `{email, password}` returns `{token, user}` |
| POST | `/auth/logout` | Ends the session |
| GET / PUT / DELETE | `/me` | Read, update (any profile field plus `quality_ids`), delete account |
| POST | `/photos` | Multipart upload in field `photo` |
| DELETE | `/photos/{id}` | Delete own photo |
| POST | `/photos/{id}/main` | Set main photo |
| POST / DELETE | `/photos/{id}/like` | Like or unlike someone's photo |
| GET | `/discover` | Swipe cards (`&job_title=Mechanic`, `&state=TX` optional) |
| POST | `/swipes` | `{target_id, direction: like\|pass}` returns `{matched}` |
| GET | `/matches`, `/likes` | Matches; people who liked you |
| GET | `/profiles/{id}` | Full profile with photos and qualities |
| GET | `/conversations` | Message threads with last message and unread count |
| GET / POST | `/messages/{userId}` | Read (`&after_id=` for new only) or send `{body}` |
| POST | `/users/{id}/block`, `/users/{id}/report` | Safety tools (`{reason}` for report) |

Reports land in the `reports` table; review them in phpMyAdmin and set `users.is_banned = 1` to suspend someone.

## Not built yet

- Push notifications for new messages and matches (needs EAS + Apple/Google accounts)
- Distance-based search (currently filter by trade or state)
- Email verification and password reset (needs an outgoing mail setup on Turbify)
- An admin screen for reports
- Store listings, privacy policy and terms pages (needed before publishing)
