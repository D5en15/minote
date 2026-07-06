# CONTEXT.md — Minote Project Context

## Project

**Minote — The Zen Space for Modern Thinkers**

Minote คือเว็บแอปจดโน้ตออนไลน์ที่เน้นการเขียนที่เรียบง่าย ปลอดภัย และแชร์โน้ตออกไปเป็นหน้า read-only ที่ดูดีเหมือนบทความออนไลน์ MVP ต้องให้ความสำคัญกับ data safety, share privacy, autosave reliability, RLS, audit log และ Stripe subscription มากกว่าฟีเจอร์ตกแต่งขั้นสูง

## Current State

โปรเจกต์ bootstrap Phase 0, Phase 1 database foundation, Phase 2 shared server utilities และ Phase 3 auth application code เสร็จแล้วบางส่วน

สิ่งที่มีอยู่แล้ว:

* Next.js 16 App Router พร้อม TypeScript ใน `src/app`
* Tailwind CSS v4, shadcn/ui base setup และ component พื้นฐาน
* dependencies หลักสำหรับ Supabase, Stripe, Markdown, validation และ icons
* `.env.example` และ Zod env validation helper
* โครงสร้างโฟลเดอร์ `src/app`, `src/components`, `src/lib`, `src/server`, `src/types`, `src/tests`
* หน้า `/` placeholder สำหรับ guest entry
* ESLint และ formatter config เริ่มต้น
* `supabase/migrations/20260706000100_initial_schema.sql` สำหรับ Phase 1 database foundation
* `scripts/verify-phase1.mjs` สำหรับรัน migration และตรวจ RLS owner isolation
* Shared Supabase clients, auth helpers, audit/quota/rate-limit/security utilities และ Zod schemas สำหรับ API
* Auth callback route, magic-link API, logout API, `/app` session guard, login form และ Google OAuth button

สิ่งที่ยังไม่มี:

* Production redirect URL ที่ยืนยันแล้ว หลังมี production domain จริง
* Live Magic Link และ Google OAuth flow test
* Notes editor
* API routes
* Stripe integration logic
* Test suite จริง
* Deployment configuration

## Current Focus

Phase 3 application code เสร็จถึงข้อ 3.25 และ Supabase Auth local/provider setup ถูกตรวจแล้วถึงข้อ 3.3

**Current Task:** `3.4 เพิ่ม allowed redirect URL สำหรับ production`

หมายเหตุ: ข้อ 3.4 ยังไม่ติ๊กเพราะยังไม่มี production domain จริงให้ใส่ redirect URL ส่วน 3.26-3.28 ยังต้องทดสอบ browser/email/OAuth flow จริง

## What's Done

* วิเคราะห์ requirement และ blind spots แล้ว
* สร้าง PRD ระดับ MVP แล้ว
* สร้าง System Architecture Blueprint แล้ว
* แปลง PRD/Architecture เป็น micro-task backlog แล้ว
* กำหนด context เริ่มต้นสำหรับ AI-driven development แล้ว
* ตรวจ Phase 0 จากไฟล์จริงและอัปเดต checkbox ใน `TODO.md`
* เพิ่ม `.env.example` พร้อม env key สำหรับ Supabase, Stripe และ app base URL
* เพิ่ม `src/lib/env.ts` สำหรับ validate env ด้วย Zod
* เพิ่มโครงสร้าง `src/server`, `src/types`, `src/tests`
* เพิ่ม `.prettierrc.json` เพื่อให้ formatter baseline คงที่
* เพิ่ม `tailwind.config.ts` สำหรับ theme compatibility ของ Tailwind/shadcn setup
* เปลี่ยนหน้า `/` จาก Next template เป็น Minote guest entry placeholder
* อัปเดต metadata ของแอปเป็น Minote
* รัน `npm run lint` ผ่าน
* รัน `npm run build` ผ่านบน Next.js 16.2.10
* สร้างโฟลเดอร์ `supabase/migrations`
* สร้าง migration หลัก `20260706000100_initial_schema.sql`
* เพิ่ม check constraint สำหรับ `profiles.role` เป็น `user`/`admin`
* สร้างตาราง `profiles`, `plans`, `subscriptions`, `notes`, `tags`, `note_tags`, `share_links`, `note_versions`, `usage_counters`, `audit_logs`, `stripe_events`
* Seed plans: `free`, `premium_monthly`, `premium_yearly`
* เพิ่ม indexes/unique constraints ตาม Phase 1 backlog
* เปิด RLS บนตาราง user-data ตาม Phase 1 backlog
* เพิ่ม policies ให้ owner อ่าน/จัดการข้อมูลของตัวเองใน `profiles`, `notes`, `tags`, `note_tags`, `subscriptions`, `share_links`, `note_versions`
* เพิ่ม admin read policy สำหรับ `audit_logs`
* เพิ่ม trigger สร้าง `profiles` หลัง insert ใน `auth.users`
* เพิ่ม trigger อัปเดต `updated_at`
* เพิ่ม trigger กัน non-admin เปลี่ยน `profiles.role`
* ตรวจ coverage แบบ static ด้วย `rg` แล้วพบ table/index/policy/trigger ครบตามรายการที่สร้างได้
* รัน `npm run lint` ผ่านหลังเพิ่ม migration
* รัน `npm run build` ผ่านหลังเพิ่ม migration
* เพิ่ม dependency `pg` และ `@types/pg` เพื่อใช้รัน verification script กับ Postgres
* เพิ่ม `scripts/verify-phase1.mjs`
* รัน `node scripts/verify-phase1.mjs` กับ Supabase database จริงผ่าน
* ตรวจ RLS ด้วย test users ชั่วคราว 2 คนแล้ว ยืนยันว่า user A อ่าน note ของ user B ไม่ได้
* เพิ่ม `src/types/database.ts` เป็น Database/domain type กลาง
* เพิ่ม Supabase browser client helper, server client helper และ service role client helper
* เพิ่ม auth helpers: current user, require user และ admin role check
* เพิ่ม audit event constants และ audit logging service
* เพิ่ม sanitizer service สำหรับ Markdown/HTML render pipeline
* เพิ่ม share token generator และ token hash helper
* เพิ่ม rate limit interface, in-memory limiter และ store-backed adapter สำหรับ Redis/Upstash ในอนาคต
* เพิ่ม quota service สำหรับอ่าน entitlement จาก plan/subscription
* เพิ่ม API success/error response helpers
* เพิ่ม Zod schemas สำหรับ note create/update, tag input, guest import และ share settings
* รัน `npx tsc --noEmit` ผ่าน
* รัน `npm run lint` ผ่านหลังเพิ่ม Phase 2 utilities
* รัน `npm run build` ผ่านหลังเพิ่ม Phase 2 utilities
* เพิ่ม `docs/SUPABASE_AUTH_SETUP.md` สำหรับ checklist การตั้งค่า Email Magic Link, Google OAuth และ redirect URLs
* แก้ `.env` ให้ `NEXT_PUBLIC_SUPABASE_URL` เป็น Supabase HTTPS project URL ที่ถูกต้อง
* เพิ่ม `src/app/auth/callback/route.ts` สำหรับ exchange auth code เป็น session
* เพิ่ม `src/app/api/auth/magic-link/route.ts` พร้อม Zod validation, IP/email rate limit, generic response และ audit log
* เพิ่ม `src/app/api/auth/logout/route.ts` พร้อม Supabase signOut และ audit log
* เพิ่ม `src/proxy.ts` สำหรับ Next 16 Proxy guard ของ `/app`
* เพิ่มหน้า protected placeholder ที่ `src/app/app/page.tsx`
* เพิ่ม login form และ Google OAuth button ในหน้า `/`
* ทดสอบ local dev server: `GET /app` unauthenticated ได้ `307` ไป `/?redirectedFrom=%2Fapp`
* ทดสอบ local dev server: `POST /api/auth/magic-link` ด้วย email invalid ได้ `400 VALIDATION_ERROR`
* รัน `npx tsc --noEmit` ผ่านหลังเพิ่ม Phase 3 code
* รัน `npm run lint` ผ่านหลังเพิ่ม Phase 3 code
* รัน `npm run build` ผ่านหลังเพิ่ม Phase 3 code และ build แสดง `Proxy (Middleware)`
* ตรวจ `.env` แล้ว `SUPABASE_DB_URL`, `NEXT_PUBLIC_SUPABASE_URL`, anon key และ service role key มีรูปแบบถูกต้อง
* ตรวจ Supabase Auth admin generate magic link ผ่าน โดยสร้าง test user ชั่วคราวแล้วลบออก
* ตรวจ Supabase Google OAuth URL generation ผ่าน
* ทดสอบ local dev server: `POST /api/auth/logout` ได้ `200` structured response
* ทดสอบ local dev server: `/auth/callback?error=...` redirect กลับ `/` พร้อม `auth_error`

## Key Product Decisions

* MVP เป็น web app เท่านั้น
* ใช้ Guest Mode ด้วย localStorage
* หลัง login ต้อง import guest notes แบบ merge เท่านั้น ห้าม overwrite cloud notes
* ใช้ debounced autosave ไม่ยิง API ทุก keystroke
* ใช้ optimistic locking ด้วย revision number เพื่อกัน silent overwrite
* Note private by default
* Shared page ต้อง `noindex` by default
* Shared content ต้อง sanitize ก่อน render
* Trash retention เริ่มต้น 30 วัน
* Stripe เป็น payment provider สำหรับ MVP
* PromptPay, PDF คุณภาพสูง, CRDT, advanced customization และ ambient sounds เป็น Phase 2

## Recommended Tech Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Supabase Postgres
* Supabase Auth
* Supabase Row Level Security
* Stripe Billing
* Resend หรือ Supabase email provider configuration
* react-markdown
* rehype-sanitize
* Zod
* Sentry หรือ error tracking เทียบเท่า
* Playwright สำหรับ E2E

## Key Files

| File | Purpose |
|---|---|
| `REQUIREMENT_TEMPLATE.md` | Requirement source และ decision guardrails ชุดแรก |
| `PRD.md` | Product Requirement Document สำหรับ MVP |
| `SYSTEM_ARCHITECTURE_BLUEPRINT.md` | Architecture, database schema, API routes, RLS และ implementation priority |
| `TODO.md` | Micro-task backlog สำหรับควบคุมงานพัฒนา |
| `CONTEXT.md` | สถานะล่าสุดของโปรเจกต์และ current focus |
| `.env.example` | รายการ env key ที่ต้องตั้งค่าสำหรับ Supabase, Stripe และ app URL |
| `tailwind.config.ts` | Tailwind theme compatibility config สำหรับ token พื้นฐาน |
| `src/lib/env.ts` | Zod schema และ helper สำหรับ validate environment variables |
| `src/app/page.tsx` | หน้า placeholder สำหรับ guest entry |
| `src/app/layout.tsx` | Root layout และ metadata ของ Minote |
| `src/components/ui/*` | shadcn/ui base components ที่ใช้ใน Phase 0 |
| `supabase/migrations/20260706000100_initial_schema.sql` | Phase 1 database schema, seed data, RLS policies และ auth trigger |
| `scripts/verify-phase1.mjs` | Script สำหรับ apply migration และตรวจ RLS isolation บน Supabase database |
| `src/types/database.ts` | Database และ domain row types กลาง |
| `src/lib/supabase/browser.ts` | Supabase browser client helper สำหรับ client components |
| `src/server/supabase/server.ts` | Supabase server client helper ที่ใช้ async cookies ของ Next 16 |
| `src/server/supabase/service-role.ts` | Service role client สำหรับ webhook/job เท่านั้น |
| `src/server/auth.ts` | Current user, require user และ admin role helpers |
| `src/server/audit.ts` | Audit logging service |
| `src/server/audit-events.ts` | Audit event/entity constants |
| `src/server/sanitize.ts` | Markdown/HTML sanitizer helpers |
| `src/server/security/*` | Share token generation และ token hashing |
| `src/server/rate-limit/*` | Rate limit interfaces, dev in-memory limiter และ store adapter |
| `src/server/quota.ts` | Quota entitlement service |
| `src/server/api-response.ts` | Standard API success/error response helpers |
| `src/server/schemas/*` | Zod validation schemas สำหรับ API input |
| `docs/SUPABASE_AUTH_SETUP.md` | Checklist สำหรับตั้งค่า Supabase Auth provider และ redirect URLs |
| `src/app/auth/callback/route.ts` | Auth callback route สำหรับ Magic Link/OAuth PKCE code exchange |
| `src/app/api/auth/magic-link/route.ts` | Magic Link request endpoint พร้อม validation/rate limit/audit |
| `src/app/api/auth/logout/route.ts` | Logout endpoint พร้อม audit |
| `src/proxy.ts` | Next 16 Proxy guard สำหรับ `/app` |
| `src/components/auth/login-panel.tsx` | Login form และ Google OAuth action |
| `src/components/auth/logout-button.tsx` | Logout button สำหรับ protected page |
| `src/app/app/page.tsx` | Protected `/app` placeholder |

## Development Rules for AI Developer

* ทำงานตาม `TODO.md` ทีละ task เท่านั้น
* ห้ามข้าม phase ถ้า dependency ยังไม่เสร็จ
* ห้ามทำฟีเจอร์ Phase 2 ระหว่าง MVP เว้นแต่ผู้ใช้สั่งชัดเจน
* ห้ามใช้ Supabase service role key ใน client-side code
* ทุก API mutation ต้อง validate input ด้วย Zod
* ทุก owner-only action ต้องตรวจ authenticated user และ ownership
* ทุก user data table ต้องมี RLS
* ทุก shared note ต้อง sanitize content และตั้ง `noindex`
* ทุก payment webhook ต้อง verify signature และทำ idempotency
* ทุกงานที่เกี่ยวกับข้อมูลหายต้องทำแบบ conservative ก่อนเสมอ

## Next Action

ให้เพิ่ม production redirect URL เมื่อมี production domain จริง แล้วทดสอบ live flows ข้อ `3.26-3.28` ผ่าน browser/email/OAuth provider จริง
