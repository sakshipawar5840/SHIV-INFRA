import { detectIntent } from './backend/ai-engine/intentDetector.ts';
import { checkPermission } from './backend/ai-engine/permissionChecker.ts';
import { runAgent } from './backend/ai-engine/agent.ts';
import { ConfirmationService } from './backend/services/confirmationService.ts';
import { supabaseAdmin as supabase } from './backend/config/supabase.ts';

async function test() {
  const companyId = '3e9e9ae1-8593-473f-9aa3-9bcee469d795';
  const phone = '+919876543210';
  const userId = '40d7f92f-29fc-4661-baeb-61eadbbd1739';
  
  console.log('=== WHATSAPP AI AGENT — NEW INTENTS AUDIT ===\n');
  
  // Test 1: Intent Detection - New Modules
  console.log('--- TEST 1: Intent Detection (New Modules) ---');
  const intentTests = [
    ['Show available inventory', 'SEARCH_INVENTORY'],
    ['Show tasks', 'SEARCH_TASKS'],
    ['Show my tasks', 'SEARCH_TASKS'],
    ['Show pending tasks', 'SEARCH_TASKS'],
    ['Show documents', 'SEARCH_DOCUMENTS'],
    ['Show project documents', 'SEARCH_DOCUMENTS'],
    ['Show vendors', 'SEARCH_VENDORS'],
    ['Find cement suppliers', 'SEARCH_VENDORS'],
    ['Show site visits', 'SEARCH_SITE_VISITS'],
    ['Book a site visit for tomorrow', 'BOOK_SITE_VISIT'],
    ['Generate financial summary', 'GENERATE_REPORT'],
    ['Generate expense report', 'GENERATE_REPORT'],
    ['Create task for Project ABC', 'ADD_TASK'],
    ['Add vendor ABC', 'ADD_VENDOR'],
    ['Upload this document', 'UPLOAD_DOCUMENT'],
    ['Add 100 bags cement', 'ADD_INVENTORY'],
  ];
  
  let intentPass = 0;
  let intentFail = 0;
  for (const [msg, expected] of intentTests) {
    const intent = await detectIntent(msg);
    const pass = intent.name === expected;
    if (pass) intentPass++; else intentFail++;
    console.log(`  ${pass ? '✓' : '✗'} "${msg}"`);
    console.log(`    Expected: ${expected}, Got: ${intent.name} (confidence: ${intent.confidence})`);
  }
  
  // Test 2: Permission Checking - New Intents
  console.log('\n--- TEST 2: Permission Checking (New Intents) ---');
  const roles = ['ADMIN', 'ENGINEER', 'CUSTOMER'];
  const newIntents = ['SEARCH_TASKS', 'ADD_TASK', 'DELETE_TASK', 'BOOK_SITE_VISIT', 'SEARCH_INVENTORY', 'ADD_INVENTORY', 'SEARCH_VENDORS', 'SEARCH_DOCUMENTS'];
  
  for (const role of roles) {
    console.log(`\n  Role: ${role}`);
    for (const intent of newIntents) {
      const perm = await checkPermission({ role, intent });
      console.log(`    ${intent}: ${perm.allowed ? 'ALLOWED' : 'DENIED'} (${perm.reason})`);
    }
  }
  
  // Test 3: Confirmation for destructive actions
  console.log('\n--- TEST 3: Confirmation Flow ---');
  await ConfirmationService.cancelPending(companyId, phone);
  
  const result = await runAgent({
    userId,
    companyId,
    phone,
    role: 'ADMIN',
    message: 'Delete task XYZ',
    channel: 'WHATSAPP'
  });
  
  console.log('  Delete task result:', result.action === 'CONFIRMATION_REQUIRED' ? 'ASKED CONFIRMATION ✓' : 'EXECUTED WITHOUT CONFIRM ✗');
  console.log('  Message:', result.message?.slice(0, 100));
  
  // Verify pending confirmation exists
  const pending = await ConfirmationService.getPendingConfirmation(companyId, phone);
  console.log('  Pending confirmation exists:', !!pending ? 'YES ✓' : 'NO ✗');
  
  // Test 4: Tool Execution - Read Operations
  console.log('\n--- TEST 4: Tool Execution (Read Operations) ---');
  const readOps = [
    { msg: 'Show my tasks', intent: 'SEARCH_TASKS' },
    { msg: 'Show available inventory', intent: 'SEARCH_INVENTORY' },
    { msg: 'Show all vendors', intent: 'SEARCH_VENDORS' },
    { msg: 'Show site visits', intent: 'SEARCH_SITE_VISITS' },
    { msg: 'Show documents', intent: 'SEARCH_DOCUMENTS' },
  ];
  
  for (const op of readOps) {
    const result = await runAgent({
      userId,
      companyId,
      phone,
      role: 'ADMIN',
      message: op.msg,
      channel: 'WHATSAPP'
    });
    console.log(`  ${op.msg}: ${result.success ? 'SUCCESS ✓' : 'FAILED ✗'}`);
    console.log(`    Intent: ${result.intent} | Message: ${(result.message || '').slice(0, 60)}`);
  }
  
  // Test 5: Tool Execution - Create Operation (with cleanup)
  console.log('\n--- TEST 5: Tool Execution (Create + Cleanup) ---');
  
  // Create task
  const taskResult = await runAgent({
    userId,
    companyId,
    phone,
    role: 'ADMIN',
    message: 'Create task WhatsApp Audit Test Task for tomorrow with High priority',
    channel: 'WHATSAPP'
  });
  console.log('  CREATE_TASK:', taskResult.success ? 'SUCCESS ✓' : 'FAILED ✗');
  const taskId = taskResult.data?.id || null;
  
  if (taskId) {
    // Delete task
    const deleteResult = await runAgent({
      userId,
      companyId,
      phone,
      role: 'ADMIN',
      message: 'Delete task WhatsApp Audit Test Task',
      channel: 'WHATSAPP'
    });
    console.log('  DELETE_TASK (first):', deleteResult.action === 'CONFIRMATION_REQUIRED' ? 'ASKED CONFIRM ✓' : 'EXECUTED DIRECT ✗');
    
    // Confirm delete
    const confirmResult = await runAgent({
      userId,
      companyId,
      phone,
      role: 'ADMIN',
      message: 'Yes confirm',
      channel: 'WHATSAPP'
    });
    console.log('  DELETE_TASK (after confirm):', confirmResult.success ? 'SUCCESS ✓' : 'FAILED ✗');
  }
  
  // Test 6: Regression - Existing Intents Still Work
  console.log('\n--- TEST 6: Regression (Existing Intents) ---');
  const regressionTests = [
    ['Show all projects', 'SEARCH_PROJECTS'],
    ['Show my leads', 'SEARCH_LEADS'],
    ['Show pending bills', 'SEARCH_BILLS'],
    ['Show expenses', 'SEARCH_EXPENSES'],
    ['Generate financial summary', 'GENERATE_REPORT'],
  ];
  
  let regPass = 0;
  let regFail = 0;
  for (const [msg, expected] of regressionTests) {
    const intent = await detectIntent(msg);
    const pass = intent.name === expected;
    if (pass) regPass++; else regFail++;
    console.log(`  ${pass ? '✓' : '✗'} "${msg}" → ${intent.name}`);
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`New intents detected correctly: ${intentPass}/${intentTests.length}`);
  console.log(`Regression tests passed: ${regPass}/${regressionTests.length}`);
  console.log('\n=== AUDIT COMPLETE ===');
}

test().catch(err => {
  console.error('AUDIT FAILED:', err);
  process.exit(1);
});
