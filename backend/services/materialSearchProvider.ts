export interface MaterialSearchProvider {
  searchNearbySuppliers(
    materialQuery: string,
    location: string,
    radiusMeters?: number
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
  }>;
}
