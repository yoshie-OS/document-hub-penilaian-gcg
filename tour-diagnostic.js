// Tour Diagnostic Script - Paste this in browser console
console.log('========== TOUR DIAGNOSTIC ==========');

// 1. Check user data
const userStr = localStorage.getItem('user');
console.log('1. User data from localStorage:', userStr);
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('   Parsed user:', user);
    console.log('   Role:', user.role);
  } catch (e) {
    console.error('   ❌ Error parsing user:', e);
  }
} else {
  console.warn('   ⚠️ No user found in localStorage!');
}

// 2. Check current path
console.log('2. Current path:', window.location.pathname);
console.log('   Path includes "/arsip":', window.location.pathname.includes('/arsip'));

// 3. Check if data-tour elements exist
const dataTourElements = document.querySelectorAll('[data-tour]');
console.log('3. Data-tour elements found:', dataTourElements.length);
dataTourElements.forEach(el => {
  console.log(`   - ${el.getAttribute('data-tour')}`);
});

// 4. Check if TourContext is accessible
console.log('4. Checking TourContext...');
// This will be visible from React DevTools

// 5. Try to manually trigger tour
console.log('5. Attempting to trigger tour...');
console.log('   Run this in console to test: startTour("arsip")');
console.log('   Note: startTour might not be accessible from window scope');

console.log('========== END DIAGNOSTIC ==========');
