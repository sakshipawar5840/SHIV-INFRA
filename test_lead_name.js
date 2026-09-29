function extractLeadName(message) {
    const cleaned =
        message
            .replace(
                /\b(?:delete|remove|enquiry|inquiry|please|kindly|krupaya|kripa|update|change|edit|set|budget|price|phone|mobile|email|address|city|status|amount|to|ka|chi|cha|la|for|hai|ha|aahe|ho|kar|banav|tayar|show|find|search|list|dakhav|is|=)\b/gi,
                ""
            )
            .replace(
                /^\s*lead\s+/i,
                ""
            )
            .replace(
                /\b\d+(?:\.\d+)?\s*(?:lakh|lac|cr|crore|thousand|k|rs|rupees|₹)?\b/gi,
                ""
            )
            .replace(
                /\b(?:lakh|lac|cr|crore|thousand|k|rs|rupees|₹)\b/gi,
                ""
            )
            .replace(
                /[,\-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    return { name: cleaned };
}

const tests = [
    "Update lead New Lead Person budget to 60 lakh",
    "Add lead New Lead Person",
    "Delete lead New Lead Person",
    "Search lead New Lead Person",
    "Update lead Rahul Patil budget to 70 lakh",
    "Change lead Rohit Pil status to Qualified"
];

tests.forEach(t => {
    console.log("INPUT:", t);
    console.log("NAME:", extractLeadName(t).name);
    console.log("---");
});
