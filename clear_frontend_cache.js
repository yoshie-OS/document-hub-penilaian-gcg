// Clear localStorage cache for checklist data
// Run this in browser console to clear cached data with old timestamp IDs

console.log("=== Clearing Frontend Cache ===");

// Check what's currently stored
const checklistData = localStorage.getItem('checklistGCG');
const aspectsData = localStorage.getItem('aspects');

if (checklistData) {
    try {
        const parsed = JSON.parse(checklistData);
        console.log(`Found ${parsed.length} checklist items in cache`);
        if (parsed.length > 0) {
            console.log("Sample IDs:", parsed.slice(0, 3).map(item => ({ id: item.id, desc: item.deskripsi?.substring(0, 50) })));
        }
    } catch (e) {
        console.log("Error parsing checklist data:", e);
    }
}

// Clear the problematic cached data
localStorage.removeItem('checklistGCG');
localStorage.removeItem('aspects');

console.log("✅ Cleared localStorage cache");
console.log("🔄 Please refresh the page to reload fresh data from backend");