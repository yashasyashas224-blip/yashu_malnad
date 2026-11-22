import { AuthService } from '../backend/src/services/authService';
import { NavigationService } from '../backend/src/services/navigationService';
import { AIAssistantService } from '../backend/src/services/aiAssistantService';
import { db } from '../backend/src/data/database';

async function runTests() {
  console.log(`\n============================================================`);
  console.log(`🧪 RUNNING MCE SMART CAMPUS NAVIGATOR AUTOMATED TEST SUITE`);
  console.log(`============================================================\n`);

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${failureDetails || 'Assertion failed'}`);
      failedCount++;
    }
  }

  // TEST 1: Rejection of non-MCE accounts / invalid USN
  console.log(`\n--- Test Group 1: MCE-Only Authentication & Registry Checks ---`);
  const foreignCollegeCheck = AuthService.verifyInstitutionalRoster('1MS21CS099', 'student@msrit.edu');
  assert(!foreignCollegeCheck.matched, 'Foreign college student is rejected immediately');

  const invalidUsnCheck = AuthService.verifyInstitutionalRoster('4MC99XX999', 'fake@gmail.com');
  assert(!invalidUsnCheck.matched, 'Invalid / Non-whitelisted MCE USN is rejected');

  // TEST 2: Valid MCE student verification
  const validStudentCheck = AuthService.verifyInstitutionalRoster('4MC22CS045', 'yashaswini.22cs045@mcehassan.ac.in');
  assert(validStudentCheck.matched && validStudentCheck.role === 'student', 'Valid MCE student USN 4MC22CS045 is verified');

  // TEST 3: Valid MCE staff verification
  const validStaffCheck = AuthService.verifyInstitutionalRoster('MCE-FAC-014', 'hod_cse@mcehassan.ac.in');
  assert(validStaffCheck.matched && validStaffCheck.role === 'campus_admin', 'Valid MCE faculty ID MCE-FAC-014 is verified with admin privileges');

  // TEST 4: Phone & Email OTP Lifecycle
  console.log(`\n--- Test Group 2: OTP Verification & Abuse Protection ---`);
  const otpGen = AuthService.generateOtp('9448112233', 'phone');
  assert(otpGen.success && !!otpGen.debugOtp, 'Phone OTP generated successfully');

  // Rate limit / resend cooldown check
  const otpCooldown = AuthService.generateOtp('9448112233', 'phone');
  assert(!otpCooldown.success, 'OTP resend cooldown enforced within 60 seconds');

  // Invalid code check
  const invalidOtpVerify = AuthService.verifyOtp('9448112233', '000000');
  assert(!invalidOtpVerify.success, 'Incorrect OTP code rejected');

  // Valid code check
  const validOtpVerify = AuthService.verifyOtp('9448112233', otpGen.debugOtp!);
  assert(validOtpVerify.success, 'Correct OTP code verified');

  // TEST 5: Google Login without MCE linkage rejected
  console.log(`\n--- Test Group 3: Google Login Linkage Enforcement ---`);
  const unlinkedGId = `g-unlinked-${Date.now()}`;
  const googleUnlinked = await AuthService.googleSignIn({
    googleId: unlinkedGId,
    email: 'external.student@gmail.com',
    name: 'External Student'
  });
  assert(!googleUnlinked.success && googleUnlinked.needsLinkage === true, 'Standalone Gmail rejected from accessing campus navigation');

  // Google Login with valid MCE USN linkage succeeds
  const linkedGId = `g-linked-${Date.now()}`;
  const googleLinked = await AuthService.googleSignIn({
    googleId: linkedGId,
    email: 'aditya.gowda.personal@gmail.com',
    name: 'Aditya Gowda',
    institutionalId: '4MC22CS089'
  });
  assert(googleLinked.success && !!googleLinked.token, 'Google account successfully linked to verified MCE USN 4MC22CS089');

  // TEST 6: Outdoor Navigation - Shortest Route
  console.log(`\n--- Test Group 4: Navigation Engine (Dijkstra / A*) ---`);
  const shortestRoute = NavigationService.computeRoute('node-gate-salagame', 'node-csis-entrance', 'shortest');
  assert(
    shortestRoute !== null && shortestRoute.totalDistanceMeters > 0,
    `Shortest path from Main Gate to CS-IS entrance calculated (${shortestRoute?.totalDistanceMeters}m)`
  );

  // TEST 7: Accessible / Stair-Free Navigation
  const accessibleRoute = NavigationService.computeRoute('node-gate-salagame', 'node-csis-f2-ai-lab', 'accessible');
  assert(
    accessibleRoute !== null && accessibleRoute.isAccessible === true,
    'Accessible route to 2nd Floor AI Lab uses elevator and avoids stairs'
  );

  // TEST 8: Dynamic Obstacle & Blocked Pathway Detour
  console.log(`\n--- Test Group 5: Blocked Pathway Detour ---`);
  const testEdge = db.edges.get('edge-circle-central')!;
  testEdge.isBlocked = true;
  testEdge.blockedReason = 'Pipeline maintenance work';

  const detourRoute = NavigationService.computeRoute('node-admin-circle', 'node-canteen-plaza', 'shortest');
  assert(
    detourRoute !== null && !detourRoute.steps.some(s => s.fromNodeId === 'node-admin-circle' && s.toNodeId === 'node-academic-central-path'),
    'Navigation engine dynamically detours around blocked pathway'
  );
  testEdge.isBlocked = false; // restore

  // TEST 9: Indoor QR Checkpoint Resolution
  console.log(`\n--- Test Group 6: Indoor QR Checkpoints ---`);
  const checkpoint = Array.from(db.qrCheckpoints.values()).find(q => q.code === 'MCE-CHK-CSIS-2F');
  assert(
    checkpoint !== null && checkpoint.floor === 2 && checkpoint.nodeId === 'node-csis-f2-foyer',
    'Indoor QR Checkpoint MCE-CHK-CSIS-2F resolves to Floor 2 Foyer'
  );

  // TEST 10: AI Campus Assistant Grounding
  console.log(`\n--- Test Group 7: AI Campus Assistant Grounding ---`);
  const aiExamQuery = AIAssistantService.processQuery('Where is the examination office?');
  assert(
    aiExamQuery.matchedEntity?.id === 'room-exam-cell' &&
    aiExamQuery.navigationAction?.available === true &&
    aiExamQuery.matchedEntity.floor === 1,
    'AI Assistant identifies Examination Section (ADM-105, Floor 1) without hallucination'
  );

  const aiAiLabQuery = AIAssistantService.processQuery('Where is the AI and ML laboratory?');
  assert(
    aiAiLabQuery.matchedEntity?.id === 'room-cse-lab-ai' &&
    aiAiLabQuery.matchedEntity.buildingName.includes('Computer Science'),
    'AI Assistant grounds AI Lab query to CS-204 in CS-IS Complex'
  );

  console.log(`\n============================================================`);
  console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log(`============================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
