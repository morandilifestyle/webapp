# 09 – Homepage Redesign Stories (Morandi Lifestyle)

> Epic Key: **HMRD** — Homepage Redesign

---

## Story List

### HMRD-1 — Sticky Header & Navigation _(3 pts)_
**As a** shopper  
**I want** a sticky, responsive header with search, wishlist, cart and profile icons  
**So that** I can navigate the site quickly on any device

**Acceptance Criteria**
1. Desktop layout: logo – center nav (Home | Shop | Stories | Conscious Care | About | Contact) – icons (Search, Wishlist, Cart badge, Profile/Login).
2. Mobile: logo + hamburger; tapping hamburger slides in drawer (left) with full nav list; search input expands full-width on focus.
3. Cart & wishlist counters update live from global `CartContext` & `WishlistContext`.
4. Header height 72 px desktop, 64 px mobile; remains visible on scroll.
5. WCAG AA color contrast; all interactive elements keyboard-focusable with visible outline.

**Definition of Done**
- Unit tests for drawer open/close and counter updates.  
- Storybook/Playwright visual tests for desktop & mobile breakpoints.  
- Lighthouse header shift ≤ 0.02 CLS.

**Suggested Sub-tasks**
- Build `<Header />` shell with Tailwind.  
- Implement slide-in `<NavDrawer />` component.  
- Connect icon badges to context.  
- Write Cypress component tests.

---

### HMRD-2 — Hero Banner Section _(3 pts)_
**As a** first-time visitor  
**I want** an immersive hero with brand message and CTAs  
**So that** I’m inspired to explore further

**Acceptance Criteria**
1. Height `100vh` (≥ lg) / `60vh` md; full-width.
2. Supports either looping MP4 ≤ 3 MB (autoplay, muted) **or** rotating static images (fade-in/out).
3. Overlaid copy: H1 “Organic Comfort. Ethical Luxury.” + primary CTA (link `/shop`) + secondary CTA (scroll to About section).
4. Trust-strip overlay displaying three icons & text (100 % GOTS cotton | Plant-based dyes | Free shipping ₹ 999+).
5. Lazy-load everything below the fold; hero images/video preloaded.

**Definition of Done**
- 95+ LCP score mobile.  
- Framer Motion fade-in animation on first paint.  
- Jest snapshot test for content render.

**Suggested Sub-tasks**
- Create `<HeroBanner />` component with props for media list.  
- Add video fallback logic (prefers video → images).  
- Style trust strip.  
- Link CTAs.

---

### HMRD-3 — Shop-by-Category Grid _(2 pts)_
**As a** shopper  
**I want** four clear category tiles  
**So that** I can jump directly to the products I need

**Acceptance Criteria**
1. Four tiles: Maternity & Baby, Healthcare & Hospital, Home & Bedding, Hospitality.
2. Rounded corners (24 px), hover zoom (desktop) / tap scale (mobile).
3. Each tile links to `/products?category=<slug>`.
4. Accessible: `role="link"` + `aria-label` describing destination; focusable via keyboard.

**Definition of Done**
- Unit test for rendering correct links.  
- Axe accessibility scan passes (no violations).

---

### HMRD-4 — Featured Products Carousel _(3 pts)_
**As a** shopper  
**I want** a swipeable carousel of best-sellers  
**So that** I can add them to cart quickly

**Acceptance Criteria**
1. Pulls JSON from `/api/homepage?section=featured` (use mock data during dev).
2. Carousel shows 2 cards on ≥ 320 px, 4 on ≥ 1024 px.
3. Uses existing `<ProductCard />`; “Add to Cart” wired to context.
4. Infinite looping and drag/swipe on touch.
5. First two images flagged `priority` for Next.js.

**Definition of Done**
- 100 % unit test coverage on pagination logic.  
- Performance budget: carousel script + styles ≤ 10 kB gzip.

**Suggested Sub-tasks**
- Integrate `keen-slider` (or similar).  
- Create API stub (`lib/api/homepage.ts`).  
- Write RTL unit tests for render counts.

---

### HMRD-5 — Seasonal / Thematic Banners _(2 pts)_
**As a** shopper  
**I want** curated seasonal banners  
**So that** I can discover time-relevant collections

**Acceptance Criteria**
1. Grid 2×2 desktop, horizontal scroll on mobile.
2. Each banner includes image, title, `Explore →` link (CMS stub JSON).
3. Lazy-loads beneath viewport; images responsive & optimized (`next/image`).

**Definition of Done**
- Visual regression tests across breakpoints.

---

### HMRD-6 — About Brand Strip _(1 pt)_
**As a** conscious consumer  
**I want** a short brand story  
**So that** I can trust product origins

**Acceptance Criteria**
1. Two-column layout: image left, copy right on desktop; stacked mobile.
2. 80–100-word text, CTA to `/about`.
3. Fade-in on viewport intersect.

---

### HMRD-7 — Newsletter + Contact CTA _(2 pts)_
**As a** visitor  
**I want** to subscribe to newsletters or WhatsApp the brand easily  
**So that** I can stay connected

**Acceptance Criteria**
1. Email field with inline validation; POST to `/api/newsletter` (create dummy endpoint).
2. Success message displayed in live region.
3. Floating WhatsApp button (pre-filled message) fixed bottom-right.
4. GDPR note below form.

**Definition of Done**
- Integration test hitting stub API returns 200.

---

### HMRD-8 — Footer Overhaul _(2 pts)_
**As a** visitor  
**I need** a structured footer with quick links and social icons  
**So that** I can reach important pages from anywhere

**Acceptance Criteria**
1. 3-column table layout per blueprint.
2. Social icons open in new tab with `rel="noopener"`.
3. Payment icons: Razorpay, Visa, UPI (SVG).
4. Privacy link navigates to `/privacy` page.

---

### HMRD-9 — Performance, SEO & Accessibility QA _(3 pts)_
**As a** QA engineer  
**I want** to ensure the redesigned homepage meets performance, SEO and accessibility targets  
**So that** users get a fast, inclusive experience and search engines can index effectively

**Acceptance Criteria**
1. Lighthouse mobile scores ≥ 95 (performance, SEO, best-practices, accessibility).
2. CLS < 0.10, LCP ≤ 2.5 s, INP ≤ 200 ms on simulated 4G.
3. Structured data (WebSite, BreadcrumbList, Product) present and valid (Rich Results Test).
4. Axe-core automated scan shows 0 critical violations.

**Suggested Sub-tasks**
- Setup `@lhci/cli` script in CI.  
- Add structured-data component.  
- Perform accessibility audit & remediate issues.

---

## Dependencies & Notes
- Stories HMRD-1 → HMRD-4 depend on existing Cart and Wishlist contexts.  
- Story HMRD-7 introduces a simple newsletter API route; full email integration is out-of-scope.  
- Use Unsplash/Pexels for placeholder images — to be replaced by designer assets before launch.  
- Feature flag available to toggle new homepage versus legacy `/home-old` for safe rollout. 