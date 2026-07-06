# SMTP Egress Deployment (ZeroBounce-style mailbox verification)

To return confirmed `valid` / `invalid` mailbox verdicts (not just `unknown`),
ScrubiMail must open an outbound SMTP connection to each recipient's MX server
and run a `RCPT TO` probe. This only works from a host that meets **all** of the
requirements below. Get any one wrong and major providers (Google, Microsoft)
will tarpit or refuse the probe, and you'll get `unknown`/`greylisted` instead
of real answers — or worse, get the IP blocklisted.

## 1. Where it can run

- **NOT** on AWS EC2, GCP, Azure, Heroku, Render, Fly, etc. — they block
  outbound port 25 by default and will not unblock it for mailbox probing.
- **YES** on a bare-metal box or a VPS provider that permits port 25 egress
  (e.g. a dedicated server, or a VPS where you've explicitly requested port 25).
- Run it as a **dedicated Celery worker** ("egress worker"). Keep the web/API
  dynos with `VALIDATION_SMTP_ENABLED=False` so realtime stays fast; only the
  egress worker does deep SMTP verification (the Celery task already uses
  `deep=True`).

## 2. Required DNS / network setup

Assume the egress host has static IP `203.0.113.10` and you control
`scrubimail.com`.

| Record | Value | Why |
|--------|-------|-----|
| **A** | `verify.scrubimail.com` → `203.0.113.10` | the HELO hostname must resolve |
| **PTR** (reverse DNS) | `203.0.113.10` → `verify.scrubimail.com` | set via your host/ISP; MX servers reject probes from IPs with no/mismatched PTR |
| **SPF (TXT)** | on the MAIL FROM domain, include the IP | `v=spf1 ip4:203.0.113.10 -all` (or merge into existing SPF) |
| **Port 25** | outbound open | `nc -vz gmail-smtp-in.l.google.com 25` must connect |

The PTR ↔ HELO ↔ A records must all agree (Forward-confirmed reverse DNS).

## 3. Environment variables (egress worker only)

```bash
VALIDATION_SMTP_ENABLED=True
VALIDATION_SMTP_HELO_HOST=verify.scrubimail.com      # must match PTR + have an A record
VALIDATION_SMTP_MAIL_FROM=verify@scrubimail.com      # domain must have SPF
VALIDATION_SMTP_TIMEOUT=5
VALIDATION_SMTP_STARTTLS=True
VALIDATION_SMTP_FAILURE_THRESHOLD=5                  # raise on a reliable host
VALIDATION_SMTP_BLOCK_TTL=600                        # set 0 to disable the breaker
```

Leave `VALIDATION_SMTP_ENABLED=False` everywhere else.

## 4. Verify the host before going live

```bash
# Port 25 egress works?
nc -vz gmail-smtp-in.l.google.com 25

# Forward-confirmed reverse DNS matches?
dig +short verify.scrubimail.com        # -> 203.0.113.10
dig +short -x 203.0.113.10               # -> verify.scrubimail.com.

# Manual probe sanity check (expect 250 on a real address):
python - <<'PY'
import smtplib
s = smtplib.SMTP("gmail-smtp-in.l.google.com", 25, timeout=10)
s.helo("verify.scrubimail.com"); s.mail("verify@scrubimail.com")
print(s.rcpt("someone@gmail.com")); s.quit()
PY
```

## 5. Operational guidance

- **Rate-limit** probes per destination domain; hammering Gmail/Outlook from one
  IP gets you greylisted then blocklisted. Spread bulk jobs over time.
- **Warm the IP**: start with low volume and ramp up.
- **Monitor blocklists** (Spamhaus, etc.) for the egress IP.
- **Catch-all domains** return `catch-all`, not `valid` — the specific mailbox
  genuinely can't be confirmed; that's expected, not a bug.
- The circuit breaker (`VALIDATION_SMTP_FAILURE_THRESHOLD` /
  `VALIDATION_SMTP_BLOCK_TTL`) auto-disables SMTP after repeated total failures
  so a network blip doesn't turn into per-request timeouts. Raise the threshold
  once egress is proven reliable.

## Status / sub_status reference (ZeroBounce-style)

| status | meaning | is_valid |
|--------|---------|----------|
| `valid` | SMTP confirmed the mailbox accepts mail | ✅ true |
| `invalid` | bad syntax / no DNS / mailbox not found | false |
| `catch-all` | domain accepts everything; mailbox unconfirmable | false |
| `unknown` | SMTP inconclusive (timeout, greylist, blocked, or not run) | false |
| `do_not_mail` | disposable / role-based address | false |
| `spamtrap` | matches spam-trap indicators | false |

---

## CI/CD: deploy the egress worker via a self-hosted GitHub runner

The egress worker is deployed to the Hetzner box by a self-hosted runner and
Docker Compose. Files:
- `Dockerfile` — backend image.
- `docker-compose.smtp-egress.yml` — the worker service (consumes ONLY the
  `smtp_validation` queue, `VALIDATION_SMTP_ENABLED=True`).
- `.github/workflows/deploy-smtp-egress.yml` — builds & restarts on push.

### One-time setup on the Hetzner box

1. **Install Docker** (Engine + Compose plugin):
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER   # re-login after this
   ```
2. **Register a self-hosted GitHub Actions runner** (repo → Settings → Actions →
   Runners → New self-hosted runner). When prompted for labels, add
   **`smtp-egress`** (the workflow targets `[self-hosted, smtp-egress]`). Install
   it as a service so it survives reboots:
   ```bash
   ./config.sh --url https://github.com/Ellis-Ayikwei/scrubimail \
     --token <RUNNER_TOKEN> --labels smtp-egress
   sudo ./svc.sh install && sudo ./svc.sh start
   ```
3. **Confirm port 25 + DNS** with `python manage.py check_smtp_egress` (the
   workflow also runs this each deploy). See the requirements above.

### Required GitHub repo secrets

Set these under repo → Settings → Secrets and variables → Actions. They must
point at the SAME Redis broker and Postgres DB the main app (Railway) uses:

| Secret | Value |
|--------|-------|
| `DJANGO_SECRET_KEY` | same as the main app |
| `DATABASE_URL` | shared Postgres connection string |
| `CELERY_BROKER_URL` | shared Redis broker (e.g. `redis://…/0`) |
| `CELERY_RESULT_BACKEND` | shared Redis backend |
| `REDIS_URL` | shared Redis (for the cache) |
| `CACHE_REDIS_URL` | shared Redis for DNS/reputation cache (often same as `REDIS_URL`) |
| `VALIDATION_SMTP_HELO_HOST` | e.g. `verify.scrubimail.com` (must match PTR) |
| `VALIDATION_SMTP_MAIL_FROM` | e.g. `verify@scrubimail.com` (domain needs SPF) |

The workflow writes these into `.env.smtp-egress` on the box and runs
`docker compose -f docker-compose.smtp-egress.yml up -d --build`.

### Queue routing (already configured)

`CELERY_TASK_ROUTES` sends `validate_email_task` / `bulk_validate_emails_task`
to the **`smtp_validation`** queue. Only this egress worker consumes it; the
Railway worker keeps consuming `default,embeddings` and never attempts SMTP.

> ⚠️ The box runs **only a worker** — no web, migrations, or collectstatic.
> The main app owns the schema; both share one DB.

### Still to wire (app side)

For tasks to actually reach this worker, the API must **enqueue** deep
validations (`validate_email_task.delay(...)`) rather than validating inline.
Today single/bulk validation runs synchronously in the request with
`deep=False`. Decide which flow should be SMTP-verified and enqueue it to the
`smtp_validation` queue.
