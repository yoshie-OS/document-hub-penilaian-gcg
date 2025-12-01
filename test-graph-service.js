// Quick test of the graph data service
const { initializeDocumentMetadata } = require('./src/lib/seed/seedDocumentMetadata.ts');

console.log('Testing graphDataService...');

try {
  // Test if we can load document data
  const documents = initializeDocumentMetadata();
  console.log('✅ Documents loaded:', documents.length);
  console.log('First document:', documents[0]);
} catch (error) {
  console.error('❌ Error:', error.message);
}