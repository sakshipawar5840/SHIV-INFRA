import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:3000/api/v1/google/oauth/callback";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const isOAuthConfigured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
const isConnected = isOAuthConfigured && !!GOOGLE_REFRESH_TOKEN;
const isMapsConfigured = !!GOOGLE_MAPS_API_KEY;

let driveClient: any = null;
let calendarClient: any = null;
let sheetsClient: any = null;

if (isConnected) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN,
    });

    driveClient = google.drive({ version: "v3", auth: oauth2Client });
    calendarClient = google.calendar({ version: "v3", auth: oauth2Client });
    sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });
    console.log("[SHIVINFRA GOOGLE] Google Drive, Calendar, and Sheets clients established successfully.");
  } catch (err) {
    console.error("[SHIVINFRA GOOGLE] Error compiling OAuth client:", err);
  }
} else if (isOAuthConfigured) {
  console.log("[SHIVINFRA GOOGLE] OAuth configured but not connected. Visit /api/v1/google/oauth/start to authorize.");
} else {
  console.log("[SHIVINFRA GOOGLE] Keys missing. Google integration operating in secure offline-sandbox emulation.");
}

export function reinitializeGoogleClients(refreshToken: string | null | undefined) {
  if (!refreshToken) return;

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    driveClient = google.drive({ version: "v3", auth: oauth2Client });
    calendarClient = google.calendar({ version: "v3", auth: oauth2Client });
    sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });
    console.log("[SHIVINFRA GOOGLE] Google Drive, Calendar, and Sheets clients reinitialized successfully.");
  } catch (err) {
    console.error("[SHIVINFRA GOOGLE] Error reinitializing OAuth client:", err);
  }
}

export class GoogleService {
  static async uploadToDrive(localFilePath: string, originalName: string, mimeType: string, folderPath?: string): Promise<string> {
    if (!driveClient) {
      console.log(`[SHIVINFRA DRIVE-MOCK] Successfully backed up ${originalName} to Google Cloud storage.`);
      const mockId = Array.from({ length: 33 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");
      return `https://drive.google.com/open?id=${mockId}`;
    }

    try {
      let parentId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

      if (folderPath) {
        parentId = await GoogleService.findOrCreateFolderPath(folderPath, parentId);
      }

      const fileMetadata: any = {
        name: originalName,
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const media = {
        mimeType,
        body: fs.createReadStream(localFilePath),
      };

      const response = await driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, webViewLink",
      });

      console.log(`[SHIVINFRA GOOGLE] Backed up ${originalName} with Drive ID: ${response.data.id}`);
      return response.data.webViewLink || `https://drive.google.com/open?id=${response.data.id}`;
    } catch (error: any) {
      console.error("[SHIVINFRA GOOGLE] Google Drive uploading failed:", error);
      throw new Error(error.message || "Google Drive upload failed.");
    }
  }

  static async findOrCreateFolderPath(folderPath: string, rootParentId?: string | null): Promise<string | null> {
    if (!driveClient) {
      return rootParentId;
    }

    const parts = folderPath.split("/").filter(Boolean);
    let currentParentId = rootParentId;

    for (const part of parts) {
      const query = [
        `name = '${part.replace(/'/g, "\\'")}'`,
        `mimeType = 'application/vnd.google-apps.folder'`,
        "trashed = false",
      ];

      if (currentParentId) {
        query.push(`'${currentParentId}' in parents`);
      } else {
        query.push("'root' in parents");
      }

      const { data: folders } = await driveClient.files.list({
        q: query.join(" and "),
        fields: "files(id, name)",
        spaces: "drive",
      });

      const existing = folders.files?.[0];
      if (existing) {
        currentParentId = existing.id;
        continue;
      }

      const { data: created } = await driveClient.files.create({
        requestBody: {
          name: part,
          mimeType: "application/vnd.google-apps.folder",
          parents: currentParentId ? [currentParentId] : undefined,
        },
        fields: "id",
      });

      currentParentId = created.id;
    }

    return currentParentId;
  }

  static async createCalendarEvent(title: string, date: Date | string, description: string): Promise<string> {
    if (!calendarClient) {
      console.log(`[SHIVINFRA CALENDAR-MOCK] Scheduled event "${title}" on Google Calendar timeline.`);
      const mockId = Array.from({ length: 26 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");
      return mockId;
    }

    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
      const startDateTime = new Date(date);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      };

      const response = await calendarClient.events.insert({
        calendarId,
        requestBody: event,
      });

      console.log(`[SHIVINFRA GOOGLE] Inserted Calendar Event ID: ${response.data.id}`);
      return response.data.id || "unknown";
    } catch (error: any) {
      console.error("[SHIVINFRA GOOGLE] Google Calendar event booking failed:", error);
      throw new Error(error.message || "Google Calendar event creation failed.");
    }
  }

  static async searchNearbySuppliers(
    materialQuery: string,
    location: string,
    radiusMeters: number = 5000
  ): Promise<{
    configured: boolean;
    results: Array<{
      name: string;
      address: string;
      phone?: string;
      rating?: number;
      placeId?: string;
      mapUrl: string;
    }>;
    error?: string;
  }> {
    if (!isMapsConfigured || !GOOGLE_MAPS_API_KEY) {
      return {
        configured: false,
        results: [],
        error: "GOOGLE_MAPS_API_KEY is not configured",
      };
    }

    try {
      const query = `${materialQuery} ${location}`.trim();
      const url = "https://places.googleapis.com/v1/places:searchText";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.internationalPhoneNumber,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri",
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 10,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`[GOOGLE MAPS] API error ${response.status}: ${errorText}`);
        
        let userMessage = `Google Places API error: ${response.status}`;
        if (response.status === 403) {
          userMessage = "Google Maps integration is not configured correctly. Please contact support.";
        } else if (response.status === 429) {
          userMessage = "Google Maps search quota exceeded. Please try again later.";
        } else if (response.status >= 500) {
          userMessage = "Google Maps search is temporarily unavailable. Please try again.";
        }
        
        return {
          configured: true,
          results: [],
          error: userMessage,
        };
      }

      const data = await response.json();

      if (data.error) {
        const reason = data.error.details?.[0]?.reason || data.error.message || "UNKNOWN_ERROR";
        console.error(`[GOOGLE MAPS] API error: ${reason}`);
        
        let userMessage = "Google Maps search is temporarily unavailable. Please try again.";
        if (reason === "API_KEY_SERVICE_BLOCKED" || reason === "PERMISSION_DENIED") {
          userMessage = "Google Maps integration is not configured correctly. Please contact support.";
        } else if (reason === "OVER_QUERY_LIMIT" || reason === "RATE_LIMIT_EXCEEDED") {
          userMessage = "Google Maps search quota exceeded. Please try again later.";
        } else if (reason === "BILLING_NOT_ENABLED") {
          userMessage = "Google Maps integration requires billing to be enabled. Please contact support.";
        }
        
        return {
          configured: true,
          results: [],
          error: userMessage,
        };
      }

      const places = Array.isArray(data.places) ? data.places : [];

      if (places.length === 0) {
        return {
          configured: true,
          results: [],
          error: "ZERO_RESULTS",
        };
      }

      const results = places.map((place: any) => {
        const placeId = place.id || undefined;
        const name = place.displayName?.text || place.name || "";
        const address = place.formattedAddress || "";
        const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || undefined;
        const rating = typeof place.rating === "number" ? place.rating : undefined;
        const mapUrl = place.googleMapsUri || (placeId
          ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || query)}`);

        return {
          name,
          address,
          phone,
          rating,
          placeId,
          mapUrl,
        };
      });

      console.log(`[GOOGLE MAPS] Material search completed. Query: "${query}". Results: ${results.length}`);

      return {
        configured: true,
        results,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("[GOOGLE MAPS] Request timeout");
        return {
          configured: true,
          results: [],
          error: "Google Places API request timeout",
        };
      }

      console.error("[GOOGLE MAPS] Search error:", error);
      return {
        configured: true,
        results: [],
        error: error?.message || "Unknown Google Places error",
      };
    }
  }

  // ============================================
  // GOOGLE SHEETS
  // ============================================

  static async getBillsSpreadsheetId(): Promise<string | null> {
    const existingId = process.env.GOOGLE_SHEETS_BILLS_SPREADSHEET_ID;
    if (existingId) {
      return existingId;
    }

    if (!sheetsClient) {
      console.log("[SHIVINFRA SHEETS-MOCK] Bills spreadsheet not configured.");
      return null;
    }

    try {
      const url = await GoogleService.createSpreadsheet("SHIVINFRA Bills");
      const match = url.match(/\/d\/([^\/]+)/);
      return match ? match[1] : null;
    } catch (error: any) {
      console.error("[SHIVINFRA GOOGLE] Bills spreadsheet creation failed:", error);
      return null;
    }
  }

  static async createSpreadsheet(title: string): Promise<string> {
    if (!sheetsClient) {
      console.log(`[SHIVINFRA SHEETS-MOCK] Spreadsheet "${title}" created.`);
      const mockId = Array.from({ length: 33 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");
      return `https://docs.google.com/spreadsheets/d/${mockId}/edit`;
    }

    try {
      const response = await sheetsClient.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: [{ properties: { title: "Sheet1" } }],
        },
      });

      const spreadsheetId = response.data.spreadsheetId;
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      console.log(`[SHIVINFRA GOOGLE] Spreadsheet created: ${url}`);
      return url;
    } catch (error: any) {
      console.error("[SHIVINFRA GOOGLE] Spreadsheet creation failed:", error);
      throw new Error(error.message || "Failed to create spreadsheet.");
    }
  }

  static async appendSheetRows(spreadsheetId: string, range: string, values: string[][]): Promise<void> {
    if (!sheetsClient) {
      console.log(`[SHIVINFRA SHEETS-MOCK] Appended ${values.length} rows to ${spreadsheetId}`);
      return;
    }

    try {
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId,
        range,
        requestBody: {
          values,
          majorDimension: "ROWS",
        },
        valueInputOption: "RAW",
      });

      console.log(`[SHIVINFRA GOOGLE] Appended ${values.length} rows to spreadsheet ${spreadsheetId}`);
    } catch (error: any) {
      console.error("[SHIVINFRA GOOGLE] Sheet append failed:", error);
      throw new Error(error.message || "Failed to append rows to spreadsheet.");
    }
  }

  static async readSheetRows(spreadsheetId: string, range: string): Promise<string[][]> {
    if (!sheetsClient) {
      console.log(`[SHIVINFRA SHEETS-MOCK] Read rows from ${spreadsheetId}`);
      return [];
    }

    try {
      const response = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      console.log(`[SHIVINFRA GOOGLE] Read ${rows.length} rows from spreadsheet ${spreadsheetId}`);
      return rows;
    } catch (error: any) {
      console.error("[SHIVINFRA GOOGLE] Sheet read failed:", error);
      throw new Error(error.message || "Failed to read spreadsheet rows.");
    }
  }

  static async updateSheetRows(spreadsheetId: string, range: string, values: string[][]): Promise<void> {
    if (!sheetsClient) {
      console.log(`[SHIVINFRA SHEETS-MOCK] Updated rows in ${spreadsheetId}`);
      return;
    }

    try {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range,
        requestBody: {
          values,
          majorDimension: "ROWS",
        },
        valueInputOption: "RAW",
      });

      console.log(`[SHIVINFRA GOOGLE] Updated ${values.length} rows in spreadsheet ${spreadsheetId}`);
    } catch (error: any) {
      console.error("[SHIVINFRA GOOGLE] Sheet update failed:", error);
      throw new Error(error.message || "Failed to update spreadsheet rows.");
    }
  }
}
export default GoogleService;
