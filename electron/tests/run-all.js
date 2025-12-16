const verifySecurity = require('./verify-security');
const verifyPerformance = require('./verify-performance');

async function runAll() {
    console.log('==========================================');
    console.log('🚀 Running Full Phase 1 & 2 Verification');
    console.log('==========================================\n');

    let success = true;

    try {
        const securityPassed = await verifySecurity();
        if (!securityPassed) success = false;

        console.log('\n------------------------------------------\n');
        
        // Reset mocks to clear SecureIPC patching
        if (global.mockIpcMain && global.mockIpcMain._reset) {
            console.log('🔄 Resetting Mocks...');
            global.mockIpcMain._reset();
        }

        const perfPassed = await verifyPerformance();
        if (!perfPassed) success = false;

    } catch (err) {
        console.error('Test Suite Failed:', err);
        success = false;
    }

    console.log('\n==========================================');
    if (success) {
        console.log('✅ ALL VERIFICATIONS PASSED');
        process.exit(0);
    } else {
        console.error('❌ SOME CHECKS FAILED');
        process.exit(1);
    }
}

runAll();
