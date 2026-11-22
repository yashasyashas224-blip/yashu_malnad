import fs from 'fs';
import path from 'path';

async function runFrontendBuildVerification() {
  console.log(`\n============================================================`);
  console.log(`📦 WAY 3: FRONTEND PRODUCTION BUNDLE & RUNTIME INTEGRITY TEST`);
  console.log(`============================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${failureDetails || 'Assertion failed'}`);
      failed++;
    }
  }

  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  const adminDist = path.join(__dirname, '..', 'admin', 'dist');

  // 1. Client Dist Folder
  assert(fs.existsSync(clientDist), 'Client /dist directory exists');

  // 2. Client HTML entry
  const clientHtmlPath = path.join(clientDist, 'index.html');
  assert(fs.existsSync(clientHtmlPath), 'Client index.html generated');
  const clientHtml = fs.readFileSync(clientHtmlPath, 'utf-8');
  assert(clientHtml.includes('MCE Smart Campus Navigator'), 'Client HTML contains official institutional title');
  assert(clientHtml.includes('/assets/'), 'Client HTML properly references bundled asset chunks');

  // 3. Client JS & CSS Assets
  const clientAssetsDir = path.join(clientDist, 'assets');
  const clientAssets = fs.readdirSync(clientAssetsDir);
  const clientJs = clientAssets.find(f => f.endsWith('.js'));
  const clientCss = clientAssets.find(f => f.endsWith('.css'));
  assert(!!clientJs, `Client compiled production JavaScript bundle (${clientJs})`);
  assert(!!clientCss, `Client compiled production Tailwind stylesheet (${clientCss})`);

  // Verify JS bundle content
  const clientJsContent = fs.readFileSync(path.join(clientAssetsDir, clientJs!), 'utf-8');
  assert(clientJsContent.includes('Malnad College of Engineering'), 'Client bundle contains MCE institutional constants');
  assert(!/^\s*import\s+.*from\s+['"]/m.test(clientJsContent), 'Client bundle has zero unbundled ES module import statements');

  // 4. Admin Dist Folder
  assert(fs.existsSync(adminDist), 'Admin /dist directory exists');
  const adminHtmlPath = path.join(adminDist, 'index.html');
  assert(fs.existsSync(adminHtmlPath), 'Admin index.html generated');
  const adminHtml = fs.readFileSync(adminHtmlPath, 'utf-8');
  assert(adminHtml.includes('MCE Campus Admin Dashboard'), 'Admin HTML contains official dashboard title');

  // 5. Admin JS & CSS Assets
  const adminAssetsDir = path.join(adminDist, 'assets');
  const adminAssets = fs.readdirSync(adminAssetsDir);
  const adminJs = adminAssets.find(f => f.endsWith('.js'));
  const adminCss = adminAssets.find(f => f.endsWith('.css'));
  assert(!!adminJs, `Admin compiled production JavaScript bundle (${adminJs})`);
  assert(!!adminCss, `Admin compiled production Tailwind stylesheet (${adminCss})`);

  const adminJsContent = fs.readFileSync(path.join(adminAssetsDir, adminJs!), 'utf-8');
  assert(adminJsContent.includes('principal@mcehassan.ac.in'), 'Admin bundle contains master administrator configuration');

  console.log(`\n============================================================`);
  console.log(`📊 FRONTEND INTEGRITY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`============================================================\n`);

  if (failed > 0) process.exit(1);
}

runFrontendBuildVerification().catch(err => {
  console.error('Frontend build verification failed:', err);
  process.exit(1);
});
