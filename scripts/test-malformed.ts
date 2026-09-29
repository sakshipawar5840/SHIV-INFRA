const base = "http://localhost:3000/api/v1/whatsapp/webhook";

async function post(label: string, body: string, ctype: string) {
    try {
        const r = await fetch(base, {
            method: "POST",
            headers: { "Content-Type": ctype },
            body,
        });
        const txt = await r.text();
        console.log(`${label} -> HTTP ${r.status} ${JSON.stringify(txt.slice(0, 90))}`);
    } catch (e: any) {
        console.log(`${label} -> FETCH ERROR ${e?.message}`);
    }
}

async function main() {
    await post("valid-shape-missing-entry", JSON.stringify({ object: "whatsapp_business_account" }), "application/json");
    await post("invalid-json", "this is not json {{{", "application/json");
    await post("empty-body", "", "application/json");
    const a = await fetch("http://localhost:3000/health");
    console.log("server /health ->", a.status);
}

main().catch((e) => { console.error(e); process.exit(1); });
