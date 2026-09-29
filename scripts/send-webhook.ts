const phone = process.argv[2];
const message = process.argv.slice(3).join(" ");
if (!phone || !message) {
    console.error("Usage: tsx scripts/send-webhook.ts <phone> <message...>");
    process.exit(1);
}
const payload = {
    object: "whatsapp_business_account",
    entry: [{
        id: "entry1",
        changes: [{
            value: {
                messages: [{
                    from: phone,
                    id: `wamid.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
                    type: "text",
                    text: { body: message },
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                }],
            },
        }],
    }],
};
const res = await fetch("http://localhost:3000/api/v1/whatsapp/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
});
console.log(`HTTP ${res.status} ${await res.text()}`);
