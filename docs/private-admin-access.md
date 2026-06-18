# Private Admin Access

FairEats does not advertise or offer Admin as a public signup role.

Admin access requires both:

1. The authenticated user has `role = 'ADMIN'` in `public.users`.
2. The authenticated email is listed in the server-only `ADMIN_EMAIL_ALLOWLIST`.

The current local allowlist is configured in `.env.local`. Production should define the same variable in the deployment provider's encrypted environment settings.

## Provision the owner

Run this in the Supabase SQL editor, replacing the email when needed:

```sql
update public.users
set role = 'ADMIN',
    updated_at = now()
where email = 'owner@example.com';
```

Verify the result:

```sql
select id, email, role
from public.users
where email = 'owner@example.com';
```

Then set:

```env
ADMIN_EMAIL_ALLOWLIST=owner@example.com
```

Multiple owner emails can be comma-separated.

## Production hardening

- Enable MFA for the owner account.
- Keep the admin route unlinked from public pages.
- Review administrative permissions regularly.
- Record sensitive admin actions in an immutable audit log.
- Add IP or organization SSO restrictions if the operations team grows.
