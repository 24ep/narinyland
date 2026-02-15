// Test if the page loads timeline data
const testPageLoad = async () => {
  try {
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if timeline data is loaded in window
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    // Reload page to capture logs
    window.location.reload();
    
    // Wait for reload and check logs
    setTimeout(() => {
      const timelineLogs = logs.filter(log => log.includes('🔍'));
      console.log('Timeline debug logs:', timelineLogs);
    }, 3000);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testPageLoad();
