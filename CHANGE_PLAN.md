# SHIVINFRA AI AUDIT — CHANGE PLAN

## Root Causes Found

### Bug 1: "Update Rahul Patil budget to 7000000" → UPDATE_PROJECT
**File:** `backend/ai-engine/intentDetector.ts`
**Lines:** 389-426 (`fallbackIntent` function)
**Cause:** Overly broad regex patterns `/update\s+\w+/` and `/change\s+\w+/` match ANY "update/change <word>" including customer names like "Rahul". These patterns run before any customer-specific checks.

### Bug 2: "Add customer Rahul Patil, phone 9876543210" → name includes "phone"
**File:** `backend/ai-engine/intentDetector.ts`
**Lines:** 1172-1231 (`extractCustomerData` function)
**Cause:** After removing action keywords, the function does NOT strip phone numbers or phone-related keywords ("phone", "mobile", "number") from the cleaned name. Result: `full_name = "Rahul Patil, phone 9876543210"`.

### Bug 3: Customer/project entity classification unreliable
**File:** `backend/ai-engine/intentDetector.ts`
**Lines:** 282-842 (`fallbackIntent` function)
**Cause:** 
- Project UPDATE/DELETE patterns are checked before customer patterns in some cases
- Customer patterns require explicit "customer" keyword, but real user messages often omit it
- No logic to distinguish "Update <person> <field>" from "Update <project> <field>"

## Files to Modify

### Primary (WhatsApp flow)
1. `backend/ai-engine/intentDetector.ts` — Main fix for WhatsApp/webhook AI flow

### Secondary (consistency)
2. `backend/services/ai/aiParserService.ts` — Dead code but same bugs; fix for consistency
3. `backend/services/aiService.ts` — Web chat flow; add customer update patterns

## Changes

### 1. intentDetector.ts — Fix fallbackIntent order and patterns

**Add BEFORE project UPDATE block (around line 387):**
- UPDATE_CUSTOMER block: detects "update/change <name> <customer-field>" without requiring "customer" keyword
- DELETE_CUSTOMER block: detects "delete/remove <name>" without requiring "customer" keyword
- Both blocks exclude project keywords: "project", "building", "site", "tower", "flat", "unit", "sqft", "bhk"

**Fix PROJECT UPDATE block (lines 389-426):**
- Remove `/update\s+\w+/` and `/change\s+\w+/` regex
- Keep only project-specific patterns

**Fix extractCustomerData (lines 1172-1231):**
- Strip phone numbers and phone-related keywords from `cleaned` before assigning to `full_name`

### 2. aiParserService.ts — Same fixes for consistency

**Fix project price update priority (lines 187-243):**
- Remove overly broad regex
- Add customer update detection before project update

**Fix extractCustomerName (lines 1605-1767):**
- Already filters "phone" but verify comma handling

**Fix fallbackParser (lines 835-1287):**
- Add UPDATE_CUSTOMER and DELETE_CUSTOMER blocks

### 3. aiService.ts — Add customer update patterns

**detectRuleBasedIntent (lines 5420-5819):**
- Add UPDATE_CUSTOMER patterns without requiring "customer" keyword
- Add DELETE_CUSTOMER patterns

**extractEntities / normalizeText:**
- Already good, no changes needed

## Tests to Run

After build:
1. "Add customer Amit Sharma, phone 9876543210" → ADD_CUSTOMER, full_name="Amit Sharma", phone="9876543210"
2. "Update Rahul Patil budget to 7000000" → UPDATE_CUSTOMER, name="Rahul Patil", budget=7000000
3. "Change Rahul Patil phone to 9876543210" → UPDATE_CUSTOMER
4. "Delete Rahul Patil" → DELETE_CUSTOMER
5. "Show Rahul Patil" → SEARCH_CUSTOMERS
6. "Update Green Valley project price to 7000000" → UPDATE_PROJECT
7. "Change Green Valley project status to active" → UPDATE_PROJECT
8. "Delete Green Valley project" → DELETE_PROJECT
9. "Show all projects" → SEARCH_PROJECTS
10. "Show all customers" → SEARCH_CUSTOMERS
