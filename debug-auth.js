// Debug script to check authentication status
// Run this in your browser console to check your auth status

function checkAuthStatus() {
  console.log('=== Authentication Status Check ===');
  
  // Check localStorage
  const nexuspayToken = localStorage.getItem('nexuspay_token');
  const user = localStorage.getItem('user');
  const nexuspayUser = localStorage.getItem('nexuspay_user');
  
  console.log('1. nexuspay_token:', nexuspayToken ? 'Present' : 'Missing');
  console.log('2. user:', user ? 'Present' : 'Missing');
  console.log('3. nexuspay_user:', nexuspayUser ? 'Present' : 'Missing');
  
  // Check sessionStorage
  const sessionToken = sessionStorage.getItem('nexuspay_token');
  const sessionUser = sessionStorage.getItem('user');
  
  console.log('4. sessionStorage nexuspay_token:', sessionToken ? 'Present' : 'Missing');
  console.log('5. sessionStorage user:', sessionUser ? 'Present' : 'Missing');
  
  // Try to parse the token
  if (nexuspayToken) {
    try {
      const parsed = JSON.parse(nexuspayToken);
      console.log('6. Parsed nexuspay_token:', parsed);
    } catch (e) {
      console.log('6. nexuspay_token (raw):', nexuspayToken.substring(0, 50) + '...');
    }
  }
  
  if (user) {
    try {
      const parsed = JSON.parse(user);
      console.log('7. Parsed user:', parsed);
    } catch (e) {
      console.log('7. user (raw):', user.substring(0, 50) + '...');
    }
  }
  
  console.log('=== End Authentication Check ===');
}

// Auto-run the check
checkAuthStatus();

// Export for manual use
window.checkAuthStatus = checkAuthStatus;
