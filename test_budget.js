const message = "Update lead 5cf33015-3f05-4b0f-8ffe-9045aa5249d8 budget to 8500000";
const budgetMatch = message.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|lakhs|crores)/i) || message.match(/budget\s+(?:to\s+)?(\d+(?:\.\d+)?)/i);
console.log("budgetMatch:", budgetMatch);
