import { MaterialSearchProvider } from "./materialSearchProvider.ts";

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
const DEFAULT_RADIUS = 5000;
const LOCATIONIQ_BASE_URL = "https://us1.locationiq.com/v1";

function isConfigured(): boolean {
  return !!LOCATIONIQ_API_KEY;
}

function buildMapUrl(placeId: string | undefined, name: string, lat?: string, lon?: string): string {
  if (placeId) {
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat || "")}&mlon=${encodeURIComponent(lon || "")}#map=17/${encodeURIComponent(lat || "0")}/${encodeURIComponent(lon || "0")}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(name)}`;
}

const MATERIAL_KEYWORDS = [
  "cement",
  "concrete",
  "steel",
  "iron",
  "hardware",
  "building material",
  "construction material",
  "supplier",
  "dealer",
  "store",
  "shop",
  "aggregate",
  "sand",
  "brick",
  "tile",
  "plumbing",
  "electrical",
  "rod",
  "bar",
  "rod",
  "cement",
  "flyash",
  "paint",
  "tool",
  "equipment",
  "scaffold",
  "formwork",
  "chemical",
  "admixture",
];

const OSM_SUPPLIER_TAGS = [
  "shop:hardware",
  "shop:building_supplies",
  "shop:doityourself",
  "shop:cement",
  "shop:aggregate",
  "shop:brick",
  "shop:tile",
  "industrial:supplier",
];

function isMaterialRelevant(place: any, materialQuery: string): boolean {
  const searchText = [
    place.display_name || "",
    place.name || "",
    place.address?.name || "",
    place.address?.road || "",
    place.class || "",
    place.type || "",
  ]
    .join(" ")
    .toLowerCase();

  const queryTerms = materialQuery.toLowerCase().split(/\s+/);

  const hasKeyword = MATERIAL_KEYWORDS.some((kw) => searchText.includes(kw));
  const hasQueryTerm = queryTerms.some((term) => term.length > 2 && searchText.includes(term));

  return hasKeyword || hasQueryTerm;
}

function normalizePlace(place: any): {
  name: string;
  address: string;
  phone?: string | null;
  rating?: number | null;
  placeId?: string;
  mapUrl: string;
  category?: string | null;
  lat?: string;
  lon?: string;
} {
  const placeId = place.place_id || undefined;
  const name =
    place.address?.name ||
    place.name ||
    place.display_name?.split(",")[0]?.trim() ||
    "Unknown";
  const address = place.display_name || "";
  const lat = place.lat;
  const lon = place.lon;
  const category = place.class && place.type ? `${place.class}:${place.type}` : place.class || place.type || null;
  const mapUrl = buildMapUrl(placeId, name, lat, lon);

  return {
    name,
    address,
    phone: null,
    rating: null,
    placeId,
    mapUrl,
    category,
    lat,
    lon,
  };
}

export class LocationIQService implements MaterialSearchProvider {
  async searchNearbySuppliers(
    materialQuery: string,
    location: string,
    radiusMeters: number = DEFAULT_RADIUS
  ): Promise<{
    configured: boolean;
    results: Array<{
      name: string;
      address: string;
      phone?: string | null;
      rating?: number | null;
      placeId?: string;
      mapUrl: string;
      category?: string | null;
    }>;
    error?: string;
  }> {
    if (!isConfigured() || !LOCATIONIQ_API_KEY) {
      return {
        configured: false,
        results: [],
        error: "LOCATIONIQ_API_KEY is not configured",
      };
    }

    try {
      const trimmedLocation = location.trim();
      if (!trimmedLocation) {
        return {
          configured: true,
          results: [],
          error: "Location is required for material search.",
        };
      }

      const geocodeUrl = new URL(`${LOCATIONIQ_BASE_URL}/search.php`);
      geocodeUrl.searchParams.set("key", LOCATIONIQ_API_KEY);
      geocodeUrl.searchParams.set("q", trimmedLocation);
      geocodeUrl.searchParams.set("format", "json");
      geocodeUrl.searchParams.set("limit", "1");

      const geocodeController = new AbortController();
      const geocodeTimeout = setTimeout(() => geocodeController.abort(), 10000);

      let geocodeResponse: Response;
      try {
        geocodeResponse = await fetch(geocodeUrl.toString(), {
          method: "GET",
          signal: geocodeController.signal,
        });
      } catch (err: any) {
        clearTimeout(geocodeTimeout);
        if (err.name === "AbortError") {
          return {
            configured: true,
            results: [],
            error: "LocationIQ location lookup timed out.",
          };
        }
        throw err;
      } finally {
        clearTimeout(geocodeTimeout);
      }

      if (geocodeResponse.status === 429) {
        return {
          configured: true,
          results: [],
          error: "LocationIQ search quota exceeded. Please try again later.",
        };
      }

      if (geocodeResponse.status === 401 || geocodeResponse.status === 403) {
        return {
          configured: true,
          results: [],
          error: "LocationIQ API key is invalid or unauthorized.",
        };
      }

      if (!geocodeResponse.ok) {
        const errorText = await geocodeResponse.text().catch(() => "Unknown error");
        console.error(`[LOCATIONIQ] Geocode API error ${geocodeResponse.status}: ${errorText}`);
        return {
          configured: true,
          results: [],
          error: `LocationIQ location lookup failed: ${geocodeResponse.status}`,
        };
      }

      const geocodeData = await geocodeResponse.json();

      if (!Array.isArray(geocodeData) || geocodeData.length === 0) {
        return {
          configured: true,
          results: [],
          error: "ZERO_RESULTS",
        };
      }

      const lat = geocodeData[0].lat;
      const lon = geocodeData[0].lon;

      if (!lat || !lon) {
        return {
          configured: true,
          results: [],
          error: "LocationIQ location lookup returned invalid coordinates.",
        };
      }

      const nearbyUrl = new URL(`${LOCATIONIQ_BASE_URL}/nearby`);
      nearbyUrl.searchParams.set("key", LOCATIONIQ_API_KEY);
      nearbyUrl.searchParams.set("lat", lat);
      nearbyUrl.searchParams.set("lon", lon);
      nearbyUrl.searchParams.set("radius", String(Math.min(radiusMeters, 50000)));
      nearbyUrl.searchParams.set("limit", "20");
      nearbyUrl.searchParams.set("tag", OSM_SUPPLIER_TAGS.join(","));

      const nearbyController = new AbortController();
      const nearbyTimeout = setTimeout(() => nearbyController.abort(), 10000);

      let nearbyResponse: Response;
      try {
        nearbyResponse = await fetch(nearbyUrl.toString(), {
          method: "GET",
          signal: nearbyController.signal,
        });
      } catch (err: any) {
        clearTimeout(nearbyTimeout);
        if (err.name === "AbortError") {
          return {
            configured: true,
            results: [],
            error: "LocationIQ nearby search timed out.",
          };
        }
        throw err;
      } finally {
        clearTimeout(nearbyTimeout);
      }

      clearTimeout(nearbyTimeout);

      if (nearbyResponse.status === 429) {
        return {
          configured: true,
          results: [],
          error: "LocationIQ search quota exceeded. Please try again later.",
        };
      }

      if (nearbyResponse.status === 401 || nearbyResponse.status === 403) {
        return {
          configured: true,
          results: [],
          error: "LocationIQ API key is invalid or unauthorized.",
        };
      }

      if (!nearbyResponse.ok) {
        const errorText = await nearbyResponse.text().catch(() => "Unknown error");
        console.error(`[LOCATIONIQ] Nearby API error ${nearbyResponse.status}: ${errorText}`);
        return {
          configured: true,
          results: [],
          error: `LocationIQ nearby search failed: ${nearbyResponse.status}`,
        };
      }

      const nearbyData = await nearbyResponse.json();

      if (!Array.isArray(nearbyData) || nearbyData.length === 0) {
        return {
          configured: true,
          results: [],
          error: "ZERO_RESULTS",
        };
      }

      const filtered = nearbyData.filter((place: any) => isMaterialRelevant(place, materialQuery));

      const results = (filtered.length > 0 ? filtered : nearbyData.slice(0, 10)).map((place: any) =>
        normalizePlace(place)
      );

      console.log(
        `[LOCATIONIQ] Material search completed. Query: "${materialQuery} ${location}". Results: ${results.length}`
      );

      return {
        configured: true,
        results,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("[LOCATIONIQ] Request timeout");
        return {
          configured: true,
          results: [],
          error: "LocationIQ search request timeout",
        };
      }

      console.error("[LOCATIONIQ] Search error:", error);
      return {
        configured: true,
        results: [],
        error: error?.message || "Unknown LocationIQ error",
      };
    }
  }
}

export default LocationIQService;
