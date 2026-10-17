# Security policy

Please do not open a public issue for a suspected vulnerability.

Use GitHub's **Report a vulnerability** flow in the Security tab of this
repository. Include affected routes, configuration, reproduction steps, and
the impact you observed. Do not include live credentials, customer data, or
Google OAuth tokens.

## Supported version

Security fixes are made on the default branch. Self-hosters should deploy the
latest default-branch revision and keep Convex, Wrangler, Node.js, and the
base container image current.

## Operator responsibilities

- Protect `/owner-login` with Cloudflare Access.
- Use unique generated values for every secret; never copy the example values.
- Keep `.self-host/`, `.env*`, deploy keys, API tokens, and OAuth client
  secrets out of Git.
- Restrict Cloudflare and Convex deployment credentials to the permissions
  needed for deployment.
- Rotate any credential immediately if it appears in logs, terminal history,
  an issue, or a commit.
- Review Cloudflare Access policy and Google OAuth test users before making a
  deployment public.

Public booking endpoints accept untrusted input by design. If you expose a
busy site, add suitable Cloudflare rate limiting and Turnstile protection for
your threat model.
