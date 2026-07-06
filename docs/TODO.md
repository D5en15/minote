# TODO.md — Minote Development Backlog

> กฎการทำงาน: ทำทีละ task ตามลำดับเลข ห้ามข้าม dependency สำคัญ และหลังจบแต่ละ task ต้อง build/test เฉพาะส่วนที่เกี่ยวข้องก่อนติ๊กเสร็จ

## Phase 0: Project Bootstrap

- [x] 0.1 สร้างโปรเจกต์ Next.js App Router ด้วย TypeScript
- [x] 0.2 ติดตั้ง Tailwind CSS
- [x] 0.3 ตั้งค่า `tailwind.config` ให้รองรับ theme พื้นฐาน
- [x] 0.4 ติดตั้ง shadcn/ui
- [x] 0.5 เพิ่ม component พื้นฐานจาก shadcn/ui: Button
- [x] 0.6 เพิ่ม component พื้นฐานจาก shadcn/ui: Input
- [x] 0.7 เพิ่ม component พื้นฐานจาก shadcn/ui: Textarea
- [x] 0.8 เพิ่ม component พื้นฐานจาก shadcn/ui: Dialog
- [x] 0.9 เพิ่ม component พื้นฐานจาก shadcn/ui: Dropdown Menu
- [x] 0.10 เพิ่ม component พื้นฐานจาก shadcn/ui: Toast/Sonner
- [x] 0.11 ติดตั้ง dependencies หลัก: `@supabase/supabase-js`
- [x] 0.12 ติดตั้ง dependencies หลัก: Supabase SSR helper สำหรับ Next.js
- [x] 0.13 ติดตั้ง dependencies หลัก: `zod`
- [x] 0.14 ติดตั้ง dependencies หลัก: `stripe`
- [x] 0.15 ติดตั้ง dependencies หลัก: `react-markdown`
- [x] 0.16 ติดตั้ง dependencies หลัก: `rehype-sanitize`
- [x] 0.17 ติดตั้ง dependencies หลัก: `lucide-react`
- [x] 0.18 สร้างไฟล์ `.env.example`
- [x] 0.19 เพิ่ม env key สำหรับ Supabase URL
- [x] 0.20 เพิ่ม env key สำหรับ Supabase anon key
- [x] 0.21 เพิ่ม env key สำหรับ Supabase service role key
- [x] 0.22 เพิ่ม env key สำหรับ Stripe secret key
- [x] 0.23 เพิ่ม env key สำหรับ Stripe webhook secret
- [x] 0.24 เพิ่ม env key สำหรับ app base URL
- [x] 0.25 สร้าง utility validate env ด้วย Zod
- [x] 0.26 สร้างโครงสร้างโฟลเดอร์ `src/app`
- [x] 0.27 สร้างโครงสร้างโฟลเดอร์ `src/components`
- [x] 0.28 สร้างโครงสร้างโฟลเดอร์ `src/lib`
- [x] 0.29 สร้างโครงสร้างโฟลเดอร์ `src/server`
- [x] 0.30 สร้างโครงสร้างโฟลเดอร์ `src/types`
- [x] 0.31 สร้างโครงสร้างโฟลเดอร์ `src/tests`
- [x] 0.32 ตั้งค่า ESLint ให้ผ่านบนโปรเจกต์เริ่มต้น
- [x] 0.33 ตั้งค่า Prettier หรือ formatter ให้รูปแบบโค้ดนิ่ง
- [x] 0.34 สร้างหน้า `/` แบบ placeholder สำหรับ guest entry
- [x] 0.35 รัน build ครั้งแรกและแก้ error จาก setup

## Phase 1: Database Schema & Supabase Foundation

- [x] 1.1 สร้างโฟลเดอร์ `supabase/migrations`
- [x] 1.2 เขียน migration สร้าง enum หรือ check constraint สำหรับ role: `user`, `admin`
- [x] 1.3 เขียน migration สร้างตาราง `profiles`
- [x] 1.4 เพิ่ม unique index ให้ `profiles.email`
- [x] 1.5 เขียน migration สร้างตาราง `plans`
- [x] 1.6 seed plan `free`
- [x] 1.7 seed plan `premium_monthly`
- [x] 1.8 seed plan `premium_yearly`
- [x] 1.9 เขียน migration สร้างตาราง `subscriptions`
- [x] 1.10 เพิ่ม index ให้ `subscriptions.user_id`
- [x] 1.11 เพิ่ม unique index ให้ `subscriptions.provider_subscription_id`
- [x] 1.12 เขียน migration สร้างตาราง `notes`
- [x] 1.13 เพิ่ม index ให้ `notes.user_id`
- [x] 1.14 เพิ่ม index ให้ `notes.status`
- [x] 1.15 เพิ่ม index ให้ `notes.updated_at`
- [x] 1.16 เขียน migration สร้างตาราง `tags`
- [x] 1.17 เพิ่ม unique constraint `(user_id, normalized_name)` ใน `tags`
- [x] 1.18 เขียน migration สร้างตาราง `note_tags`
- [x] 1.19 เขียน migration สร้างตาราง `share_links`
- [x] 1.20 เพิ่ม unique index ให้ `share_links.token_hash`
- [x] 1.21 เพิ่ม index ให้ `share_links.note_id`
- [x] 1.22 เขียน migration สร้างตาราง `note_versions`
- [x] 1.23 เพิ่ม index ให้ `note_versions.note_id`
- [x] 1.24 เพิ่ม index ให้ `note_versions.expires_at`
- [x] 1.25 เขียน migration สร้างตาราง `usage_counters`
- [x] 1.26 เพิ่ม unique constraint `(user_id, date_key)` ใน `usage_counters`
- [x] 1.27 เขียน migration สร้างตาราง `audit_logs`
- [x] 1.28 เพิ่ม index ให้ `audit_logs.event_type`
- [x] 1.29 เพิ่ม index ให้ `audit_logs.created_at`
- [x] 1.30 เขียน migration สร้างตาราง `stripe_events`
- [x] 1.31 เปิด Row Level Security บน `profiles`
- [x] 1.32 เปิด Row Level Security บน `subscriptions`
- [x] 1.33 เปิด Row Level Security บน `notes`
- [x] 1.34 เปิด Row Level Security บน `tags`
- [x] 1.35 เปิด Row Level Security บน `note_tags`
- [x] 1.36 เปิด Row Level Security บน `share_links`
- [x] 1.37 เปิด Row Level Security บน `note_versions`
- [x] 1.38 เปิด Row Level Security บน `usage_counters`
- [x] 1.39 เปิด Row Level Security บน `audit_logs`
- [x] 1.40 สร้าง RLS policy ให้ user อ่าน profile ตัวเอง
- [x] 1.41 สร้าง RLS policy ให้ user แก้ profile ตัวเอง
- [x] 1.42 สร้าง RLS policy ให้ user CRUD notes ของตัวเอง
- [x] 1.43 สร้าง RLS policy ให้ user CRUD tags ของตัวเอง
- [x] 1.44 สร้าง RLS policy ให้ user จัดการ note_tags ผ่าน note ของตัวเอง
- [x] 1.45 สร้าง RLS policy ให้ user อ่าน subscription ของตัวเอง
- [x] 1.46 สร้าง RLS policy ให้ user จัดการ share_links ของ note ตัวเอง
- [x] 1.47 สร้าง RLS policy ให้ user อ่าน note_versions ของตัวเอง
- [x] 1.48 สร้าง database trigger สร้าง `profiles` หลัง auth user ถูกสร้าง
- [x] 1.49 ทดสอบ migration บน local Supabase หรือ remote dev database
- [x] 1.50 ตรวจว่า RLS ไม่เปิดช่องให้ user อ่าน note ของคนอื่น

## Phase 2: Shared Server Utilities

- [x] 2.1 สร้าง Supabase browser client helper
- [x] 2.2 สร้าง Supabase server client helper
- [x] 2.3 สร้าง Supabase service role client helper สำหรับ webhook/job เท่านั้น
- [x] 2.4 สร้าง type กลางสำหรับ `Profile`
- [x] 2.5 สร้าง type กลางสำหรับ `Plan`
- [x] 2.6 สร้าง type กลางสำหรับ `Subscription`
- [x] 2.7 สร้าง type กลางสำหรับ `Note`
- [x] 2.8 สร้าง type กลางสำหรับ `Tag`
- [x] 2.9 สร้าง type กลางสำหรับ `ShareLink`
- [x] 2.10 สร้าง helper อ่าน current user จาก server session
- [x] 2.11 สร้าง helper บังคับ authenticated user
- [x] 2.12 สร้าง helper ตรวจ admin role
- [x] 2.13 สร้าง audit service สำหรับบันทึก event
- [x] 2.14 เพิ่ม audit event type constants
- [x] 2.15 สร้าง sanitizer service สำหรับ Markdown/HTML
- [x] 2.16 สร้าง token generator สำหรับ share token
- [x] 2.17 สร้าง hash helper สำหรับ share token
- [x] 2.18 สร้าง rate limit interface กลาง
- [x] 2.19 สร้าง in-memory rate limiter สำหรับ development
- [x] 2.20 เตรียม adapter ให้เปลี่ยนเป็น Redis/Upstash rate limiter ใน production
- [x] 2.21 สร้าง quota service อ่าน entitlement จาก plan/subscription
- [x] 2.22 สร้าง error response helper สำหรับ API routes
- [x] 2.23 สร้าง success response helper สำหรับ API routes
- [x] 2.24 สร้าง Zod schema สำหรับ note create
- [x] 2.25 สร้าง Zod schema สำหรับ note update
- [x] 2.26 สร้าง Zod schema สำหรับ tag input
- [x] 2.27 สร้าง Zod schema สำหรับ guest import
- [x] 2.28 สร้าง Zod schema สำหรับ share settings

## Phase 3: Auth & Session

- [x] 3.1 ตั้งค่า Supabase Auth ให้เปิด Email Magic Link
- [x] 3.2 ตั้งค่า Supabase Auth ให้เปิด Google OAuth
- [x] 3.3 เพิ่ม allowed redirect URL สำหรับ local development
- [x] 3.4 เพิ่ม allowed redirect URL สำหรับ production
- [x] 3.5 สร้าง route `/auth/callback`
- [x] 3.6 เขียน logic ใน `/auth/callback` เพื่อ exchange auth code เป็น session
- [x] 3.7 เขียน redirect หลัง login สำเร็จไป `/app`
- [x] 3.8 เขียน redirect หลัง login ล้มเหลวไปหน้า login พร้อม error
- [x] 3.9 สร้าง route handler `POST /api/auth/magic-link`
- [x] 3.10 ใส่ Zod validation ให้ email ใน magic link request
- [x] 3.11 ใส่ rate limit ต่อ IP ใน magic link request
- [x] 3.12 ใส่ rate limit ต่อ email ใน magic link request
- [x] 3.13 ส่ง Magic Link ด้วย Supabase Auth
- [x] 3.14 ทำ response แบบไม่ reveal ว่า email มี account หรือไม่
- [x] 3.15 บันทึก audit log เมื่อ request magic link
- [x] 3.16 สร้าง route handler `POST /api/auth/logout`
- [x] 3.17 บันทึก audit log เมื่อ logout
- [x] 3.18 สร้าง middleware ตรวจ session สำหรับ `/app`
- [x] 3.19 redirect unauthenticated user จาก `/app` ไป `/`
- [x] 3.20 สร้าง UI login form
- [x] 3.21 เชื่อม login form กับ `POST /api/auth/magic-link`
- [x] 3.22 แสดง success state หลังขอ Magic Link
- [x] 3.23 แสดง error state เมื่อ rate limit หรือ email invalid
- [x] 3.24 สร้างปุ่ม Google OAuth
- [x] 3.25 เชื่อมปุ่ม Google OAuth กับ Supabase sign-in
- [x] 3.26 ทดสอบ login ด้วย Magic Link
- [x] 3.27 ทดสอบ login ด้วย Google OAuth
- [x] 3.28 ทดสอบ logout แล้วเข้า `/app` ไม่ได้

## Phase 4: App Shell & Navigation

- [x] 4.1 สร้าง layout สำหรับ `/app`
- [x] 4.2 สร้าง sidebar container
- [x] 4.3 สร้าง top bar สำหรับ workspace
- [x] 4.4 สร้าง user menu ใน top bar
- [x] 4.5 เพิ่ม logout action ใน user menu
- [x] 4.6 สร้าง navigation link ไป workspace
- [x] 4.7 สร้าง navigation link ไป trash
- [x] 4.8 สร้าง navigation link ไป billing
- [x] 4.9 สร้าง navigation link ไป settings
- [x] 4.10 สร้าง loading state สำหรับ app shell
- [x] 4.11 สร้าง empty state สำหรับยังไม่มี note
- [x] 4.12 ตั้งค่า responsive layout สำหรับ mobile
- [x] 4.13 ตั้งค่า dark/light theme toggle พื้นฐาน
- [x] 4.14 เก็บ theme preference ใน localStorage

## Phase 5: Notes Backend

- [x] 5.1 สร้าง note repository function สำหรับ list notes
- [x] 5.2 สร้าง note repository function สำหรับ get note by id
- [x] 5.3 สร้าง note repository function สำหรับ create note
- [x] 5.4 สร้าง note repository function สำหรับ update note
- [x] 5.5 สร้าง note repository function สำหรับ soft delete note
- [x] 5.6 สร้าง note repository function สำหรับ restore note
- [x] 5.7 สร้าง note repository function สำหรับ permanent delete note
- [x] 5.8 สร้าง service ตรวจ note ownership
- [x] 5.9 สร้าง service ตรวจ note quota ก่อน create
- [x] 5.10 สร้าง service increment `usage_counters.notes_created_count`
- [x] 5.11 สร้าง route handler `GET /api/notes`
- [x] 5.12 เพิ่ม query param `search` ให้ `GET /api/notes`
- [x] 5.13 เพิ่ม query param `tag` ให้ `GET /api/notes`
- [x] 5.14 เพิ่ม query param `status` ให้ `GET /api/notes`
- [x] 5.15 สร้าง route handler `POST /api/notes`
- [x] 5.16 ใส่ quota check ใน `POST /api/notes`
- [x] 5.17 บันทึก audit log เมื่อ create note
- [x] 5.18 สร้าง route handler `GET /api/notes/[noteId]`
- [x] 5.19 สร้าง route handler `PATCH /api/notes/[noteId]`
- [x] 5.20 ใส่ revision check ใน `PATCH /api/notes/[noteId]`
- [x] 5.21 return `REVISION_CONFLICT` เมื่อ baseRevision เก่า
- [x] 5.22 increment revision เมื่อ update สำเร็จ
- [x] 5.23 update `last_saved_at` เมื่อ update สำเร็จ
- [x] 5.24 สร้าง route handler `DELETE /api/notes/[noteId]`
- [x] 5.25 set `status = trashed` เมื่อ delete
- [x] 5.26 set `trashed_at` เมื่อ delete
- [x] 5.27 set `delete_after = trashed_at + 30 days` เมื่อ delete
- [x] 5.28 disable share link เมื่อ note เข้า trash
- [x] 5.29 บันทึก audit log เมื่อ delete note
- [x] 5.30 สร้าง route handler `POST /api/notes/[noteId]/restore`
- [x] 5.31 clear `trashed_at` และ `delete_after` เมื่อ restore
- [x] 5.32 บันทึก audit log เมื่อ restore note
- [x] 5.33 สร้าง route handler `DELETE /api/notes/[noteId]/permanent`
- [x] 5.34 จำกัด permanent delete ให้ owner หรือ system job เท่านั้น
- [x] 5.35 ทดสอบ API create note
- [x] 5.36 ทดสอบ API update note
- [x] 5.37 ทดสอบ API revision conflict
- [x] 5.38 ทดสอบ API soft delete
- [x] 5.39 ทดสอบ API restore

## Phase 6: Notes Frontend

- [x] 6.1 สร้าง component note list
- [x] 6.2 สร้าง component note list item
- [x] 6.3 แสดง title ใน note list item
- [x] 6.4 แสดง updated time ใน note list item
- [x] 6.5 เพิ่ม selected state ให้ note list item
- [x] 6.6 เชื่อม note list กับ `GET /api/notes`
- [x] 6.7 สร้างปุ่ม create note
- [x] 6.8 เชื่อมปุ่ม create note กับ `POST /api/notes`
- [x] 6.9 เปิด note ที่สร้างใหม่หลัง create สำเร็จ
- [x] 6.10 สร้าง editor layout
- [x] 6.11 สร้าง title input
- [x] 6.12 สร้าง content textarea หรือ markdown editor MVP
- [x] 6.13 โหลด note detail จาก `GET /api/notes/[noteId]`
- [x] 6.14 แสดง loading state ระหว่างโหลด note
- [x] 6.15 แสดง not found state เมื่อไม่มีสิทธิ์หรือ note ไม่มีอยู่
- [x] 6.16 สร้าง delete note button
- [x] 6.17 แสดง confirm dialog ก่อน delete
- [x] 6.18 เชื่อม delete button กับ `DELETE /api/notes/[noteId]`
- [x] 6.19 หลัง delete สำเร็จให้กลับไป note list
- [x] 6.20 สร้าง search input ใน sidebar
- [x] 6.21 เชื่อม search input กับ query `GET /api/notes`
- [x] 6.22 debounce search input
- [x] 6.23 แสดง empty search result state

## Phase 7: Autosave & Conflict Handling

- [x] 7.1 สร้าง hook `useDebouncedAutosave`
- [x] 7.2 ตั้ง debounce 1-3 วินาทีหลังหยุดพิมพ์
- [x] 7.3 ส่ง `baseRevision` ทุกครั้งที่ autosave
- [x] 7.4 แสดงสถานะ `Saving`
- [x] 7.5 แสดงสถานะ `Saved`
- [x] 7.6 แสดงสถานะ `Save failed`
- [x] 7.7 ตรวจ browser offline event
- [x] 7.8 แสดงสถานะ `Offline` เมื่อ offline
- [x] 7.9 เก็บ unsaved draft ใน localStorage ต่อ note id
- [x] 7.10 ลบ local draft เมื่อ save สำเร็จ
- [x] 7.11 retry save เมื่อกลับมา online
- [x] 7.12 หยุด retry แบบรัวเมื่อเจอ rate limit
- [x] 7.13 สร้าง conflict dialog
- [x] 7.14 แสดง server version ใน conflict dialog
- [x] 7.15 แสดง local draft ใน conflict dialog
- [x] 7.16 เพิ่มปุ่ม keep mine
- [x] 7.17 เพิ่มปุ่ม keep server
- [x] 7.18 เพิ่มปุ่ม manual copy/merge
- [x] 7.19 ทดสอบ autosave หลังหยุดพิมพ์
- [x] 7.20 ทดสอบ offline draft recovery
- [x] 7.21 ทดสอบ conflict จากสอง browser tabs

## Phase 8: Tags & Search

- [x] 8.1 สร้าง tag repository function สำหรับ list tags
- [x] 8.2 สร้าง tag repository function สำหรับ find-or-create tag
- [x] 8.3 สร้าง tag repository function สำหรับ attach tag to note
- [x] 8.4 สร้าง tag repository function สำหรับ detach tag from note
- [x] 8.5 สร้าง utility normalize tag
- [x] 8.6 trim whitespace ใน normalize tag
- [x] 8.7 lowercase tag ภาษาอังกฤษใน normalize tag
- [x] 8.8 จำกัดจำนวน tag ต่อ note
- [x] 8.9 สร้าง route handler `GET /api/tags`
- [x] 8.10 สร้าง route handler `POST /api/notes/[noteId]/tags`
- [x] 8.11 สร้าง route handler `DELETE /api/notes/[noteId]/tags/[tagId]`
- [x] 8.12 สร้าง component tag chip
- [x] 8.13 สร้าง tag input ใน editor
- [x] 8.14 เชื่อม tag input กับ attach tag API
- [x] 8.15 เพิ่ม remove tag action
- [x] 8.16 แสดง tag list ใน note list หรือ editor
- [x] 8.17 เพิ่ม filter by tag ใน sidebar
- [x] 8.18 ทดสอบ tag ซ้ำคนละ case ต้องไม่สร้างซ้ำ
- [x] 8.19 ทดสอบ tag ภาษาไทย

## Phase 9: Guest Mode & Import

- [x] 9.1 สร้าง guest note type
- [x] 9.2 สร้าง localStorage key สำหรับ guest notes
- [x] 9.3 สร้าง helper อ่าน guest notes จาก localStorage
- [x] 9.4 สร้าง helper เขียน guest notes ลง localStorage
- [x] 9.5 สร้าง helper ลบ guest notes หลัง import สำเร็จ
- [x] 9.6 สร้างหน้า guest editor ที่ `/`
- [x] 9.7 เพิ่มปุ่ม "ทดลองจดทันที"
- [x] 9.8 สร้าง guest note เมื่อกดทดลองจดทันที
- [x] 9.9 ทำ autosave guest note ลง localStorage
- [x] 9.10 แสดงคำเตือนว่า guest data อาจหาย
- [x] 9.11 เพิ่มปุ่ม login/register เพื่อบันทึกขึ้น cloud
- [x] 9.12 หลัง login สำเร็จตรวจว่ามี guest notes ค้างหรือไม่
- [x] 9.13 สร้าง route handler `POST /api/import/guest/preview`
- [x] 9.14 validate payload ด้วย guest import schema
- [x] 9.15 ตรวจ title collision ใน preview
- [x] 9.16 return จำนวน notes ที่จะ import
- [x] 9.17 return รายการ title ที่จะถูก rename
- [x] 9.18 สร้าง import confirmation dialog
- [x] 9.19 สร้าง route handler `POST /api/import/guest/confirm`
- [x] 9.20 import guest notes แบบ merge เท่านั้น
- [x] 9.21 rename title ซ้ำด้วย suffix `(Imported from guest)`
- [x] 9.22 import tags ของ guest notes
- [x] 9.23 บันทึก audit log เมื่อ import สำเร็จ
- [x] 9.24 ลบ local guest notes หลัง import สำเร็จ
- [x] 9.25 เก็บ local guest notes ไว้หาก import ล้มเหลว
- [x] 9.26 ทดสอบ import เข้า account ใหม่
- [x] 9.27 ทดสอบ import เข้า account ที่มี notes เดิม
- [x] 9.28 ทดสอบ import title collision

## Phase 10: Trash

- [x] 10.1 สร้างหน้า `/app/trash`
- [x] 10.2 ดึง notes ที่ `status = trashed`
- [x] 10.3 แสดงวันที่จะถูกลบถาวร
- [x] 10.4 เพิ่ม restore button ใน trash item
- [x] 10.5 เชื่อม restore button กับ restore API
- [x] 10.6 เพิ่ม permanent delete button ใน trash item
- [x] 10.7 แสดง confirm dialog ก่อน permanent delete
- [x] 10.8 เชื่อม permanent delete button กับ permanent delete API
- [x] 10.9 แสดง empty trash state
- [x] 10.10 สร้าง job function `purge-trashed-notes`
- [x] 10.11 query notes ที่ `delete_after < now()`
- [x] 10.12 permanent delete notes ที่หมด retention
- [x] 10.13 บันทึก audit log จาก system job
- [x] 10.14 สร้าง protected route สำหรับ trigger purge job
- [x] 10.15 ทดสอบ purge job ด้วย note หมดอายุจำลอง

## Phase 11: Sharing & Public Read Page

- [x] 11.1 สร้าง share repository function สำหรับ create share link
- [x] 11.2 สร้าง share repository function สำหรับ revoke share link
- [x] 11.3 สร้าง share repository function สำหรับ regenerate token
- [x] 11.4 สร้าง share repository function สำหรับ lookup by token hash
- [x] 11.5 สร้าง route handler `POST /api/notes/[noteId]/share`
- [x] 11.6 ตรวจ owner ก่อน create share link
- [x] 11.7 สร้าง raw token ที่เดายาก
- [x] 11.8 hash token ก่อนบันทึก database
- [x] 11.9 return public share URL เฉพาะตอน create/regenerate
- [x] 11.10 สร้าง route handler `DELETE /api/notes/[noteId]/share`
- [x] 11.11 set share link status เป็น `revoked`
- [x] 11.12 บันทึก audit log เมื่อ revoke
- [x] 11.13 สร้าง route handler `POST /api/notes/[noteId]/share/regenerate`
- [x] 11.14 revoke token เดิมเมื่อ regenerate
- [x] 11.15 สร้าง token ใหม่เมื่อ regenerate
- [x] 11.16 สร้างหน้า `/share/[token]`
- [x] 11.17 lookup share link ด้วย hash token
- [x] 11.18 return 404 ถ้า token invalid
- [x] 11.19 return 404 ถ้า share revoked
- [x] 11.20 return 404 ถ้า note เข้า trash
- [x] 11.21 render note แบบ read-only
- [x] 11.22 ใส่ meta robots `noindex,nofollow`
- [x] 11.23 ใส่ CSP header สำหรับ shared page
- [x] 11.24 sanitize content ก่อน render
- [x] 11.25 เพิ่ม theme toggle บน shared page
- [x] 11.26 ห้ามแสดง owner email บน shared page
- [x] 11.27 ห้ามส่ง internal user id ไป client
- [x] 11.28 สร้าง share button ใน editor
- [x] 11.29 สร้าง copy share link button
- [x] 11.30 สร้าง revoke share button
- [x] 11.31 สร้าง regenerate share link button
- [x] 11.32 ทดสอบ visitor อ่าน shared note ได้
- [x] 11.33 ทดสอบ revoke แล้ว link เข้าไม่ได้
- [x] 11.34 ทดสอบ note เข้า trash แล้ว link เข้าไม่ได้
- [x] 11.35 ทดสอบ XSS payload ไม่ execute

## Phase 12: Markdown Export

- [x] 12.1 สร้าง export service สำหรับ Markdown
- [x] 12.2 สร้าง filename จาก note title แบบ safe
- [x] 12.3 sanitize content ก่อน export
- [x] 12.4 สร้าง route handler `GET /api/notes/[noteId]/export`
- [x] 12.5 ตรวจ owner ก่อน export
- [x] 12.6 ตั้ง response header `Content-Type: text/markdown`
- [x] 12.7 ตั้ง response header `Content-Disposition`
- [x] 12.8 บันทึก audit log เมื่อ export
- [x] 12.9 เพิ่ม export button ใน editor
- [x] 12.10 เชื่อม export button กับ export endpoint
- [x] 12.11 ทดสอบ export note ภาษาไทย
- [x] 12.12 ทดสอบ visitor export ไม่ได้

## Phase 13: Billing & Subscription

- [x] 13.1 สร้าง Stripe client helper
- [x] 13.2 สร้าง billing service อ่าน current subscription
- [x] 13.3 สร้าง entitlement service จาก plan/subscription
- [x] 13.4 สร้าง route handler `GET /api/billing/status`
- [x] 13.5 สร้าง route handler `POST /api/billing/checkout`
- [x] 13.6 ตรวจ authenticated user ก่อน checkout
- [x] 13.7 สร้าง Stripe customer หาก user ยังไม่มี
- [x] 13.8 map user id กับ Stripe customer metadata
- [x] 13.9 สร้าง Stripe Checkout session สำหรับ Premium Monthly
- [x] 13.10 สร้าง Stripe Checkout session สำหรับ Premium Yearly
- [x] 13.11 สร้าง route handler `POST /api/billing/portal`
- [x] 13.12 สร้าง Stripe Customer Portal session
- [x] 13.13 สร้าง route handler `POST /api/webhooks/stripe`
- [x] 13.14 verify Stripe webhook signature
- [x] 13.15 บันทึก event id ลง `stripe_events`
- [x] 13.16 ignore duplicate Stripe event id
- [x] 13.17 handle event `checkout.session.completed`
- [x] 13.18 handle event `customer.subscription.created`
- [x] 13.19 handle event `customer.subscription.updated`
- [x] 13.20 handle event `customer.subscription.deleted`
- [x] 13.21 handle event `invoice.payment_failed`
- [x] 13.22 update `subscriptions.status` แบบ idempotent
- [x] 13.23 set `grace_until` เมื่อ payment failed หรือ past due
- [x] 13.24 บันทึก audit log เมื่อ webhook update subscription
- [x] 13.25 สร้างหน้า `/app/billing`
- [x] 13.26 แสดง current plan
- [x] 13.27 แสดง subscription status
- [x] 13.28 เพิ่มปุ่ม upgrade monthly
- [x] 13.29 เพิ่มปุ่ม upgrade yearly
- [x] 13.30 เพิ่มปุ่ม manage billing
- [x] 13.31 lock premium-only UI เมื่อ user เป็น Free
- [x] 13.32 ทดสอบ checkout flow ด้วย Stripe test mode
- [x] 13.33 ทดสอบ webhook duplicate event
- [x] 13.34 ทดสอบ downgrade แล้ว notes หลักยังเข้าถึงได้

## Phase 14: Settings, Account Deletion & Data Export Foundation

- [ ] 14.1 สร้างหน้า `/app/settings`
- [ ] 14.2 แสดง profile email
- [ ] 14.3 แสดง display name
- [ ] 14.4 เพิ่มฟอร์มแก้ display name
- [ ] 14.5 สร้าง route handler สำหรับ update profile
- [ ] 14.6 บันทึก audit log เมื่อ update profile
- [ ] 14.7 เพิ่ม section data export policy
- [ ] 14.8 เพิ่ม section account deletion
- [ ] 14.9 สร้าง route handler `POST /api/account/delete-request`
- [ ] 14.10 mark `profiles.deleted_at` เมื่อ request deletion
- [ ] 14.11 revoke share links ทั้งหมดเมื่อ request deletion
- [ ] 14.12 บันทึก audit log เมื่อ request deletion
- [ ] 14.13 แสดง confirmation dialog ก่อน request deletion
- [ ] 14.14 ทดสอบ request deletion แล้ว shared links เข้าไม่ได้

## Phase 15: Admin & Audit

- [ ] 15.1 สร้าง route guard สำหรับ admin
- [ ] 15.2 สร้างหน้า admin audit logs แบบ internal
- [ ] 15.3 สร้าง route handler `GET /api/admin/audit-logs`
- [ ] 15.4 จำกัด route ด้วย admin role
- [ ] 15.5 เพิ่ม filter audit log ตาม event type
- [ ] 15.6 เพิ่ม filter audit log ตาม user id
- [ ] 15.7 เพิ่ม pagination ให้ audit logs
- [ ] 15.8 สร้าง route handler `GET /api/admin/users/[userId]`
- [ ] 15.9 ห้าม admin endpoint ส่ง note content
- [ ] 15.10 ทดสอบ non-admin เข้า admin endpoint ไม่ได้

## Phase 16: Security Hardening

- [ ] 16.1 เพิ่ม global security headers
- [ ] 16.2 เพิ่ม CSP สำหรับ app routes
- [ ] 16.3 เพิ่ม CSP แบบ strict สำหรับ shared routes
- [ ] 16.4 ปิด raw script execution บน shared page
- [ ] 16.5 ตรวจทุก API route ว่ามี auth guard หรือ public guard ชัดเจน
- [ ] 16.6 ตรวจทุก mutation route ว่ามี Zod validation
- [ ] 16.7 ตรวจทุก owner-only route ว่ามี owner check
- [ ] 16.8 ตรวจทุก service role usage ว่าไม่ใช้ใน client
- [ ] 16.9 เพิ่ม rate limit ให้ write APIs
- [ ] 16.10 เพิ่ม rate limit ให้ share public access
- [ ] 16.11 เพิ่ม rate limit ให้ export endpoint
- [ ] 16.12 เพิ่ม webhook signature verification test
- [ ] 16.13 เพิ่ม robots policy สำหรับ shared pages
- [ ] 16.14 เพิ่ม `noindex` metadata ให้ shared pages
- [ ] 16.15 ทดสอบ XSS payload ใน editor/shared page

## Phase 17: Observability & Production Readiness

- [ ] 17.1 ติดตั้ง Sentry หรือ error tracking ที่เลือก
- [ ] 17.2 ตั้งค่า client-side error tracking
- [ ] 17.3 ตั้งค่า server-side error tracking
- [ ] 17.4 log error เมื่อ autosave failed
- [ ] 17.5 log error เมื่อ guest import failed
- [ ] 17.6 log error เมื่อ Stripe webhook failed
- [ ] 17.7 log error เมื่อ email auth request failed
- [ ] 17.8 เพิ่ม health check route
- [ ] 17.9 สร้าง production env checklist
- [ ] 17.10 ตรวจ backup policy ของ Supabase project
- [ ] 17.11 ตรวจ Stripe webhook endpoint production
- [ ] 17.12 ตรวจ Supabase redirect URLs production
- [ ] 17.13 ตรวจ domain และ HTTPS

## Phase 18: Testing & QA

- [ ] 18.1 ตั้งค่า unit test framework
- [ ] 18.2 เขียน test สำหรับ normalize tag
- [ ] 18.3 เขียน test สำหรับ share token hashing
- [ ] 18.4 เขียน test สำหรับ sanitizer
- [ ] 18.5 เขียน test สำหรับ quota service
- [ ] 18.6 เขียน test สำหรับ entitlement service
- [ ] 18.7 เขียน test สำหรับ revision conflict logic
- [ ] 18.8 เขียน integration test สำหรับ create note API
- [ ] 18.9 เขียน integration test สำหรับ update note API
- [ ] 18.10 เขียน integration test สำหรับ delete/restore note API
- [ ] 18.11 เขียน integration test สำหรับ guest import API
- [ ] 18.12 เขียน integration test สำหรับ share revoke API
- [ ] 18.13 เขียน integration test สำหรับ markdown export API
- [ ] 18.14 เขียน integration test สำหรับ Stripe webhook idempotency
- [ ] 18.15 ตั้งค่า Playwright
- [ ] 18.16 เขียน E2E: guest creates local note
- [ ] 18.17 เขียน E2E: login and import guest note
- [ ] 18.18 เขียน E2E: create cloud note
- [ ] 18.19 เขียน E2E: autosave note
- [ ] 18.20 เขียน E2E: delete and restore note
- [ ] 18.21 เขียน E2E: create and revoke share link
- [ ] 18.22 เขียน E2E: shared page is read-only
- [ ] 18.23 เขียน E2E: markdown export
- [ ] 18.24 รัน accessibility check บน workspace
- [ ] 18.25 รัน accessibility check บน shared page
- [ ] 18.26 รัน responsive check บน mobile viewport
- [ ] 18.27 รัน responsive check บน desktop viewport

## Phase 19: Documentation & Handoff

- [ ] 19.1 อัปเดต README วิธี setup local development
- [ ] 19.2 อัปเดต README env variables ทั้งหมด
- [ ] 19.3 เขียนวิธีรัน Supabase migrations
- [ ] 19.4 เขียนวิธีตั้งค่า Supabase Auth
- [ ] 19.5 เขียนวิธีตั้งค่า Stripe test mode
- [ ] 19.6 เขียนวิธีตั้งค่า Stripe webhook local
- [ ] 19.7 เขียนวิธี deploy ไป production
- [ ] 19.8 เขียน operational runbook สำหรับ failed webhook
- [ ] 19.9 เขียน operational runbook สำหรับ purge trash job
- [ ] 19.10 อัปเดต `CONTEXT.md` หลัง MVP foundation พร้อมเริ่ม feature development
