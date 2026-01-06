const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const REPORT_FILE = path.join(ROOT_DIR, 'DIAGNOSTIC_REPORT.md');

const SCORES = {
    frontend: { lint: 0, type: 0, build: 0, test: 0 },
    backend: { test: 0, lint: 0 },
    simulation: { success: 0 }
};

const LOGS = [];

// --- Helpers ---
function log(msg) {
    const timestamp = new Date().toISOString();
    const cleanMsg = `[${timestamp}] ${msg}`;
    console.log(cleanMsg);
    LOGS.push(cleanMsg);
}

function runCommand(command, args, cwd, label) {
    return new Promise((resolve) => {
        log(`Create Process: ${label} (${command} ${args.join(' ')}) in ${cwd}`);
        const start = Date.now();
        
        const proc = spawn(command, args, { cwd, shell: true, env: { ...process.env, CI: 'true' } });
        
        let output = '';
        let errorOutput = '';

        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

        proc.on('close', (code) => {
            const duration = ((Date.now() - start) / 1000).toFixed(2);
            log(`Process Finished: ${label} (Exit: ${code}, Time: ${duration}s)`);
            if (code !== 0) {
                log(`ERROR OUTPUT (${label}):\n${errorOutput.slice(0, 500)}...`); 
            }
            resolve({ code, output, errorOutput, duration });
        });
        
        proc.on('error', (err) => {
             log(`Process Error: ${label} - ${err.message}`);
             resolve({ code: 999, output: '', errorOutput: err.message, duration: 0 });
        });
    });
}

// --- Diagnostic Steps ---

async function runFrontendDiagnostics() {
    log('--- Starting Frontend Diagnostics ---');
    
    // Lint
    const lintRes = await runCommand('npm', ['run', 'lint'], FRONTEND_DIR, 'Frontend Lint');
    SCORES.frontend.lint = lintRes.code === 0 ? 100 : 0;
    
    // Type Check
    const typeRes = await runCommand('npm', ['run', 'type-check'], FRONTEND_DIR, 'Frontend Type Check');
    SCORES.frontend.type = typeRes.code === 0 ? 100 : 0;
    
    // Build
    const buildRes = await runCommand('npm', ['run', 'build'], FRONTEND_DIR, 'Frontend Build');
    SCORES.frontend.build = buildRes.code === 0 ? 100 : 0;

    return { lintRes, typeRes, buildRes };
}

async function runBackendDiagnostics() {
    log('--- Starting Backend Diagnostics ---');
    
    // Check if python is available
    const pyVersion = await runCommand('python3', ['--version'], ROOT_DIR, 'Python Version');
    
    // Backend Tests (Quick check)
    // Using python -m pytest to ensure we use the current env python
    const testRes = await runCommand('python3', ['-m', 'pytest', 'tests/', '-v', '--tb=short', '--maxfail=5'], BACKEND_DIR, 'Backend Tests');
    SCORES.backend.test = testRes.code === 0 ? 100 : (testRes.code === 5 ? 0 : 50); // 5 is no tests collected usually, or full fail

    // Code Quality (Black check as proxy for lint)
    const lintRes = await runCommand('python3', ['-m', 'black', '--check', '.'], BACKEND_DIR, 'Backend Lint (Black)');
    SCORES.backend.lint = lintRes.code === 0 ? 100 : 0;
    
    return { testRes, lintRes };
}

async function runUserSimulation() {
    log('--- Starting User Simulation (E2E) ---');
    
    // Run the existing E2E script
    // Note: Assuming the server needs to be running or the script starts it. 
    // Looking at run_e2e_tests.py, it connects to localhost:8000. It does NOT seem to start the server itself.
    // We should try to check if server is running, or skip if NOT. 
    // FOR SAFETY: We will try to run it. If connection fails, it sends a clear signal.
    
    const simRes = await runCommand('python3', ['tests/run_e2e_tests.py', '--ci', '--verbose'], ROOT_DIR, 'User Simulation');
    
    let score = 0;
    if (simRes.code === 0) score = 100; // Success
    else if (simRes.code === 1) score = 50; // Partial
    else score = 0; // Fail
    
    SCORES.simulation.success = score;
    return { simRes };
}

// --- Reporting ---

function generateReport(fe, be, sim) {
    const totalScore = Math.round(
        (Object.values(SCORES.frontend).reduce((a,b)=>a+b,0) / 4 * 0.4) + 
        (Object.values(SCORES.backend).reduce((a,b)=>a+b,0) / 2 * 0.3) + 
        (SCORES.simulation.success * 0.3)
    );

    const statusIcon = (score) => score === 100 ? '✅' : (score > 0 ? '⚠️' : '❌');

    let content = `# System Diagnostic & Readiness Report
**Date**: ${new Date().toLocaleString()}
**Overall System Health Score**: ${totalScore}/100

## 1. Frontend Diagnostics (Weight: 40%)
| Check | Status | Score | Details |
|-------|--------|-------|---------|
| Linting | ${statusIcon(SCORES.frontend.lint)} | ${SCORES.frontend.lint} | ${SCORES.frontend.lint === 100 ? 'Passed' : 'Issues Found'} |
| Type Check | ${statusIcon(SCORES.frontend.type)} | ${SCORES.frontend.type} | ${SCORES.frontend.type === 100 ? 'Passed' : 'TS Errors Found'} |
| Build | ${statusIcon(SCORES.frontend.build)} | ${SCORES.frontend.build} | ${SCORES.frontend.build === 100 ? 'Success' : 'Build Failed'} |

### Build Output Excerpt
\`\`\`
${fe.buildRes.output.slice(0, 300) || fe.buildRes.errorOutput.slice(0, 300)}
\`\`\`

## 2. Backend Diagnostics (Weight: 30%)
| Check | Status | Score | Details |
|-------|--------|-------|---------|
| Tests | ${statusIcon(SCORES.backend.test)} | ${SCORES.backend.test} | ${SCORES.backend.test === 100 ? 'Passed' : 'Failures Detected'} |
| Lint (Black) | ${statusIcon(SCORES.backend.lint)} | ${SCORES.backend.lint} | ${SCORES.backend.lint === 100 ? 'Compliant' : 'Formatting Issues'} |

## 3. User Simulation (Weight: 30%)
**Flow**: Login -> Dashboard -> Summary
**Status**: ${SCORES.simulation.success === 100 ? 'Success' : (SCORES.simulation.success === 50 ? 'Partial Success' : 'Failed')}
**Score**: ${SCORES.simulation.success}

### Simulation Logs
\`\`\`
${sim.simRes.output.slice(0, 1000)}
\`\`\`

## 4. Remediation Recommendations
`;

    if (SCORES.frontend.build === 0) content += `- **CRITICAL**: Frontend build is failing. Fix dependencies or config immediately.\n`;
    if (SCORES.frontend.type === 0) content += `- **HIGH**: TypeScript errors present. Run \`npm run type-check\` to investigate.\n`;
    if (SCORES.simulation.success === 0) content += `- **Blocker**: User simulation failed completely. Check if backend server is running or if auth flow is broken.\n`;

    return content;
}

// --- Main ---

async function main() {
    log('Starting Diagnostic Orchestrator...');
    
    // 1. Frontend
    const feRes = await runFrontendDiagnostics();
    
    // 2. Backend
    const beRes = await runBackendDiagnostics();
    
    // 3. Simulation
    const simRes = await runUserSimulation();
    
    // 4. Report
    const report = generateReport(feRes, beRes, simRes);
    fs.writeFileSync(REPORT_FILE, report);
    
    log(`Report generated at: ${REPORT_FILE}`);
}

main().catch(err => {
    console.error('Orchestrator Fatal Error:', err);
});
