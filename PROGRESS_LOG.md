# SHIVINFRA PRODUCTION BASELINE AUDIT
Generated: 2026-09-26

## BUILD STATUS
- `npm run build`: PASS — `? built in 30.47s`, `dist/server.cjs` (1012.4kb), `dist/server.cjs.map` (2.0mb)
- esbuild compiles server.ts successfully; no runtime-blocking errors.

## TYPESCRIPT STATUS
- `tsc --noEmit`: FAIL — but ALL errors are in `scripts/` and `audit-*.ts` legacy/test files.
- Zero errors in `backend/` and `src/` production code.
- Legacy script errors (not production-blocking):
  - `scripts/test-project-direct.ts`, `scripts/test-project-insert.ts`: project field mismatches
  - `scripts/test-ai.ts`: missing module `../backend/services/ai/ProjectAI.ts`
  - `scripts/test-reports-local.ts`, `scripts/test-whatsapp-e2e.ts`: type mismatches
  - `scripts/clean-demo.ts`, `scripts/seed-demo.ts`, `scripts/clean-test-users.ts`, `scripts/cleanup-and-proof.ts`: parser/comparison errors

## PRODUCTION BLOCKERS (current)
1. **WhatsApp multi-tenant company resolution**: `resolveCompanyByPhoneId()` exists and queries `settings.meta_phone_id`, but `DEFAULT_COMPANY_ID` fallback in `.env` is hardcoded to `3e9e9ae1-8593-473f-9aa3-9bcee469d795`. No real `meta_phone_id ? company_id` mapping has been verified in the database. **BLOCKED** until DB mapping is confirmed.
2. **Persistent confirmations**: `agent.ts` uses Supabase `pending_confirmations` table. Need to verify OCR/Bill webhook confirmations are NOT still using in-memory Maps.
3. **Inquiry XL**: migration conflict between `20240101_add_missing_tables.sql`, `20250606_create_missing_tables.sql`, `20240101_add_missing_erp_tables.sql`. Need to verify actual columns (`interest_level`, `replied`).
4. **Inquiry sandbox**: `InquirySpreadsheet.tsx` may contain `showSandbox` toggle and fake handlers.
5. **Google Sheets OAuth**: likely `invalid_grant` — external credential blocker.
6. **LocationIQ API key**: `LOCATIONIQ_API_KEY` may be missing — external credential blocker.
7. **Meta WhatsApp credentials**: not configured — all live WhatsApp delivery is BLOCKED.

## WHATSAPP IMPLEMENTATION
- `backend/services/whatsapp/WhatsappWebhookService.ts` — multi-tenant company resolution via `settings.meta_phone_id` with `DEFAULT_COMPANY_ID` fallback.
- `extractPhoneNumberId()` reads `entry[0].changes[0].metadata.phone_number_id`.
- `resolveCompanyByPhoneId()` queries `settings` table by `meta_phone_id`.
- `resolveUserContext()` accepts `context?: { payload?: any; metadataPhoneId?: string }`.
- Call site at line 438 passes `{ payload }`.
- Build/typecheck: PASS for this file.

## SUPABASE SCHEMA
- `settings` table: `company_id UUID`, `meta_phone_id VARCHAR(255)`, `meta_access_token TEXT`, `settings_data JSONB`.
- `pending_confirmations` table exists (`20240101_create_pending_confirmations.sql`).
- `broadcasts` table has `scheduled_at`, `audience_params` (migration `20260923_add_scheduled_at_to_broadcasts.sql`).
- `followups` table with idempotency (`20260909_followups_idempotency.sql`).

## CONFIRMATION SYSTEMS
- `agent.ts` ? Supabase `pending_confirmations` (persistent, 30-min TTL).
- Need to verify: `pendingOCRConfirmations`, `pendingBillConfirmations` in-memory Maps.

## AI PIPELINE
- `backend/ai-engine/` directory exists.
- `AIAssistant.tsx` and `AICommandCenter.tsx` pages.
- `@google/genai`, `openai` dependencies present.

## UI/THEME STATE
- Current theme: **orange + navy gradient** (needs replacement per Phase 1).
- Source: `src/index.css`, Tailwind classes, component styling.

## PHASE 1 — UI THEME: COMPLETED
- `src/index.css`: `--color-accent` changed from `#FBBF24`/`#F59E0B` (amber) to `#0A0A0A`/`#000000` (black).
- `src/pages/AIAssistant.tsx` line 1606-1612: `bg-orange-500/10`, `border-orange-500/20`, `text-orange-400` ? `bg-black/5`, `border-black/10`, `text-black`.
- `src/App.tsx`: all `bg-gradient-to-br from-primary to-ai` ? `bg-black`; all `bg-gradient-to-r from-primary to-ai` ? `bg-black`.
- `src/components/Sidebar.tsx` line 74: `bg-gradient-to-r from-gray-900 to-gray-700` ? `text-black` (removed redundant gradient).
- Build: `? built in 12.83s`.
- Remaining gradient classes: black/gray only (no orange/amber/navy). Verified.
- Amber/orange in Dashboard.tsx are data values (chart color names), not CSS theme classes.
- Files changed: `src/index.css`, `src/App.tsx`, `src/pages/AIAssistant.tsx`, `src/components/Sidebar.tsx`.

## NEXT PHASE ORDER
1. Phase 1 — UI Theme (source-level changes only)
2. Phase 2 — Inquiry/Inquiry XL schema + UI
3. Phase 3 — Remove Inquiry sandbox
4. Phase 4 — Users cleanup (safe test accounts only)
5. Phase 5 — WhatsApp multi-tenant verification
6. Phase 6 — Persistent confirmations migration
7. Phase 7 — Structured project update
8. Phase 8 — Site visit + task reminders
9. Phase 9-10 — Leads + follow-up
10. Phase 11 — Bill OCR
11. Phase 12 — Google Sheets
12. Phase 13 — Reports
13. Phase 14 — Material search
14. Phase 15 — AI Assistant
15. Phase 16 — Broadcast
16. Phase 17 — Settings persistence
17. Phase 18 — Security audit
18. Phase 19 — Activity logs
19. Phase 20 — Page-by-page QA
20. Phase 21 — Final build + report