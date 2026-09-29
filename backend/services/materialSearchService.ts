import { MaterialSearchProvider } from "./materialSearchProvider.ts";
import { GoogleService } from "./googleService.ts";
import { LocationIQService } from "./locationiqService.ts";

const MATERIAL_SEARCH_PROVIDER = (process.env.MATERIAL_SEARCH_PROVIDER || "locationiq") as
  | "locationiq"
  | "google";

let cachedProvider: MaterialSearchProvider | null = null;

function getProvider(): MaterialSearchProvider {
  if (cachedProvider) return cachedProvider;

  if (MATERIAL_SEARCH_PROVIDER === "google") {
    cachedProvider = GoogleService;
  } else {
    cachedProvider = new LocationIQService();
  }

  return cachedProvider;
}

export async function searchNearbySuppliers(
  materialQuery: string,
  location: string,
  radiusMeters: number = 5000
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
  const provider = getProvider();
  return provider.searchNearbySuppliers(materialQuery, location, radiusMeters);
}

export function getActiveMaterialSearchProvider(): string {
  return MATERIAL_SEARCH_PROVIDER;
}
