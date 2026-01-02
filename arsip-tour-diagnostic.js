// Arsip Dokumen Tour Diagnostic Script
// Paste this in browser console on /admin/arsip-dokumen page

console.log('========== ARSIP TOUR DIAGNOSTIC ==========');

// 1. Check current path
console.log('1. Current path:', window.location.pathname);
const isCorrectPath = window.location.pathname.includes('/arsip');
console.log('   Is arsip path:', isCorrectPath ? '✅' : '❌');

// 2. Check user role
const userStr = localStorage.getItem('user');
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('2. User role:', user.role);
    console.log('   Expected tour type:', user.role === 'superadmin' ? 'superadmin (13 steps)' : 'admin (9 steps)');
  } catch (e) {
    console.error('   ❌ Error parsing user:', e);
  }
} else {
  console.warn('   ⚠️ No user found in localStorage!');
}

// 3. Check if data-tour elements exist
console.log('3. Checking data-tour elements in DOM:');
const dataTourElements = document.querySelectorAll('[data-tour]');
console.log(`   Total elements found: ${dataTourElements.length}`);

const expectedElements = [
  'year-selector',
  'refresh-button',
  'download-all-button',
  'statistics-panel',
  'upload-random',
  'filter-aspek',
  'filter-pic',
  'search-filter',
  'pagination-selector',
  'document-table'
];

expectedElements.forEach(name => {
  const el = document.querySelector(`[data-tour="${name}"]`);
  console.log(`   ${el ? '✅' : '❌'} [data-tour="${name}"]`);
});

// 4. List all found data-tour attributes
if (dataTourElements.length > 0) {
  console.log('4. All data-tour attributes in DOM:');
  dataTourElements.forEach(el => {
    const tourId = el.getAttribute('data-tour');
    const tagName = el.tagName.toLowerCase();
    const visible = el.offsetParent !== null;
    console.log(`   - ${tourId} <${tagName}> ${visible ? '(visible)' : '(hidden)'}`);
  });
} else {
  console.error('4. ❌ NO data-tour elements found in DOM!');
  console.log('   Possible reasons:');
  console.log('   - Page not fully loaded');
  console.log('   - Year not selected');
  console.log('   - Component not rendered');
  console.log('   - React hydration issue');
}

// 5. Check if PageHeaderPanel is rendered
const pageHeader = document.querySelector('.flex.items-center.gap-2');
console.log('5. PageHeaderPanel rendered:', pageHeader ? '✅' : '❌');

// 6. Check if year selector is rendered
const yearSelector = document.querySelector('[data-tour="year-selector"]');
console.log('6. Year selector element:', yearSelector ? '✅' : '❌');
if (!yearSelector) {
  console.log('   Checking for year buttons...');
  const yearButtons = document.querySelectorAll('button');
  console.log(`   Total buttons on page: ${yearButtons.length}`);
}

// 7. Check selected year
const yearContext = window.__REACT_CONTEXT__;
console.log('7. Selected year from context: (check React DevTools)');

// 8. Manual tour trigger test
console.log('\n8. Manual tour trigger test:');
console.log('   Run this command to manually start tour:');
console.log('   > window.dispatchEvent(new CustomEvent("userGuideClick"))');

// 9. MutationObserver test
console.log('\n9. Setting up MutationObserver test (will watch for 5 seconds)...');
let observedChanges = 0;
const testObserver = new MutationObserver((mutations) => {
  observedChanges++;
  mutations.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          const el = node;
          if (el.hasAttribute && el.hasAttribute('data-tour')) {
            console.log(`   🔔 New data-tour element added: ${el.getAttribute('data-tour')}`);
          }
          // Check children
          const children = el.querySelectorAll ? el.querySelectorAll('[data-tour]') : [];
          children.forEach(child => {
            console.log(`   🔔 New data-tour element (child): ${child.getAttribute('data-tour')}`);
          });
        }
      });
    }
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-tour') {
      console.log(`   🔔 data-tour attribute changed on:`, mutation.target);
    }
  });
});

testObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-tour']
});

setTimeout(() => {
  testObserver.disconnect();
  console.log(`   Observer detected ${observedChanges} DOM mutations in 5 seconds`);
  console.log('   Final count:', document.querySelectorAll('[data-tour]').length, 'data-tour elements');
}, 5000);

console.log('\n========== DIAGNOSTIC COMPLETE ==========');
console.log('If elements are found ✅, try clicking "User Guide" button in topbar');
console.log('If elements are missing ❌, check if year is selected and page is fully loaded');
