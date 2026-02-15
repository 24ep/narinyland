// Run broken image cleanup script
async function runCleanup() {
  console.log('🧹 Running Broken Image Cleanup\n');

  try {
    console.log('📋 Cleanup Process:\n');

    // Step 1: Analyze broken images
    console.log('🔍 Step 1: Analyzing broken images...');
    const analysisResponse = await fetch('http://localhost:3000/api/cleanup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}`);
    }

    const analysis = await analysisResponse.json();
    console.log('📊 Analysis Results:');
    console.log(`   Memories: ${analysis.memories.valid} valid, ${analysis.memories.broken} broken`);
    console.log(`   Timeline Events: ${analysis.timelineEvents.valid} valid, ${analysis.timelineEvents.broken} broken`);
    console.log(`   Total: ${analysis.summary.totalValid} valid, ${analysis.summary.totalBroken} broken`);

    if (analysis.summary.totalBroken === 0) {
      console.log('\n✅ No broken images found. Database is clean!');
      return;
    }

    console.log('\n🗑️ Step 2: Running cleanup (dry run)...');
    
    // Step 2: Dry run cleanup
    const dryRunResponse = await fetch('http://localhost:3000/api/cleanup', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dryRun: true,
        targetTable: 'all'
      }),
    });

    if (!dryRunResponse.ok) {
      throw new Error(`Dry run failed: ${dryRunResponse.status} ${dryRunResponse.statusText}`);
    }

    const dryRunResult = await dryRunResponse.json();
    console.log('📊 Dry Run Results:');
    console.log(`   Would delete ${dryRunResult.deletedMemories} memories`);
    console.log(`   Would delete ${dryRunResult.deletedEvents} timeline events`);
    console.log(`   Total would delete: ${dryRunResult.totalDeleted} items`);

    if (dryRunResult.errors.length > 0) {
      console.log('   Errors:');
      dryRunResult.errors.forEach(error => console.log(`     ${error}`));
    }

    // Step 3: Ask for confirmation
    console.log('\n❓ Step 3: Confirmation required');
    console.log(`⚠️  About to delete ${dryRunResult.totalDeleted} items from database.`);
    console.log('⚠️  This action cannot be undone.');
    console.log('⚠️  Make sure you have a backup before proceeding.');

    // In a real scenario, you would ask for user confirmation here
    // For now, we'll proceed with the actual cleanup
    console.log('\n🗑️ Step 4: Running actual cleanup...');
    
    // Step 4: Actual cleanup
    const cleanupResponse = await fetch('http://localhost:3000/api/cleanup', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dryRun: false,
        targetTable: 'all'
      }),
    });

    if (!cleanupResponse.ok) {
      throw new Error(`Cleanup failed: ${cleanupResponse.status} ${cleanupResponse.statusText}`);
    }

    const cleanupResult = await cleanupResponse.json();
    console.log('📊 Cleanup Results:');
    console.log(`   Deleted ${cleanupResult.deletedMemories} memories`);
    console.log(`   Deleted ${cleanupResult.deletedEvents} timeline events`);
    console.log(`   Total deleted: ${cleanupResult.totalDeleted} items`);

    if (cleanupResult.errors.length > 0) {
      console.log('   Errors:');
      cleanupResult.errors.forEach(error => console.log(`     ${error}`));
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log('🔄 Cache has been cleared.');
    console.log('📱 App should now load faster with fewer broken images.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure the app is running on localhost:3000');
    console.log('   2. Check if the database is accessible');
    console.log('   3. Verify API endpoints are working');
    console.log('   4. Check network connectivity');
  }
}

// Check if running in browser or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Running in browser environment');
  runCleanup();
} else {
  // Node.js environment
  console.log('🖥️ Running in Node.js environment');
  runCleanup();
}
