# CurriPulse transactional emails

Replacements for Supabase's default auth emails, in the same archival press language as the app:
warm paper, ink, a single oxblood accent, Georgia headings. They read as institutional
correspondence rather than as product marketing, which is the right register for something a Dean
receives.

## Installing

Supabase Dashboard → **Authentication** → **Emails** → template tab → paste the file body, set the
subject, save.

| File | Template tab | Subject line |
|---|---|---|
| `magic-link.html` | Magic Link | `Your CurriPulse sign-in link` |
| `confirm-signup.html` | Confirm signup | `Confirm your CurriPulse account` |
| `invite-user.html` | Invite user | `You have been invited to CurriPulse` |
| `reset-password.html` | Reset password | `Reset your CurriPulse password` |
| `change-email.html` | Change email address | `Confirm your new CurriPulse address` |
| `reauthentication.html` | Reauthentication | `Your CurriPulse verification code` |

CurriPulse signs in by magic link, so **Magic Link** is the one that matters. The rest are provided
so nothing falls back to a default template if a flow is enabled later.

## ⚠️ Before you demo: the built-in SMTP will rate-limit you

Supabase's built-in email service exists for development, not for use. It permits only a couple of
messages per hour on the free tier and is shared infrastructure, so it is both throttled and prone
to landing in spam.

For a live demo this is the single most likely thing to break: request two sign-in links in quick
succession and the second silently never arrives.

Configure custom SMTP under **Project Settings → Authentication → SMTP Settings**. Resend, Brevo, and
Mailgun all have free tiers sufficient for this. Then raise the rate limit under
**Authentication → Rate Limits**.

If you cannot set up SMTP before the demo: **sign in once, well beforehand.** The session persists,
so no email is needed during the pitch.

## Design notes

These are built the way email actually has to be built, not the way the app is:

- **Tables and inline styles.** Mail clients are not browsers. No flexbox, no grid, no external
  stylesheet.
- **No images at all.** The wordmark is set in type. Most clients block remote images by default, and
  a logo that renders as a broken-image icon is worse than no logo. It also keeps every message a
  couple of kilobytes.
- **Georgia, not Newsreader.** Web fonts are unreliable in mail. Georgia ships nearly everywhere and
  carries the same editorial weight.
- **Light-locked.** `color-scheme: light` stops clients auto-inverting a paper design into something
  muddy.
- **A visible OTP alongside every link.** Corporate mail gateways rewrite and sometimes break long
  links; university mail systems are among the worst for this. The code is a genuine fallback, not
  decoration.
- **Preheader text.** The hidden first line controls the inbox preview instead of leaving it to pick
  up stray markup.

## Previewing

```bash
node emails/preview.mjs
```

Writes rendered copies with sample values into `emails/preview/`. Open them in a browser to check
layout. For real client testing, Litmus or Email on Acid cover Outlook, which is always the one that
misbehaves.

## Variables

Supabase substitutes these server-side:

| Variable | Meaning |
|---|---|
| `{{ .ConfirmationURL }}` | The action link |
| `{{ .Token }}` | Six-digit OTP |
| `{{ .Email }}` | Recipient address |
| `{{ .NewEmail }}` | Incoming address, change-email only |
| `{{ .SiteURL }}` | Configured site URL |
