# Product Requirement Document (PRD) — Minote

## 1. Project Overview & Scope

### 1.1 Project Summary

**Minote** คือแอปจดโน้ตออนไลน์สำหรับผู้ใช้ทั่วไปและกลุ่ม creator/freelancer/student ที่ต้องการเขียน จัดระเบียบ และแชร์โน้ตออกไปเป็นหน้าเว็บ read-only ที่อ่านง่ายและดูพรีเมียม

เป้าหมายหลักของ MVP คือสร้างระบบจดโน้ตที่ **ข้อมูลไม่หาย, แชร์ได้ปลอดภัย, ใช้งานง่าย, และพร้อมต่อยอดเป็น subscription product** โดยลดฟีเจอร์ที่เสี่ยงเกินไป เช่น real-time collaboration, PromptPay recurring, PDF คุณภาพสูง และ animation ขั้นสูง ไปไว้ใน Phase 2

### 1.2 Problems to Solve

* ผู้ใช้ต้องการจดโน้ตออนไลน์ได้ทันทีโดยไม่ต้องเรียนรู้ระบบซับซ้อน
* ผู้ใช้ต้องการแชร์โน้ตให้ผู้อื่นอ่านได้โดยไม่ต้องให้สิทธิ์แก้ไข
* ผู้ใช้ต้องการ export ข้อมูลของตนเองได้ ไม่ถูก lock-in
* เจ้าของระบบต้องควบคุมต้นทุนจาก autosave, share traffic, email API และ storage growth
* ระบบต้องลดความเสี่ยงเรื่องข้อมูลรั่ว, shared link ถูก index, XSS และ PDPA

### 1.3 MVP Scope

ฟีเจอร์ที่อยู่ใน MVP:

* Email Magic Link และ Google OAuth
* Guest Mode แบบ local storage
* Guest-to-Member Migration
* CRUD Notes
* Debounced Auto-save พร้อม save status
* Tags และ basic search
* Trash retention 30 วัน
* Basic read-only share link พร้อม revoke/regenerate
* Markdown export
* Stripe subscription เบื้องต้น
* Security baseline: RLS, rate limit, noindex, sanitization, CSP, audit log

ฟีเจอร์ที่ไม่อยู่ใน MVP:

* PDF export คุณภาพสูง
* PromptPay recurring subscription
* Real-time collaboration, CRDT, Operational Transformation
* Password-protected share link
* Advanced share customization
* Ambient Sounds
* Circular Reveal animation
* Full Version History UI

### 1.4 Constraints

| Constraint | Decision |
|---|---|
| Platform | Web app รองรับ desktop และ mobile browser |
| Team Assumption | Solo developer หรือทีมเล็ก |
| Development Priority | Data safety, security, payment reliability มาก่อน visual polish |
| MVP Payment | Stripe ก่อน, PromptPay เป็น Phase 2 |
| Guest Storage | localStorage ใน MVP (ถ้าผู้ใช้อยากจะทดลองให้เพิ่มไปในหน้า billing หรือส่วนของสมาชิกเอา) |
| Offline Support | draft recovery ชั่วคราว ไม่ใช่ full offline-first |
| Collaboration | single-user editing with conflict detection |
| Compliance | ต้องมี Privacy Policy, Terms, Data Deletion Policy ก่อน production |
| Font | ปรับฟอนต์ตัวหนังสือให้เป็น Poppins |
| Language | ให้ทั้งระบบใช้เป็นภาษาอังกฤษก่อน |

## 2. User Roles & Access Control

### 2.1 Roles

| Role | Description |
|---|---|
| Visitor | ผู้เปิดอ่านโน้ตจาก shared link |
| Guest | ผู้ทดลองจดโน้ตโดยไม่ login |
| Free User | ผู้ใช้ที่มี account แต่ยังไม่จ่ายเงิน |
| Premium User | ผู้ใช้ที่จ่ายเงินและมี subscription active |
| Admin | ผู้ดูแลระบบ ใช้สำหรับ support, audit และ operational tasks |

### 2.2 RBAC Matrix

| Action | Visitor | Guest | Free User | Premium User | Admin |
|---|---:|---:|---:|---:|---:|
| อ่าน shared note | Yes | Yes | Yes | Yes | Yes |
| สลับ theme บน shared page | Yes | Yes | Yes | Yes | Yes |
| สร้าง local guest note | No | Yes | No | No | No |
| สร้าง cloud note | No | No | Limited | Yes | No |
| แก้ไข note ของตนเอง | No | Local only | Yes | Yes | No |
| ลบ note ของตนเอง | No | Local only | Yes | Yes | No |
| Restore จาก Trash | No | No | Yes | Yes | Support only |
| สร้าง share link | No | No | Yes | Yes | No |
| Revoke/regenerate share link | No | No | Yes | Yes | No |
| Export Markdown | No | Local only | Yes | Yes | No |
| ใช้ Version History | No | No | No | Phase 2 | No |
| จัดการ subscription | No | No | Yes | Yes | No |
| ดู audit log | No | No | No | No | Yes |
| อ่านเนื้อหา note ผู้ใช้ | No | No | No | No | ไม่ควรทำ ยกเว้นมี policy และเหตุจำเป็น |

## 3. Functional Requirements

### 3.1 Auth Module

#### Features

* Login ด้วย Magic Link ผ่าน email
* Login ด้วย Google OAuth
* Session-based authentication
* Logout
* Account deletion request

#### Business Logic & Edge Cases

* Magic Link ต้องหมดอายุภายใน 10-15 นาที
* Magic Link ต้องใช้ได้ครั้งเดียว
* ต้อง rate limit ตาม email, IP และ device fingerprint เท่าที่ทำได้
* ห้ามตอบข้อความที่เปิดเผยว่า email มี account อยู่แล้วหรือไม่
* หากผู้ใช้ login ผ่าน Google ด้วย email เดียวกับ Magic Link account ให้ผูก identity กับ user เดิม
* ทุก auth event สำคัญต้องบันทึกใน audit log

### 3.2 Guest Mode Module

#### Features

* ผู้ใช้เริ่มจดโน้ตได้โดยไม่ login
* เก็บข้อมูลใน localStorage
* แจ้งเตือนชัดเจนว่าข้อมูล guest อาจหาย
* Convert guest notes เข้า account เมื่อ login/register

#### Business Logic & Edge Cases

* หาก email ยังไม่มี account ให้สร้าง account และ import guest notes
* หาก email มี account แล้ว ให้ login ก่อนแล้วแสดงหน้า confirm import
* Default behavior คือ merge guest notes เป็น note ใหม่ใน account เดิม
* ห้าม overwrite cloud notes เดิม
* หาก title ซ้ำ ให้เติม suffix เช่น `(Imported from guest)`
* หาก import สำเร็จจึงลบ local guest draft
* หาก import ล้มเหลวต้องเก็บ local draft และให้ retry

### 3.3 Notes Module

#### Features

* Create note
* Read note
* Update note
* Soft delete note ไป Trash
* Restore note จาก Trash
* Permanent delete หลังครบ retention

#### Business Logic & Edge Cases

* Note เป็น private โดย default
* Free User จำกัดจำนวน note ใหม่ต่อวันและจำนวน note รวม
* Quota ของ Free User นับจาก note created หรือ note total ไม่ใช่จำนวน autosave request
* Note ใน Trash ยังนับรวม quota/storage
* Note ที่เข้า Trash ต้องปิด shared link ทันที
* ระบบต้องมี background job ลบ Trash ที่เกิน 30 วัน

### 3.4 Auto-save Module

#### Features

* Debounced auto-save
* Save status indicator
* Retry เมื่อ save failed
* Local draft fallback

#### Business Logic & Edge Cases

* ห้ามยิง API ทุก keystroke โดยตรง
* Save หลังหยุดพิมพ์ 1-3 วินาที
* ต้องแสดงสถานะ `Saving`, `Saved`, `Offline`, `Save failed`
* หาก browser offline ให้เก็บ draft ชั่วคราวและแจ้งผู้ใช้
* หาก server rate limit ต้องหยุด retry แบบรัวและแจ้งผู้ใช้
* ต้องใช้ revision number หรือ updated_at เพื่อป้องกัน silent overwrite

### 3.5 Concurrency Module

#### Features

* Detect conflict เมื่อ note ถูกแก้จากหลาย device
* เก็บ server version และ client draft ไว้ให้ผู้ใช้เลือก

#### Business Logic & Edge Cases

* MVP ใช้ optimistic locking
* ถ้า revision ที่ client ส่งมาเก่ากว่า server ต้อง return conflict
* ห้าม last-write-wins แบบเงียบ
* UI ต้องให้ผู้ใช้เลือก keep mine, keep server, หรือ manual merge
* CRDT/real-time collaboration เป็น Phase 2

### 3.6 Tags & Search Module

#### Features

* เพิ่ม/ลบ tag บน note
* Filter note ตาม tag
* Search จาก title, content และ tag

#### Business Logic & Edge Cases

* Tag รองรับภาษาไทยและอังกฤษ
* Tag ไม่ case-sensitive
* จำกัดจำนวน tag ต่อ note
* Normalize tag ก่อนบันทึก เช่น trim whitespace และ lowercase สำหรับภาษาอังกฤษ
* MVP ยังไม่ต้องมีหน้า tag management แยก

### 3.7 Sharing Module

#### Features

* Create share link
* View shared note แบบ read-only
* Revoke share link
* Regenerate share token
* Shared page มี noindex เป็น default

#### Business Logic & Edge Cases

* Shared URL ต้องใช้ token ที่เดายาก
* Visitor แก้ไข ลบ หรือ export ไม่ได้
* ถ้า note ถูกลบ เข้า Trash หรือปิด sharing ต้องเข้า shared link ไม่ได้ทันที
* Default คือ shared page แสดง latest content
* หากใช้ CDN ต้อง purge cache เมื่อ revoke/delete
* Content ต้องผ่าน sanitizer ก่อน render

### 3.8 Export Module

#### Features

* Export Markdown ใน MVP
* PDF export เป็น Phase 2

#### Business Logic & Edge Cases

* Export ได้เฉพาะเจ้าของ note
* Markdown export ต้อง sanitize content ที่อาจมี HTML แฝง
* Visitor ไม่มีสิทธิ์ export ใน MVP
* PDF export ต้องรองรับภาษาไทยและ font embedding ก่อนเปิด production

### 3.9 Payment & Subscription Module

#### Features

* Free plan
* Premium Monthly
* Premium Yearly
* Stripe Checkout หรือ Customer Portal
* Stripe webhook สำหรับ sync subscription state

#### Business Logic & Edge Cases

* MVP ใช้ Stripe เป็นหลัก
* ต้องรองรับสถานะ active, trialing, past_due, canceled, expired, payment_failed, refunded
* หาก payment failed ให้เข้าสู่ grace period
* หาก downgrade เป็น Free ต้อง lock premium-only features แต่ยังให้เข้าถึง notes หลัก
* Premium-derived data เช่น version history ต้องซ่อนก่อน แล้ว purge หลังครบ grace period ตาม policy
* PromptPay ให้เป็น Phase 2 หรือ manual renewal

### 3.10 Admin & Audit Module

#### Features

* Audit log สำหรับ event สำคัญ
* Admin dashboard ขั้นต่ำสำหรับ operational visibility

#### Business Logic & Edge Cases

* Log event: login, logout, create share, revoke share, delete note, restore note, export, payment webhook
* Admin ไม่ควรอ่านเนื้อหา note โดย default
* การเข้าถึงข้อมูลผู้ใช้โดยทีม support ต้องมีเหตุผลและ log เสมอ

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target |
|---|---|
| Initial app load | LCP ไม่เกิน 2.5 วินาทีบน connection ปกติ |
| Workspace interaction | UI response ไม่เกิน 100 ms สำหรับ typing |
| Auto-save debounce | 1-3 วินาทีหลังหยุดพิมพ์ |
| Shared page load | TTFB ต่ำและ cache ได้เมื่อปลอดภัย |
| Search MVP | ผลลัพธ์ภายใน 500 ms สำหรับ account ขนาดเล็กถึงกลาง |

### 4.2 Availability & Reliability

* ระบบต้องไม่ทำให้ข้อมูลหายเมื่อ save failed
* ต้องมี retry และ local draft fallback
* Payment webhook ต้อง idempotent
* Background jobs ต้อง retry ได้
* Database ต้องมี backup และ restore policy

### 4.3 Security

* HTTPS only
* ใช้ httpOnly, secure, sameSite cookies หากใช้ cookie session
* เปิด Row Level Security ทุก table ที่มี user data
* ใช้ CSRF protection สำหรับ state-changing requests
* ใช้ rate limit สำหรับ auth, write API, share access, export และ webhook validation
* Sanitize Markdown/HTML ก่อน render
* Shared page ต้องมี Content Security Policy
* Share token ต้องสุ่มยาวพอและไม่ sequential
* Password หรือ secret ใดๆ ห้ามเก็บ plain text

### 4.4 Privacy & Compliance

* ต้องมี Privacy Policy, Terms of Service และ Data Deletion Policy
* Shared pages ต้อง `noindex` by default
* ต้องมี account deletion flow
* ต้องมี data export flow
* ต้องระบุ data retention สำหรับ notes, trash, version history, backups และ deleted accounts
* ต้องระบุ third-party processors เช่น Supabase, Stripe, Resend, Vercel
* หากมี analytics หรือ ads ต้องขอ consent ตาม PDPA

### 4.5 Observability

* Error tracking สำหรับ frontend/backend
* Log payment webhook failures
* Monitor email send failures
* Track API rate limit events
* Track import failure, save conflict, save failed และ export failed

### 4.6 Acceptance Criteria ระดับ MVP

* ผู้ใช้สามารถทดลองเขียน note แบบ guest ได้
* ผู้ใช้สามารถ login แล้ว import guest notes ได้โดยไม่ overwrite note เดิม
* ผู้ใช้สามารถสร้าง แก้ไข ลบ restore และ search note ได้
* Auto-save ต้องมี status และไม่สูญเสีย draft เมื่อ save failed
* Shared link read-only ต้อง revoke ได้
* Shared page ต้องไม่ถูก index โดย search engine
* Stripe webhook ต้องอัปเดต subscription state ได้ถูกต้อง
* User data ต้องถูกบังคับด้วย RLS และ owner check

