# Raj Tiwari Portfolio — Premium Redesign

- Date: 2026-08-27
- Branch: `redesign/premium-v2`
- Status: Approved for implementation

## 1. Goal

Evolve the existing static portfolio from a BootstrapMade template into a premium engineering portfolio. Preserve every piece of real content. Invent nothing.

Positioning: Senior Backend Engineer / Technical Team Lead. Not a UI/UX designer.

## 2. Constraints

- Static site. No framework, no build step for the site itself. Deploys to Vercel exactly as it does today.
- Only real content. No invented projects, clients, numbers, testimonials, or case-study narratives.
- Performance outranks visual effect. Reduced-motion and no-WebGL paths must look deliberate, not degraded.
- Orange is an accent. Never a background.

## 3. Decisions taken

| Decision | Choice | Why |
|---|---|---|
| Stack | Vanilla ES modules + GSAP + Three.js, vendored | No build pipeline to maintain; fastest first paint; shipping React to render static content would be the less senior choice |
| Case studies | No separate pages | Only brand + URL + screenshot are known per project. Problem/Architecture/Outcome cannot be written without fabricating |
| Tech story | Evidence-backed real stack | Magento/Shopify at Lacoste/Kama scale is rarer and more credible than a generic React claim |
| GitHub | `https://github.com/rajtiwariyng` | Confirmed to exist. Credibility rail link only; repos are side projects and must not share a stage with the client work |
| Contact form | None | No backend to receive it. A silently failing form is worse than no form |
| Stack graph | 2D canvas, not WebGL | Cheaper, sharper, more legible. WebGL here would be a gimmick |

## 4. Design system

### Color

```
--ink        #080808   page black
--ink-800    #0E0E0E   raised dark surface
--paper      #FFFFFF
--orange     #FF5A1F
--rule-dark  rgba(255,255,255,.08)
--rule-light rgba(8,8,8,.10)
--muted-dark #8A8A8A   5.6:1 on --ink, AA
--muted-lite #5A5A5A
```

Contrast rule, load-bearing: **orange on white is 3.1:1 and fails AA for body text.** On light sections orange is permitted only for large display type, rules, and numerals. On black it is 6.4:1 and unrestricted. All orange-heavy moments therefore live on dark sections.

### Type

- Display: Space Grotesk 500/700
- Body: Inter 400/500
- Metadata: JetBrains Mono 400/500 — section numerals, stat digits, stack labels, eyebrow labels. This is the element that makes the site read as an engineer's.

Scale via `clamp()`. Hero to 6.5rem, tracking -0.035em, line-height 0.95.

### Layout

12 column, 1440px max, gutter `clamp(1.25rem, 4vw, 5rem)`. Asymmetric placement (cols 1–7 / 5–12), rarely centered. The asymmetry is what separates editorial from SaaS-landing-page.

### Section rhythm

Dark sections carry impact, light sections carry reading:

```
Hero DARK -> Proof DARK -> What I Build LIGHT -> Selected Work DARK ->
Stack DARK -> Experience LIGHT -> How I Work LIGHT -> About DARK ->
Contact DARK -> Footer DARK
```

## 5. Information architecture

`index.html`

1. Sticky nav
2. Hero + 3D system graph
3. Proof strip (3 real numbers)
4. What I Build (6 rows)
5. Selected Work (6 flagships, sticky)
6. Stack (canvas graph)
7. Experience (timeline)
8. How I Work (6 steps)
9. About
10. Contact (3D field)
11. Footer

`work.html` — all 16 projects as an editorial index. Replaces `portfolio-projects.html`, which becomes a redirect to preserve inbound links.

Work is placed **before** Stack: proof of complexity persuades more than a technology list, and once the work is believed the stack reads as *how* rather than as claims.

## 6. Content mapping — provenance of every claim

All content below already exists on the live site. Nothing is added.

**Proof:** 10+ years, 70+ projects delivered, 15+ team members led.

**What I Build** — six rows, all lifted from the existing "Professional Skills" block:

```
01 Backend Architecture           Laravel, PHP, CodeIgniter, MySQL, MongoDB
02 API & Integration Engineering  REST, Razorpay, Stripe, shipping/logistics,
                                  SMS/Email/WhatsApp, ERP & CRM
03 E-commerce Platform Eng.       Magento, Shopify, WordPress, OpenCart
04 Automation & Data Pipelines    queues, schedulers, crawling, extraction, Python
05 AI Integration                 AI APIs, chatbots, text processing, workflows
06 Cloud & Deployment             AWS EC2/S3/RDS/SES, Docker, Nginx, CI/CD
```

**Selected Work** — 6 flagships, each shipping on brand + sector + live URL + visual only: Lacoste, Kama Ayurveda, Merino Laminates, TOTO India, Dulux Professional, HeroFinCorp. An optional one-line "what I did" slot exists per project and is to be supplied by Raj. **It is never to be written by the implementer.**

**Experience** — 5 real roles, dates and companies unchanged. Bullets may be **cut** for repetition or junior tone (both Abhikant and Karmatech currently open with an identical sentence; "Participated in code reviews..." reads junior). Bullets are never added or rewritten upward.

**Stack** — the existing 22 technologies, regrouped into 5 hubs.

**About** — existing 5 paragraphs condensed to 3, wording preserved.

**Contact** — WhatsApp +91 78277 95334, LinkedIn /in/rajkrtiwari, rajtiwariyng@gmail.com, github.com/rajtiwariyng, Raj-Tiwari-Resume.pdf.

## 7. Motion

GSAP + ScrollTrigger. One shared token set so the whole site feels like one system.

Budget: 70% static / 20% subtle / 10% wow.

Four wow moments only: hero entrance, Selected Work pin, stack graph waking, contact bloom.

Hero entrance (~2.4s): grid fade 0.6s → orange rule draws 0.4s → headline masked lines staggered 0.08s → paragraph → canvas fades in over 1.2s → CTAs → scroll cue. **The headline is present and readable in the DOM before JS runs.**

## 8. 3D

Two Three.js scenes.

- **Hero "System Graph"**: ~60 nodes in a loose lattice, thin edges, orange pulses travelling edges. Cursor parallax ±4°, scroll drift. Reads as API topology.
- **Contact "Field"**: drifting particle plane, orange radial bloom. Ambient.

Guardrails, all mandatory:

- dynamic `import()` behind IntersectionObserver
- WebGL capability detect → static SVG lattice fallback
- `setPixelRatio(Math.min(dpr, 2))`
- rAF paused when offscreen or `document.hidden`
- `prefers-reduced-motion` → fallback, WebGL context never created
- disabled below 900px

## 9. Mobile

No WebGL, no custom cursor, no parallax. Single column. Selected Work unpins to a vertical stack. Stack graph becomes grouped hairline lists. Type scale preserved via clamp. Hero complete and readable at 360px.

## 10. Performance

Ranked by real impact:

1. **36MB of PNGs.** Convert to AVIF + WebP, 3 widths each, `loading="lazy"`, explicit width/height to kill CLS. Target: 36MB → under 2MB.
2. Devicon `@latest` CDN — deleted; ~20 icons become inline SVG.
3. Three.js ~150KB gz, lazy, never on the critical path.
4. GSAP ~50KB + ScrollTrigger.
5. Fonts: three families × 100–900 → three families × 7 weights total, swap, preconnect.

Targets: LCP < 2.0s, CLS < 0.05, Lighthouse mobile Performance 90+ with 3D active.

## 11. Removals

**UI:** typed.js rotating text, "Creative", floating Develop/Code/Execute cards, all progress bars and percentages, Devicon logo grid, isotope filters, "Resume" as a section title, preloader, scroll-top arrow.

**Dependencies, all of them:** Bootstrap CSS+JS, AOS, Typed.js, Isotope, imagesLoaded, GLightbox, Swiper, PureCounter, Waypoints, php-email-form, Devicon.

**Files:** root `vendor/` (11MB, unreferenced), `assets/img/person/` (8 stock avatars), `assets/img/services/`, `top-img.png1`, `top-img1.png`, `columbia.png`, `satya.png`, `profile-square-11.webp`. ~20MB before any design change.

## 12. Accessibility

Real alt text per project image (currently every one is `alt="Portfolio Item"`). Filters/rows become real buttons. Visible focus rings on every interactive element. Semantic heading order. Focus triggers the same reveal as hover in What I Build. Custom cursor never suppresses the native caret on text inputs.

## 13. SEO

Rewritten title and description. Drop `keywords`. Add OG, Twitter card, canonical, `sitemap.xml`, `robots.txt`, and Person + ProfilePage JSON-LD with `sameAs` covering LinkedIn and GitHub. Generate a 1200×630 OG image in the design system.

## 14. File structure

```
index.html
work.html
portfolio-projects.html      redirect -> work.html
robots.txt  sitemap.xml  vercel.json
assets/css/{tokens,base,main}.css
assets/js/main.js
assets/js/modules/{nav,motion,cursor,work,counters,stack-graph}.js
assets/js/scenes/{hero-system,contact-field}.js
assets/vendor/{gsap,three}/  pinned, vendored
assets/img/                  optimised
tools/optimize-images.mjs    dev only, output committed
```

## 15. Out of scope

Case study detail pages. Contact form. Blog. CMS. Any claim about a project beyond brand, sector, live URL and visual.
