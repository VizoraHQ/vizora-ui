# Security policy

## Supported versions

Vizora is pre-1.0. Only the latest `0.x` release receives security fixes. Once 1.0 ships, this section will document LTS coverage.

| Version | Supported |
| ------- | --------- |
| 0.x     | ✅        |
| <0.1    | ❌        |

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Instead, email **santoshgoteti9@gmail.com** with:

- A description of the issue and the impact you observed.
- Steps to reproduce, or a proof-of-concept.
- Any suggested mitigation.

You can expect an acknowledgment within 72 hours. If accepted, a fix will land in a patch release; you'll be credited in the release notes (unless you prefer to remain anonymous).

For sensitive reports you can also use GitHub's [private vulnerability reporting](https://github.com/VizoraHQ/vizora-ui/security/advisories/new).

## Scope

In-scope:

- Vulnerabilities in any `@vizora/*` published package.
- XSS via untrusted props passed to Vizora components.
- Prototype pollution, dependency confusion, supply-chain risks in published artifacts.

Out of scope:

- Vulnerabilities in `apps/playground` (it's a demo, not a production target).
- Issues that require a compromised local development environment.
- Issues that depend on user-supplied CSS or theme overrides causing visual confusion (these are by-design — themes are user code).
