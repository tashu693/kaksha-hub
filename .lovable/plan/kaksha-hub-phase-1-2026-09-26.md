# KAKSHA HUB Phase 1

## Goal
Build a complete UI-only academic resource platform for AKTU B.Tech students, using realistic local mock data and local interaction state. No authentication, database, uploads, APIs, storage, or AI will be implemented.

## Experience
- Use a premium student-tech visual system: crisp white surfaces, deep ink text, cobalt and teal accents, subtle glass, soft elevation, and restrained motion.
- Create a shared desktop header, mobile bottom navigation, creator section, and footer across every page.
- Keep all layouts responsive, accessible, keyboard-friendly, and free of horizontal overflow.

## Pages
- Home with resource search, branch/semester discovery, subjects, and featured resources.
- Branches and Semester browsers.
- Resource library with working local search, filters, and sorting.
- Resource details with document preview and local View, Download, Save, and Helpful controls.
- Student dashboard, My Resources, Contribute form, Contributor Profile, Notifications, Profile, and Admin Dashboard.
- Login and Register presentation-only screens.

## Reusable UI and Data
- Centralize mock branches, semesters, subjects, resources, contributors, notifications, and dashboard metrics.
- Build reusable resource cards, selectors, filter controls, stat tiles, section headers, empty states, and app-wide layout.
- Use URL-safe dedicated routes for every page and resource/contributor detail.

## Interactions
- Search and filtering update displayed resources locally.
- Save, Helpful, Download, notification read state, dashboard tabs, contribution form, and admin approve/reject actions provide clear mock feedback.
- Navigation works across desktop and mobile, with no simulated operation presented as real persistence.

## Technical Details
- Keep TanStack Start routing and Tailwind v4 conventions.
- Add unique metadata for every route.
- Respect reduced-motion preferences and use semantic design tokens.
- Validate the live UI at desktop and mobile widths, then fix compile and runtime issues without altering the selected design.
