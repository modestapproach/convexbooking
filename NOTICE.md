# Notices and attribution

Convex Booking combines original integration work with software derived from
other open-source projects.

## Cal.com and cal.diy

The `app/` tree is derived from the Cal.com community codebase and the cal.diy
fork. The scheduling algorithms in `packages/scheduling-engine/` were adapted
from cal.diy commit `180ede28`.

Those portions are used under the MIT License:

> Copyright (c) 2020-present Cal.com, Inc.

The original MIT license is retained at `app/LICENSE`, and additional license
files shipped with individual embedded packages remain in their source
directories.

Upstream projects:

- https://github.com/calcom/cal.com
- https://github.com/calcom/cal.diy

## Dibslist lineage

The first Convex integration was developed inside the Dibslist booking
application in September 2026, then separated into this single-owner project.
Dibslist is not an upstream license for this release. Ted Dessert's original
integration work in this repository is released under the root MIT License.

## Dependencies

JavaScript dependencies keep their own licenses and notices. Their exact
versions are recorded in `pnpm-lock.yaml` and `app/yarn.lock`. Redistributing a
binary or container image does not remove the obligation to preserve any
notices required by those dependencies.

Names and logos belonging to Cal.com, Convex, Cloudflare, Google, and other
projects are trademarks of their respective owners. The MIT License grants
copyright permissions; it does not grant trademark rights.
