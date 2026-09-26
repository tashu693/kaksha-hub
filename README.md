# Kaksha Hub

Build PHASE 1 of “KAKSHA HUB” from scratch.

KAKSHA HUB — “Your AKTU study material, all in one place.”

IMPORTANT: UI ONLY for now.
Do NOT create authentication, database, backend, storage, APIs, real uploads, or AI features yet. Use realistic local mock data and local state only. Build the architecture so backend/auth can be added later without redesigning the UI.

GOAL:
Create a premium, modern, responsive academic resource platform for AKTU B.Tech students across MULTIPLE branches — CSE, IT, AI/ML, Data Science, ECE, EE, EEE, Mechanical, Civil, Chemical, Biotechnology and other branches.

PAGES/ROUTES:
- Home
- Branches
- Semester
- Resources
- Resource Details
- Student Dashboard
- My Resources
- Contribute
- Contributor Profile
- Notifications
- Profile
- Admin Dashboard
- Login/Register UI screens only

CORE UI:
1. Home hero:
“KAKSHA HUB”
“Find Your AKTU Study Material”
“CT papers, semester papers, handwritten notes, assignments, PYQs and important questions — organized in one place.”
Search bar + Explore Resources + Browse Branches/Semesters.

2. Branch selector with multiple engineering branches.
3. Semester selector: 01–08.
4. Subject cards with subject name, code, semester and resource count.
5. Resource library with:
Search + Branch + Semester + Subject + Resource Type + Sort filters.
Resource types:
CT Papers, Semester Papers, PYQs, Handwritten Notes, Assignments, Important Questions, Quantum/Question Banks, Practical/Lab, Lab Manuals, Viva Questions, Project Material, Internship Material, Study Material, Other.

6. Resource cards must show:
Title, type, subject, code, branch, semester, contributor, date, views, downloads, helpful/likes.

7. Resource details page with polished document/resource preview UI and buttons for View, Download, Save, Helpful.

8. Student Dashboard:
Good evening, Student 👋
Current Branch/Semester
Resources Shared
Approved
Pending
Downloads
Saved
Helpful Likes
Continue Learning
Recently Viewed
Recommended
Your Subjects
Contributions.

9. Contribute page with upload-form UI only:
Title, Branch, Semester, Subject, Resource Type, Description, Tags, File upload area, Submit for Review.

10. Contributor Profile with avatar, branch, semester, badges, resources shared, downloads and helpful likes.

11. Admin Dashboard UI with statistics and Pending Contributions table + Approve/Reject buttons (mock only).

DESIGN:
Premium student-tech + SaaS dashboard + academic platform.
Clean glassmorphism, subtle gradients, depth, shadows, rounded cards, modern typography, tasteful 3D hover effects and smooth micro-interactions.
Avoid excessive neon, gaming style, cartoon graphics and clutter.
Mobile-first responsive design with no horizontal scrolling.

NAVIGATION:
Desktop:
Home | Branches | Resources | Contribute | My Resources | Profile | Notifications

Logged-out UI:
Home | Branches | Resources | Login | Register

Mobile:
Bottom navigation: Home | Branches | Resources | Contribute | Profile

CREATOR SECTION:
At the VERY BOTTOM of EVERY PAGE, create a centered creator section with a LARGE photo placeholder:
[CREATOR PHOTO PLACEHOLDER]

Name: Tanishq Gupta
AI Automation Developer | B.Tech CSE Student
AI Content Creator | Exploring Agentic AI | Building Intelligent AI Solutions
B.Tech Computer Science & Engineering
Moradabad Institute of Technology, Moradabad

ONLY show LinkedIn:
https://www.linkedin.com/in/tanishq-gupta-b11688316

Do NOT add GitHub, Instagram, YouTube or any other social links.

Footer:
KAKSHA HUB
Your AKTU study material, all in one place.
© 2026 Kaksha Hub
Academic Resource Platform for AKTU Students.

TECHNICAL:
Use reusable components and clean modular structure.
Create realistic mock data for branches, semesters, subjects, resources, contributors and dashboard statistics.
All navigation and interactions should work using mock/local state.
Make buttons, filters, search, tabs, likes/save/download states visually functional.
Respect prefers-reduced-motion.
Use semantic HTML, accessible labels, keyboard navigation, focus states and good contrast.

IMPORTANT:
Do not over-engineer Phase 1.
Do not implement backend/auth/database yet.
Do not redesign repeatedly.
Focus on making the complete UI polished, consistent, responsive and ready for Phase 2.
After implementation, fix any compile/runtime errors without changing the overall design.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/68ff6ad4-6fe6-4482-b43c-d2df11b7ecec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
