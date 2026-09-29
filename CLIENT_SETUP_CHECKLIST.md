# CLIENT_SETUP_CHECKLIST.md

Items the client or developer must provide/configure before the app goes live.

1. **Google Sheets spreadsheet ID** for bill sync (optional — can add later)
   - Set `GOOGLE_SHEETS_BILLS_SPREADSHEET_ID` in `.env`
   - Everything else in the bill flow (OCR → Supabase) works without this.

2. **Meta Business verification** for the real WhatsApp number
   - Verify the business in Meta Business Manager.
   - Ensure the WhatsApp Business Account is approved for production messaging.

3. **A hosting account** (Render / Railway) with billing enabled
   - Deploy the backend + frontend.
   - Existing `Dockerfile`, `render.yaml`, `.env.production.example` are in the project root.

4. **A new production Supabase project** (Pro plan)
   - Migrate from the current development project.
   - Enable the required extensions and verify the schema matches the expected tables.
