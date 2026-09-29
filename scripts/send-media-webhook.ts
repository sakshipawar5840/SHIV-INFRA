const phone = process.argv[2] || '9199991234';
const mediaId = process.argv[3] || 'test-media-id';
const mimeType = process.argv[4] || 'image/jpeg';
const fileName = process.argv[5] || 'test-bill.jpg';

const payload = {
    object: "whatsapp_business_account",
    entry: [{
        id: "entry1",
        changes: [{
            value: {
                messages: [{
                    from: phone,
                    id: `wamid.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
                    type: "image",
                    image: {
                        id: mediaId,
                        mime_type: mimeType,
                        filename: fileName,
                        caption: "Upload bill"
                    },
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
