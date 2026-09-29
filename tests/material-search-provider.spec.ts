import { searchNearbySuppliers, getActiveMaterialSearchProvider } from "../backend/services/materialSearchService.ts";

async function main() {
  console.log("Active provider:", getActiveMaterialSearchProvider());

  // Test 1: Missing/invalid configuration handling
  console.log("\n=== TEST 1: Provider configured check ===");
  const result = await searchNearbySuppliers("Cement 53 Grade", "Baner Pune");
  console.log("configured:", result.configured);
  console.log("results count:", result.results.length);
  if (result.error) {
    console.log("error:", result.error);
  }
  if (result.results.length > 0) {
    console.log("first result:", JSON.stringify(result.results[0], null, 2));
  }

  // Test 2: Response normalization check
  console.log("\n=== TEST 2: Response structure ===");
  const expectedFields = ["name", "address", "phone", "rating", "placeId", "mapUrl", "category"];
  const allValid = result.results.every((r) =>
    expectedFields.every((f) => f in r)
  );
  console.log("All results have expected fields:", allValid);

  // Test 3: Empty query handling
  console.log("\n=== TEST 3: Empty query ===");
  const emptyResult = await searchNearbySuppliers("", "");
  console.log("empty query result:", emptyResult.configured, "error:", emptyResult.error);

  console.log("\n=== MATERIAL SEARCH PROVIDER TEST COMPLETE ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
