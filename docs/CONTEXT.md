# CONTEXT.md — Minote Project Context

## Project

**Minote — The Zen Space for Modern Thinkers**

Minote คือเว็บแอปจดโน้ตออนไลน์ที่เน้นการเขียนที่เรียบง่าย ปลอดภัย และแชร์โน้ตออกไปเป็นหน้า read-only ที่ดูดีเหมือนบทความออนไลน์ MVP ต้องให้ความสำคัญกับ data safety, share privacy, autosave reliability, RLS, audit log และ Stripe subscription มากกว่าฟีเจอร์ตกแต่งขั้นสูง

## Current State

โปรเจกต์ bootstrap Phase 0, Phase 1 database foundation, Phase 2 shared server utilities, Phase 3 auth/session, Phase 4 app shell/navigation, Phase 5 notes backend, Phase 6 notes frontend, Phase 7 autosave/conflict handling, Phase 8 tags/search, Phase 9 guest mode/import, Phase 10 trash, Phase 11 sharing/public read page, Phase 12 markdown export, Phase 13 billing, Phase 14 settings และ Phase 15 admin & audit เสร็จแล้ว พร้อม production deployment ที่ `https://minote-nu.vercel.app/`

สิ่งที่มีอยู่แล้ว:

* Next.js 16 App Router พร้อม TypeScript ใน `src/app`
* Tailwind CSS v4, shadcn/ui base setup และ component พื้นฐาน
* dependencies หลักสำหรับ Supabase, Stripe, Markdown, validation และ icons
* `.env.example` และ Zod env validation helper
* โครงสร้างโฟลเดอร์ `src/app`, `src/components`, `src/lib`, `src/server`, `src/types`, `src/tests`
* หน้า `/` เป็น guest editor สำหรับ local drafts ก่อน login
* ESLint และ formatter config เริ่มต้น
* `supabase/migrations/20260706000100_initial_schema.sql` สำหรับ Phase 1 database foundation
* `scripts/verify-phase1.mjs` สำหรับรัน migration และตรวจ RLS owner isolation
* Shared Supabase clients, auth helpers, audit/quota/rate-limit/security utilities และ Zod schemas สำหรับ API
* Auth callback route ที่รองรับทั้ง PKCE `code` และ email OTP `token_hash`, magic-link API, logout API, `/app` session guard, login form และ Google OAuth button
* Phase 3 verification script สำหรับทดสอบ local auth guard, callback error, Magic Link login, Google OAuth URL generation และ logout guard
* Protected `/app` layout พร้อม sidebar, top bar, user menu, logout action, mobile navigation, loading state, empty workspace state และ theme toggle ที่เก็บค่าใน localStorage
* Placeholder routes สำหรับ `/app/trash`, `/app/billing` และ `/app/settings`
* Notes backend ครบชุด: repositories, services, Notes API routes, quota/usage counter checks, revision conflict handling, trash/restore/permanent delete และ integration verifier
* Notes frontend ครบชุดสำหรับ MVP foundation: note list, selected state, search, create, editor surface, note detail loading, not found state และ delete flow
* Autosave client flow: debounced save, offline draft persistence, online retry, rate-limit backoff และ revision conflict dialog พร้อม keep mine / keep server / manual merge path
* Tags flow ครบชุดสำหรับ MVP: normalize tag, attach/detach tags, sidebar filter by tag, tag chips ใน editor/note list และ tags API พร้อม case-insensitive reuse
* Guest mode/import flow ครบชุดสำหรับ MVP: guest editor บน `/`, localStorage autosave, import preview/confirm APIs, merge-only import หลัง login, title collision rename และ import dialog ใน `/app`
* Trash flow ครบชุดสำหรับ MVP: trash page จริง, restore/permanent delete actions, empty state, purge job และ protected trigger route สำหรับลบ trashed notes ที่หมด retention
* Share flow ครบชุดสำหรับ MVP: create/revoke/regenerate share link, public `/share/[token]` read-only page, noindex/CSP protection, sanitized markdown render, editor share controls และ end-to-end verifier
* Settings & Deletion flow ครบชุดสำหรับ MVP: หน้า `/app/settings` แสดงอีเมล ข้อมูลโปรไฟล์ ฟอร์มแก้ไข Display Name, API profile status & update logic, ส่วนอธิบาย data export policy, ปุ่มลบบัญชี (Danger Zone) พร้อมหน้าต่างยืนยัน, API route `POST /api/account/delete-request` ทำการ mark `deleted_at`, revoke share links และบันทึก audit logging e2e
* Stripe integration logic และ Billing UI ครบชุดสำหรับ MVP: checkout, status endpoints, webhook sync

สิ่งที่ยังไม่มี:

* Production Magic Link email-send ยังต้องตรวจต่อ เพราะ email valid บน production ยังได้ `INTERNAL_ERROR`
* Stripe integration logic
* Test suite จริง
* Deployment configuration

## Current Focus

เริ่ม Phase 16: Security Hardening

**Current Task:** 16.1 เพิ่ม global security headers

หมายเหตุ: ระบบ Admin Portal และระบบสืบค้น Audit Logs สำหรับการบริหารจัดการระบบ (พร้อมการกรองข้อมูล การทำ pagination และความมั่นคงปลอดภัยด้านการเปิดเผยข้อมูลผู้ใช้งาน) ได้รับการพัฒนา ตรวจสอบ และทดสอบ verify-phase15 ผ่านเรียบร้อยแล้ว ลำดับถัดไปคือเริ่มทำระบบป้องกันความปลอดภัย Security Hardening แบบ Global setup

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
* เพิ่ม support ใน `/auth/callback` สำหรับ Supabase email OTP callback แบบ `token_hash`/`type`
* เพิ่ม `scripts/verify-phase3.mjs` และ npm script `npm run verify:phase3`
* รัน `npm run verify:phase3` ผ่าน โดยตรวจ unauthenticated `/app` redirect, magic-link validation, callback error redirect, Google OAuth URL generation, Magic Link login session และ logout แล้วเข้า `/app` ไม่ได้
* Deploy production ที่ `https://minote-nu.vercel.app/`
* ตั้ง production redirect URL ฝั่ง Supabase และ Google Cloud แล้ว
* ตรวจ production `GET /` ได้ `200`
* ตรวจ production `/auth/callback?error=...` ได้ `307` กลับ `/` พร้อม `auth_error`
* ตรวจ production `POST /api/auth/magic-link` ด้วย email invalid ได้ `400 VALIDATION_ERROR`
* ตรวจ production ซ้ำหลังเพิ่ม env: `GET /app` unauthenticated ได้ `307` ไป `/?redirectedFrom=%2Fapp`
* ตรวจ production ซ้ำหลังเพิ่ม env: `POST /api/auth/logout` ได้ `200` structured response
* ตรวจ production Google OAuth authorize flow สำหรับ `https://minote-nu.vercel.app/auth/callback` แล้ว Supabase ส่ง `302` ไป `accounts.google.com/o/oauth2/v2/auth`
* ยังพบ production `POST /api/auth/magic-link` ด้วย email valid ได้ `500 INTERNAL_ERROR` จาก email-send path จึงต้องตรวจ email provider/template/Supabase Auth logs เพิ่มก่อนใช้ Magic Link production จริง
* เพิ่ม `src/app/app/layout.tsx` เป็น protected layout กลางสำหรับ `/app`
* เพิ่ม `src/components/app/app-shell.tsx` สำหรับ sidebar, top bar, user menu, logout action, mobile navigation และ theme toggle
* ปรับ `src/app/app/page.tsx` ให้เป็น workspace empty state
* เพิ่ม `src/app/app/loading.tsx` สำหรับ loading state ของ app shell
* เพิ่ม placeholder routes `src/app/app/trash/page.tsx`, `src/app/app/billing/page.tsx` และ `src/app/app/settings/page.tsx`
* รัน `npx tsc --noEmit`, `npm run lint` และ `npm run build` ผ่านหลังเพิ่ม Phase 4
* เพิ่ม `src/server/repositories/notes.ts` สำหรับ list/get/create/update/trash/restore/permanent delete note และ revoke share links
* เพิ่ม `src/server/services/notes.ts` สำหรับ ownership, quota checks, usage counter increment, audit log และ revision conflict handling
* เพิ่ม query/param schemas สำหรับ Notes API ใน `src/server/schemas/notes.ts`
* เพิ่ม route handlers `src/app/api/notes/route.ts`, `src/app/api/notes/[noteId]/route.ts`, `src/app/api/notes/[noteId]/restore/route.ts` และ `src/app/api/notes/[noteId]/permanent/route.ts`
* ปรับ `REVISION_CONFLICT` ให้ตอบ HTTP `409` พร้อม `serverRevision` และ `serverNote`
* เพิ่ม `scripts/verify-phase5.mjs` และ npm script `npm run verify:phase5`
* รัน `npx tsc --noEmit`, `npm run lint`, `npm run build` และ `npm run verify:phase5` ผ่านหลังเพิ่ม Phase 5
* เพิ่ม `src/components/notes/note-list.tsx` และ `src/components/notes/note-list-item.tsx`
* เพิ่ม `src/components/notes/note-workspace.tsx` สำหรับ notes list, search, create flow, editor surface, delete dialog และ note detail loading
* เพิ่ม route `src/app/app/notes/[noteId]/page.tsx` สำหรับ selected note editor
* ปรับ `src/app/app/page.tsx` ให้แสดง notes workspace แทน empty state เดิม
* เพิ่ม `scripts/verify-phase6.mjs` และ npm script `npm run verify:phase6`
* รัน `npx tsc --noEmit`, `npm run lint`, `npm run build` และ `npm run verify:phase6` ผ่านหลังเพิ่ม Phase 6
* เพิ่ม `src/components/notes/use-debounced-autosave.ts` สำหรับ autosave debounce, local draft persistence, offline/online recovery และ conflict handling
* ปรับ `src/components/notes/note-workspace.tsx` ให้ editor แสดงสถานะ Saving/Saved/Save failed/Offline และ conflict dialog พร้อม keep mine / keep server / manual copy/merge
* เพิ่ม `scripts/verify-phase7.mjs` และ npm script `npm run verify:phase7`
* รัน `npx tsc --noEmit`, `npm run lint`, `npm run build` และ `npm run verify:phase7` ผ่านหลังเพิ่ม Phase 7
* เพิ่ม `src/server/tags.ts` สำหรับ normalize tag และกำหนด tag limit ต่อ note
* เพิ่ม `src/server/repositories/tags.ts` และ `src/server/services/tags.ts` สำหรับ list/find-or-create/attach/detach tag และ hydrate notes ให้พก tags มาด้วย
* เพิ่ม route handlers `src/app/api/tags/route.ts`, `src/app/api/notes/[noteId]/tags/route.ts` และ `src/app/api/notes/[noteId]/tags/[tagId]/route.ts`
* ปรับ notes repository, notes services และ note payloads ให้ list/detail/create/update ส่ง `tags` มาพร้อม note
* เพิ่ม `src/components/notes/tag-chip.tsx` และขยาย `src/components/notes/note-workspace.tsx` / `note-list-item.tsx` ให้รองรับ tag input, remove action, suggested tags และ sidebar tag filter
* เพิ่ม `scripts/verify-phase8.mjs` และ npm script `npm run verify:phase8`
* รัน `npx tsc --noEmit`, `npm run lint`, `npm run build` และ `npm run verify:phase8` ผ่านหลังเพิ่ม Phase 8
* เพิ่ม `src/types/guest-note.ts` และ `src/lib/guest-notes.ts` สำหรับ guest note model, localStorage key และ helper read/write/clear/import requests
* เพิ่ม `src/components/guest/guest-workspace.tsx` เพื่อแทนหน้า `/` เดิมด้วย guest editor, local autosave, create draft และ guest-mode warning
* เพิ่ม `src/server/services/guest-import.ts` สำหรับ preview/confirm merge-only import, title collision rename และ audit log
* เพิ่ม route handlers `src/app/api/import/guest/preview/route.ts` และ `src/app/api/import/guest/confirm/route.ts`
* เพิ่ม `src/components/guest/guest-import-prompt.tsx` และผูกเข้ากับ `src/components/notes/note-workspace.tsx` เพื่อ detect guest notes หลัง login แล้วเปิด import confirmation dialog
* ปรับ `src/components/auth/login-panel.tsx` ให้แสดงจำนวน guest notes ที่รอ import
* เพิ่ม `scripts/verify-phase9.mjs` และ npm script `npm run verify:phase9`
* รัน `npx tsc --noEmit`, `npm run lint`, `npm run build` และ `npm run verify:phase9` ผ่านหลังเพิ่ม Phase 9
* เพิ่ม `src/components/trash/trash-workspace.tsx` สำหรับแสดง trashed notes, delete-after date, restore action, permanent delete action และ empty state
* ปรับ `src/app/app/trash/page.tsx` จาก placeholder เป็น trash workspace จริง
* เพิ่ม `listExpiredTrashedNoteIds` และ `permanentlyDeleteNoteForSystem` ใน `src/server/repositories/notes.ts`
* เพิ่ม `purgeExpiredTrashedNotes` ใน `src/server/services/notes.ts` เพื่อ query และ purge notes ที่ `delete_after < now()` พร้อม audit log
* เพิ่ม protected route `src/app/api/jobs/purge-trashed-notes/route.ts` โดยใช้ `Authorization: Bearer <MINOTE_JOB_SECRET>` สำหรับ trigger purge job
* เพิ่ม `scripts/verify-phase10.mjs` และ npm script `npm run verify:phase10`
* รัน `npx tsc --noEmit`, `npm run lint`, `npm run build` และ `npm run verify:phase10` ผ่านหลังเพิ่ม Phase 10
* เพิ่ม `src/server/repositories/shares.ts` สำหรับ create/revoke/lookup share link, touch last access และ hydrate active share info เข้า note payload
* เพิ่ม `src/server/services/shares.ts` สำหรับ owner check, share token generation/hash, create/revoke/regenerate flow และ public shared note lookup
* เพิ่ม route handlers `src/app/api/notes/[noteId]/share/route.ts` และ `src/app/api/notes/[noteId]/share/regenerate/route.ts`
* เพิ่มหน้า `src/app/share/[token]/page.tsx` และ `src/components/share/*` สำหรับ public read-only shared note, sanitized markdown render และ theme toggle
* ปรับ `src/components/notes/note-workspace.tsx` ให้มี share dialog, copy link, revoke และ regenerate actions
* ปรับ `src/server/repositories/notes.ts` และ `src/types/database.ts` ให้ note payload ส่ง `activeShareLink` กลับไปใช้ใน editor ได้
* ปรับ `src/proxy.ts` ให้รองรับ `/share/:path*` พร้อม `Content-Security-Policy`, `X-Robots-Tag` และ cache policy สำหรับ public page
* แก้ `src/server/request.ts` ให้ share URL ใช้ request origin ก่อน env fallback เพื่อให้ local/prod flow สร้าง URL ถูก host จริง
* เพิ่ม `scripts/verify-phase11.mjs` และ npm script `npm run verify:phase11`
* รัน `npx tsc --noEmit`, `npm run lint`, `npm run build` และ `npm run verify:phase11` ผ่านหลังเพิ่ม Phase 11

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
| `src/app/page.tsx` | หน้า guest editor หลักที่ mount guest workspace สำหรับ local drafts ก่อน login |
| `src/app/layout.tsx` | Root layout และ metadata ของ Minote |
| `src/components/ui/*` | shadcn/ui base components ที่ใช้ใน Phase 0 |
| `supabase/migrations/20260706000100_initial_schema.sql` | Phase 1 database schema, seed data, RLS policies และ auth trigger |
| `scripts/verify-phase1.mjs` | Script สำหรับ apply migration และตรวจ RLS isolation บน Supabase database |
| `scripts/verify-phase3.mjs` | Script สำหรับตรวจ Phase 3 auth/session flows กับ dev server และ Supabase test user ชั่วคราว |
| `scripts/verify-phase5.mjs` | Script สำหรับตรวจ Notes API create/update/conflict/delete/restore แบบ end-to-end |
| `scripts/verify-phase6.mjs` | Script สำหรับตรวจ workspace/editor routes และ controls ของ Phase 6 |
| `scripts/verify-phase7.mjs` | Script สำหรับตรวจ autosave PATCH payload, revision conflict response และ editor autosave status surface |
| `scripts/verify-phase8.mjs` | Script สำหรับตรวจ tag attach/detach/filter, case-insensitive reuse และ editor tag UI |
| `scripts/verify-phase9.mjs` | Script สำหรับตรวจ guest import preview/confirm, title collision rename, imported tags และ guest workspace UI |
| `scripts/verify-phase10.mjs` | Script สำหรับตรวจ trash list, restore, permanent delete และ purge job protected route |
| `scripts/verify-phase11.mjs` | Script สำหรับตรวจ share create/public read/regenerate/revoke/trash invalidation และ XSS-safe rendering |
| `scripts/verify-phase12.mjs` | Script สำหรับตรวจ Markdown export API, safe UTF-8 filename, owner authentication, และ audit logging |
| `scripts/verify-phase13.mjs` | Script สำหรับตรวจ Stripe integration, checkout/portal redirects, webhook status sync, and webhook idempotency |
| `scripts/verify-phase14.mjs` | Script สำหรับตรวจ profile status info, display name mutation, account deletion requests, RLS state hooks, and revocation audits |
| `scripts/verify-phase15.mjs` | Script สำหรับตรวจ admin role queries, audit logs filter, data pagination, and user notes details data masking protection |
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
| `src/server/repositories/notes.ts` | Repository layer สำหรับ query และ mutation ของ notes/share-links ที่เกี่ยวข้อง |
| `src/server/repositories/shares.ts` | Repository layer สำหรับ share links, public lookup และ active share summary ของ note |
| `src/server/services/notes.ts` | Notes business logic: ownership, quota, usage counter, audit และ revision conflict |
| `src/server/services/shares.ts` | Share business logic สำหรับ create/revoke/regenerate/public read flow และ audit log |
| `src/server/tags.ts` | Server utility สำหรับ normalize tag และกำหนดข้อจำกัดจำนวน tags ต่อ note |
| `src/server/repositories/tags.ts` | Repository layer สำหรับ list/find-or-create/attach/detach tag และ hydrate notes ด้วย tags |
| `src/server/services/tags.ts` | Tag business logic สำหรับ owner check, tag limit, attach/detach flow และ audit metadata |
| `src/server/services/guest-import.ts` | Guest import business logic สำหรับ preview merge, title collision rename, confirm import และ audit log |
| `src/components/trash/trash-workspace.tsx` | Trash UI สำหรับ list trashed notes, restore/permanent delete actions, delete-after date และ empty state |
| `src/components/share/shared-note-view.tsx` | Public shared note UI แบบ read-only พร้อม sanitized markdown render |
| `src/components/share/share-theme-toggle.tsx` | Theme toggle client control สำหรับ public shared page |
| `src/components/notes/use-debounced-autosave.ts` | Client autosave hook สำหรับ debounce save, local draft persistence, online retry และ conflict resolution state |
| `src/lib/guest-notes.ts` | Client helper สำหรับ guest notes localStorage, import preview และ import confirm requests |
| `src/types/guest-note.ts` | Guest note type สำหรับ local drafts ก่อน login |
| `docs/SUPABASE_AUTH_SETUP.md` | Checklist สำหรับตั้งค่า Supabase Auth provider และ redirect URLs |
| `src/app/auth/callback/route.ts` | Auth callback route สำหรับ OAuth PKCE code exchange และ Magic Link OTP token hash verification |
| `src/app/api/auth/magic-link/route.ts` | Magic Link request endpoint พร้อม validation/rate limit/audit |
| `src/app/api/auth/logout/route.ts` | Logout endpoint พร้อม audit |
| `src/proxy.ts` | Next 16 Proxy guard สำหรับ `/app` |
| `src/components/auth/login-panel.tsx` | Login form และ Google OAuth action |
| `src/components/guest/guest-workspace.tsx` | Guest editor workspace บน `/` พร้อม local autosave, create draft และ login CTA |
| `src/components/guest/guest-import-prompt.tsx` | Import dialog ที่แสดงหลัง login เมื่อพบ guest notes ค้างใน localStorage |
| `src/components/auth/logout-button.tsx` | Logout button สำหรับ protected page |
| `src/components/app/app-shell.tsx` | Client app shell สำหรับ sidebar, top bar, user menu, responsive navigation และ theme toggle |
| `src/app/app/layout.tsx` | Protected `/app` layout ที่โหลด profile และครอบ children ด้วย app shell |
| `src/components/notes/note-workspace.tsx` | Workspace/editor UI ที่รวม note list, search, create, delete และ autosave/conflict UX ของ MVP |
| `src/app/app/page.tsx` | Workspace route หลักที่ mount notes frontend surface |
| `src/app/app/notes/[noteId]/page.tsx` | Selected note route ที่ preload note detail สำหรับ editor |
| `src/app/app/loading.tsx` | Loading state สำหรับ app shell |
| `src/app/app/trash/page.tsx` | Trash placeholder page |
| `src/app/app/billing/page.tsx` | Billing placeholder page |
| `src/app/app/settings/page.tsx` | Settings placeholder page |
| `src/components/notes/note-list.tsx` | Notes list component พร้อม loading/empty/search result states |
| `src/components/notes/note-list-item.tsx` | Note list item component พร้อม title, updated time และ selected state |
| `src/components/notes/tag-chip.tsx` | Reusable tag chip component สำหรับ sidebar filter, note list และ editor tags |
| `src/components/notes/note-workspace.tsx` | Main notes frontend surface สำหรับ list, editor, create/search/delete flows |
| `src/app/api/notes/route.ts` | List/create notes endpoint พร้อม query filters และ quota checks |
| `src/app/api/notes/[noteId]/route.ts` | Get/update/delete note endpoint พร้อม revision conflict response |
| `src/app/api/notes/[noteId]/restore/route.ts` | Restore note endpoint |
| `src/app/api/tags/route.ts` | List tags endpoint สำหรับ sidebar filter และ editor suggestions |
| `src/app/api/notes/[noteId]/tags/route.ts` | Attach tag endpoint สำหรับ editor |
| `src/app/api/notes/[noteId]/tags/[tagId]/route.ts` | Detach tag endpoint สำหรับ editor |
| `src/app/api/import/guest/preview/route.ts` | Guest import preview endpoint สำหรับ validate payload, count imports และ title collision rename preview |
| `src/app/api/import/guest/confirm/route.ts` | Guest import confirm endpoint สำหรับ merge guest drafts เข้า cloud notes และ import tags |
| `src/app/api/jobs/purge-trashed-notes/route.ts` | Protected purge job endpoint สำหรับลบ trashed notes ที่หมด retention ด้วย job secret |
| `src/app/api/notes/[noteId]/permanent/route.ts` | Permanent delete endpoint |
| `src/app/api/notes/[noteId]/share/route.ts` | Create/revoke share link endpoint สำหรับ owner ของ note |
| `src/app/api/notes/[noteId]/share/regenerate/route.ts` | Regenerate share link endpoint สำหรับ owner ของ note |
| `src/app/share/[token]/page.tsx` | Public shared note page ที่ render note แบบ read-only และไม่ index |

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

เริ่ม Phase 12 Markdown Export ตาม `TODO.md` โดยเริ่มที่ `12.1 สร้าง export service สำหรับ Markdown`
