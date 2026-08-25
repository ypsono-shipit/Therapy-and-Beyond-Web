# Therapy & Beyond — Web

A **browser-first** (desktop + mobile web) client for Therapy & Beyond. Same product as the Expo app, but built as a real website: sidebar on desktop, bottom nav on phones, full-width pages, HTML routes.

It talks to the **same Supabase project** as [Therapy-and-Beyond-Browser](https://github.com/ypsono-shipit/Therapy-and-Beyond-Browser) and the native app. Accounts, patients, check-ins, journals, messages, alerts, edge functions, and RLS are shared. Do not run a second database.

## Same backend

| Piece | Shared? |
| --- | --- |
| Supabase URL + publishable key | Yes |
| Auth users & profiles | Yes — sign in with the same email |
| Tables, views, RPCs, RLS | Yes |
| Storage (`avatars`, `voice-journal-audio`) | Yes |
| Edge functions (`ai-chat-reply`, `generate-insight`, `transcribe-voice-note`, …) | Yes — CORS already allows any origin |

The only dashboard change you may need: in **Supabase → Authentication → URL Configuration**, add this site’s origin to **Site URL** / **Redirect URLs** so email confirmation links can land here.

## Local

```bash
cp .env.example .env
npm install
npm run dev
```

## Stack

Vite + React 19 + TypeScript + React Router + TanStack Query + Supabase JS.

Not Expo, not React Native Web. Native DOM + CSS so desktop is a dashboard and a phone browser is a compact app shell — not a fake iPhone frame.

## Deploy

Vercel: `npm run build`, output `dist`, SPA rewrite is in `vercel.json`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as `.env.example`).
