# Supabase Auth Setup Checklist

ใช้ checklist นี้ก่อนปิด Phase 3 ข้อที่ต้องตั้งค่าจาก Supabase Dashboard โดยตรง

## Email Magic Link

Supabase Dashboard:

1. Authentication → Providers → Email
2. เปิด Email provider
3. เปิด Confirm email หรือ Magic Link flow ตามค่า project policy
4. ตรวจ email template ว่ามี `{{ .ConfirmationURL }}` สำหรับ magic link

## Google OAuth

Supabase Dashboard:

1. Authentication → Providers → Google
2. เปิด Google provider
3. ใส่ Client ID และ Client Secret จาก Google Cloud Console
4. ตั้ง Google redirect URI ตามที่ Supabase แสดงใน provider settings

## Redirect URLs

Supabase Dashboard:

1. Authentication → URL Configuration
2. Site URL:
   - Local: `http://localhost:3000`
   - Production: production origin จริง
3. Additional Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
   - `https://your-production-domain.com/auth/callback`
   - `https://your-production-domain.com/**`

หลังตั้งค่าแล้วให้ทดสอบ:

1. ขอ Magic Link จากหน้า `/`
2. เปิด email และกด link
3. ต้อง redirect ไป `/app`
4. กด Continue with Google จากหน้า `/`
5. OAuth สำเร็จต้อง redirect ไป `/app`
6. กด Sign out แล้วเข้า `/app` ต้องถูก redirect กลับ `/`
