# Email user management deployment

## Status

This is an implemented security-hardening increment, not a completed production security certification. Do not deploy without reviewing the limitations below and testing against a local Supabase instance. No migration or provider operation was executed against production.

## Manual setup

1. Back up the database and review `sql/user-management.sql` followed by `sql/user-management-hardening.sql`. Apply them manually, in that order, first in a disposable Supabase environment. They create namespaced `kb_*` tables and security triggers; they are one-time migrations, not idempotent scripts. The hardening migration adds `session_version`, advisory transaction locks, password-change revocation, and bounded list RPCs. Existing Auth users get a user/active profile; metadata and email allowlists never grant new profile administrator privileges.
2. Set server-only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and a strong `AUTH_SECRET`. Set `APP_ORIGIN` to the exact HTTPS application origin without a trailing slash. This configured origin is mandatory for production mutations; forwarded host headers are not trusted as an origin allowlist.
3. Create/identify a real Supabase Auth account, then manually bootstrap its actual UUID using the SQL below. Never substitute an email or a fabricated UUID. Confirm the matching Auth email before updating.

```sql
select id, email from auth.users where id = '<REAL_AUTH_UUID>'::uuid;
update public.kb_profiles set role = 'admin', status = 'active'
where id = '<REAL_AUTH_UUID>'::uuid;
```

4. Configure production SMTP, Site URL, password policy, provider rate limits and email OTP expiry (recommended 15 minutes). Disable public signups if accounts must be invitation-only.
5. Customize the invitation email anchor to `{{ .SiteURL }}/password-setup.html#token_hash={{ .TokenHash }}&type=invite` and the recovery email anchor to `{{ .SiteURL }}/password-setup.html#token_hash={{ .TokenHash }}&type=recovery`. Configure the setup page as an allowed redirect. These custom templates are required: default implicit-flow templates are not supported by this implementation.
6. Fragments are removed immediately by the setup script and exchanged in a POST body only after submitting a password. Never enable request-body logging on this endpoint. Provider OTP verification consumes the token; a password-update failure requires a fresh email. No provider access/refresh tokens are returned to browser code or stored in browser storage.
7. Test the migrated administrator login before setting `AUTH_MODE=enforce`. Use the email/password belonging to Supabase, not the legacy manual credential.

## Compatibility versus enforce

With `AUTH_MODE` unset (compatibility), manual login and old signed sessions remain usable for existing CMS functionality. Legacy `CMS_ADMIN_EMAILS` remains effective only for legacy sessions. Legacy sessions cannot access `/api/users` or the user-management page. Manual credential authentication is not DB rate-limited in this mode to avoid locking out existing installations before migration. This is deliberately NOT a unified security guarantee.

With `AUTH_MODE=enforce`, manual login and all UUID-less sessions are rejected. Supabase password login requires an active database profile. UUID sessions are revalidated against the database on every API authentication and protected page request, in Express and Vercel middleware, in either mode. Profile lookup failure denies access. Database roles override token roles and the legacy email allowlist.

## Architecture and recovery

- `kb_profiles` uses Auth UUIDs, `session_version`, and restrictive role/status checks. RLS and grants deny anon/authenticated table access. Auth inserts create user-only profiles. Provider email changes update profiles inside the same database transaction through a trigger. Application cookies carry the UUID and exact profile version; every server/edge revalidation compares both and denies stale cookies.
- `kb_manage_user` checks the active administrator under a PostgreSQL advisory transaction lock plus guard-row write, blocks self-demotion/disabling, increments versions on access changes, and audits profile mutations. Auth/profile deletion and last-admin checks use the same transaction lock. Concurrent operations serialize; callers must retry a serialization/lock failure and must not bypass guards.
- Deletion first marks the profile `deleting`, denying application access, then calls provider deletion. Failed/ambiguous provider deletion leaves the profile blocked. Retry deletion or investigate manually; do not automatically reactivate an uncertain operation.
- Invitation creates a default user profile through the Auth trigger. No admin-selected passwords or metadata roles exist. Invite/reset/email request audit records contain action and UUIDs only, not credentials or email tokens.
- Administrator email editing is intentionally disabled. Supabase supports a user-authenticated email-change flow that sends confirmation messages; this server must not silently perform a privileged provider email replacement or mark it confirmed. The UI reports this explicitly. Re-enable only after implementing and testing a user/provider confirmation workflow.
- Strict Origin validation protects API mutations including legacy CMS writes. Clients must send the configured Origin; missing Origin is rejected. Cookies are HttpOnly, SameSite=Lax and Secure in production.

## Outstanding limitations requiring work

- Tests cover mocked provider parsing, stale version sessions, origin rejection, SQL sequential invariants, RLS denial and public build regressions. They do not emulate Supabase's full Auth service, SMTP, browser UI, or multi-process production concurrency; run local Supabase/Auth and a real concurrent transaction test before deployment.
- Invite/reset/delete provider calls recheck the active administrator immediately before the external call and fail closed on stale sessions. A cross-service race after that check remains unavoidable without a provider/database distributed transaction; no privilege-changing database action follows an external call. Delete failures leave the profile blocked as `deleting` for reconciliation.
- Password changes now increment `kb_profiles.session_version` through the Auth encrypted-password trigger. Existing application cookies become invalid on the next server/edge revalidation. This assumes the hardening migration is installed; before that migration, old sessions cannot be version-bound.
- Email change uses privileged provider semantics; verified-email ownership and delivery behavior must be validated locally before production. There is no user-driven dual-email confirmation workflow.
- CSRF uses strict configured Origin validation, not an additional synchronizer token. Non-browser integrations need a deliberate separate authentication design.
- Login throttling is per normalized identity, not per trusted client IP/global budget. Manual compatibility login is exempt. Rate-limit table retention cleanup must be scheduled manually.
- User listing uses bounded server-side filters and pages of 50, with a global filtered total and summary returned by the database RPC. The UI displays page/total and never silently truncates beyond the page limit.
- Audit records capture provider-operation intent, not reconciled completion. No automated reconciliation worker is implemented.
- The administrator page links to user management; legacy admins see that link but receive 403. Existing navbar CRUD/dynamic navigation code was not redesigned.

## Local verification

Run `npm test`; pretest runs the public allowlist build. It includes the existing navigation/editor regressions and `user-management.test.js` mocked provider, Origin and PGlite tests. No live provider claim is implied. No lint/typecheck scripts are currently defined; supply project commands before treating those checks as complete.
