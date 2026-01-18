
// Simulation of the deduplication logic in Billing.jsx

const newItems = [
    { description: "Pantoprazole 40mg", amount: 8, stock_deducted: false }, // Suggestion
    { description: "Pantoprazole 40mg", amount: 105.6, stock_deducted: true } // Real Sale (deducted)
];

console.log("Input newItems:", newItems);

// 1. Identify "Real Sales"
const incomingSalesNames = new Set(
    newItems.filter(i => i.stock_deducted).map(i => i.description.toLowerCase().trim())
);

console.log("Real Sales Names:", Array.from(incomingSalesNames));

// 2. Self-Clean
const selfCleanedNewItems = newItems.filter(item => {
    if (item.stock_deducted) return true;
    // Drop suggestion if we have a real sale
    if (incomingSalesNames.has(item.description.toLowerCase().trim())) {
        console.log(`Dropping suggestion for ${item.description} because Real Sale exists.`);
        return false;
    }
    return true;
});

console.log("Self-Cleaned newItems:", selfCleanedNewItems);

if (selfCleanedNewItems.length === 1 && selfCleanedNewItems[0].stock_deducted) {
    console.log("PASS: Deduplication worked.");
} else {
    console.log("FAIL: Duplicate remains.");
}
