# Release Notes

## PetsWorkshop — Pet Appointment & Booking System (Documentation Release)

This release publishes **final documentation artifacts** for the **Pet Appointment & Booking System** initiative.

> Note: This repository currently contains the original Dogs shelter catalogue application used in workshops. The appointment booking workstream described here is a **specification + design package** intended to guide implementation.

### Business justification
A centralized appointment system improves customer convenience, reduces manual scheduling effort, prevents double-booking, and provides better visibility into upcoming bookings and service demand.

### Scope (MVP)
- Customer booking flow:
  - Select a pet from registered pets
  - Browse services with descriptions and pricing
  - Select appointment date and available time slot
  - Create, view, cancel, and reschedule appointments
  - View upcoming and past appointments in a user dashboard
- Admin management:
  - Manage services
  - Manage time slots/availability
  - Manage appointments
- System rules:
  - Prevent double-booking (server-side)
  - Validation and error handling across UI and API

### Out of scope
- Payments/refunds
- Email/SMS notifications
- Multi-location scheduling and advanced capacity rules

### Security note
If a simplified identity mechanism (e.g., request headers) is used for workshop/MVP purposes, it must be clearly marked **development-only** and must not be used in production without proper authentication and authorization.

### Documentation artifacts (Confluence)
- Requirement (EPMCDMETST-63008):
  https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12910593/EPMCDMETST-63008+Add+appointment+booking+workflow+customer+admin+for+pet+services
- Architecture:
  https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12943361/Architecture+EPMCDMETST-63008
- High-Level Design (HLD):
  https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12976129/HLD+EPMCDMETST-63008
- Low-Level Design (LLD):
  https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12484610/LLD+EPMCDMETST-63008
- Wireframes:
  https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12812305/Wireframe+EPMCDMETST-63008
- Implementation Plan:
  https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12615682/Implementation+Plan+EPMCDMETST-63008

### Known gaps / next steps
- Implementation PR(s) are required to add booking domain models, API endpoints, frontend pages, admin UI, and automated tests.
- Decide on an authentication mechanism suitable for the intended deployment environment.
- Confirm timezone policy and cancellation/reschedule rules prior to final implementation.
