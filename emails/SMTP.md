# Sending verification email for free

Supabase's built-in email service is for development. It allows only a couple of messages per hour
on the free tier, is shared infrastructure, and lands in spam often. A second sign-in request simply
never arrives — no error anywhere. Any real use needs custom SMTP.

## The constraint that decides this: do you own a domain?

Most "free tier" email providers only let you send to **arbitrary recipients** once you have verified
a **domain** by adding DNS records. On `curripulse.vercel.app` you cannot add DNS records, so those
providers are unusable until you own a domain.

Providers that verify a **single sender address** instead work immediately with a Gmail address.

| Provider | Free allowance | Domain required? | Verdict |
|---|---|---|---|
| **Brevo** | ~300/day | ❌ verifies a sender address | **Best pick without a domain** |
| Mailjet | ~200/day, 6,000/mo | ❌ verifies a sender address | Good alternative |
| Gmail SMTP | ~500/day | ❌ your own account | Fastest, but see caveats |
| Resend | 3,000/mo, 100/day | ✅ for arbitrary recipients | Best *once you own a domain* |
| SMTP2GO | ~1,000/mo | ✅ | Only with a domain |

*Allowances change — check the provider's current pricing page.*

Once you own a domain, **switch to Resend**: proper SPF/DKIM makes the difference between landing in
the inbox and landing in spam, and that cannot be fixed without DNS control.

---

## Option A — Brevo (recommended, no domain needed)

1. Sign up at brevo.com.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender.** Use your own email. Confirm the
   verification message.
3. **SMTP & API → SMTP.** Copy the login and generate an SMTP key.
4. Supabase → **Project Settings → Authentication → SMTP Settings** → enable custom SMTP:

   ```
   Host            smtp-relay.brevo.com
   Port            587
   Username        <the SMTP login Brevo shows, e.g. 9a1b2c001@smtp-brevo.com>
   Password        <SMTP key — not your Brevo account password>
   Sender email    <the address you verified in step 2>
   Sender name     CurriPulse
   ```

5. Supabase → **Authentication → Rate Limits** → raise "Emails per hour" (the built-in cap stays in
   force otherwise, which defeats the point).

## Option B — Gmail SMTP (fastest, fine for a demo)

Requires 2-Step Verification on the Google account, then an **App Password**
(myaccount.google.com → Security → App passwords). Your normal password will not work.

```
Host            smtp.gmail.com
Port            587
Username        you@gmail.com
Password        <16-character app password, no spaces>
Sender email    you@gmail.com
Sender name     CurriPulse
```

Caveats worth knowing before you rely on it:

- Google rewrites the From header to your Gmail address, so mail arrives as a person rather than as
  CurriPulse.
- Consumer Gmail is not intended for application mail; sustained sending can get the account
  flagged.
- Roughly 500 recipients per day.

Good enough for a hackathon. Not what you would ship on.

## Also set, or links will not work

Supabase → **Authentication → URL Configuration**:

- **Site URL** — your deployed origin, no trailing slash
- **Redirect URLs** — add `https://<your-domain>/auth/callback`

These must match `NEXT_PUBLIC_SITE_URL`. A mismatch produces a link that authenticates and then
bounces to the wrong origin.

## Verifying it works

Request a sign-in link, then check Supabase → **Logs → Auth** for the send, and the provider's own
activity log for delivery. Two different logs, because "Supabase sent it" and "the provider
delivered it" are different claims.

**Check the spam folder.** Without a custom domain there is no SPF/DKIM alignment, so first-contact
mail to an unfamiliar recipient often lands there — including a judge's inbox.

## If you cannot set this up before a demo

Sign in once, in advance. The session persists in the browser, so the demo path never touches email.
This is the reliable move regardless of which provider you choose.
