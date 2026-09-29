import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const bucketsToCreate = [
    { id: "bills", name: "bills", public: false },
    { id: "documents", name: "documents", public: false },
  ];

  console.log("Checking/creating Supabase Storage buckets:\n");

  for (const bucket of bucketsToCreate) {
    const { data: existing, error: listError } = await supabase.storage.listBuckets();
    const found = existing?.find((b: any) => b.id === bucket.id || b.name === bucket.name);

    if (found) {
      console.log(`✅ Bucket '${bucket.name}' already exists (public=${found.public})`);
    } else {
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        allowedMimeTypes: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        fileSizeLimit: 15 * 1024 * 1024,
      });

      if (error) {
        console.error(`❌ Failed to create bucket '${bucket.name}':`, error.message);
      } else {
        console.log(`✅ Created bucket '${bucket.name}' (public=${bucket.public})`);
      }
    }
  }
}

main().catch((error) => {
  console.error("Bucket setup failed:", error);
  process.exit(1);
});
