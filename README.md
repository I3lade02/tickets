# Tickets

A small, private helpdesk for your websites. Visitors send a message from a form on
any of your sites; it becomes a numbered ticket in one dashboard where you set its
status and priority, keep notes, and (optionally) reply by email.

- Next.js on Vercel, Postgres on Neon (free tier is plenty)
- One password-protected dashboard at `/admin`
- Email alerts and replies through Resend (optional)

## 1. Put it on Vercel

1. Create a new GitHub repository and push this folder to it.
2. In Vercel: **Add New > Project**, pick the repository, deploy. The first deploy
   will show an error page until the next steps are done; that's expected.
3. In the project, open **Storage > Create Database > Neon**, and connect it to this
   project. Vercel adds `DATABASE_URL` for you. Pick the region closest to your
   Vercel functions.
4. In **Settings > Environment Variables**, add:

   | Variable | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | the password you'll log in with |
   | `SESSION_SECRET` | output of `openssl rand -base64 32` |
   | `DISPLAY_TIMEZONE` | e.g. `Europe/Prague` (optional, default UTC) |

5. Edit `sites.config.js` with your three sites (id, name, colour, and the exact
   addresses they're served from). Commit and push; Vercel redeploys.
6. Open `https://<your-project>.vercel.app/login`.

The database tables are created automatically on the first request.
`schema.sql` has the same SQL if you prefer to run it yourself.

## 2. Add the form to your websites

Pick whichever fits each site. Replace `YOUR-TICKETS` with your app's address and
`site-one` with that site's `id` from `sites.config.js`.

**A. Embed the ready-made form** (no code on your site):

```html
<iframe src="https://YOUR-TICKETS.vercel.app/submit/site-one"
        style="width:100%;max-width:640px;height:560px;border:0"
        title="Contact form"></iframe>
```

Add `?accent=0e8a6a` (a hex colour without `#`) to match the button to your site.

**B. Use your own HTML form** and post it straight here:

```html
<form method="post" action="https://YOUR-TICKETS.vercel.app/api/tickets">
  <input type="hidden" name="site" value="site-one">
  <input type="hidden" name="redirect" value="https://site-one.com/thanks">
  <input name="name" placeholder="Your name">
  <input name="email" type="email" required>
  <input name="subject">
  <textarea name="message" required></textarea>
  <!-- spam trap: keep it hidden and empty -->
  <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">
  <button>Send</button>
</form>
```

After sending, the visitor lands on your `redirect` page with `?ticket=57` added.
The redirect must be on that site's own address; otherwise the built-in thank-you
page is shown.

**C. Send it with `fetch()`** from your own code:

```js
const res = await fetch('https://YOUR-TICKETS.vercel.app/api/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    site: 'site-one',          // optional: inferred from the page's address
    name, email, subject, message,
    page: location.href,       // optional: shows which page they wrote from
  }),
});
const data = await res.json(); // { ok: true, id: 57 } or { error: "..." }
```

Only addresses listed under `origins` in `sites.config.js` may use B and C. When
running `npm run dev` locally, `http://localhost` is allowed too.

Required fields: `email` and `message`. If `subject` is empty, the start of the
message is used.

## 3. Email (optional)

Without email the app works fully; you just check the dashboard (it refreshes
itself every minute) and reply from your own mail.

1. Create an account at resend.com and an API key. Add `RESEND_API_KEY` and set
   `NOTIFY_EMAIL` to your address to get an alert for every new ticket. Hitting
   Reply on an alert writes straight to the customer, which is handy on a phone,
   but that reply won't show on the ticket.
2. To reply from the dashboard, verify a domain in Resend and set `EMAIL_FROM`,
   e.g. `Support <support@yourdomain.com>`. Replies are logged on the ticket and
   move it to "Waiting on reply". Customers' answers go to `REPLY_TO_EMAIL`
   (defaults to `NOTIFY_EMAIL`).
3. `SEND_CONFIRMATION=true` also emails customers a receipt with their ticket
   number. Needs `EMAIL_FROM`.

Until a domain is verified, Resend's test sender only delivers to your own
Resend account address, so alerts work but replies to customers don't.

## Working on it locally

```bash
npm install
npx vercel link && npx vercel env pull .env.local   # or copy .env.example
npm run dev
```

## Where things are

| Path | What it does |
| --- | --- |
| `sites.config.js` | your websites |
| `app/api/tickets/route.js` | receives tickets from your sites |
| `app/submit/[site]/page.js`, `components/SubmitForm.js` | the embeddable form (edit wording here) |
| `app/admin/` | dashboard pages and actions |
| `components/InboxView.js`, `components/TicketView.js` | dashboard layout |
| `lib/` | database, login, email, helpers |
| `app/globals.css` | all styling |

## Good next steps

- **Spam:** if the hidden trap field isn't enough, add Cloudflare Turnstile to
  the form and verify its token in `app/api/tickets/route.js`.
- **Customer replies on the ticket:** Resend can forward incoming mail to a
  webhook; a small route could attach it to the ticket by the `[#57]` in the
  subject and reopen it.
- **Attachments:** Vercel Blob for screenshots.
