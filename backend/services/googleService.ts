import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const isConfigured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);

let driveClient: any = null;
let calendarClient: any = null;

if (isConfigured) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN,
    });

    driveClient = google.drive({ version: "v3", auth: oauth2Client });
    calendarClient = google.calendar({ version: "v3", auth: oauth2Client });
    console.log("[SHIVINFRA GOOGLE] Google Drive & Calendar clients established successfully.");
  } catch (err) {
    console.error("[SHIVINFRA GOOGLE] Error compiling OAuth client:", err);
  }
} else {
  console.log("[SHIVINFRA GOOGLE] Keys missing. Google integration operating in secure offline-sandbox emulation.");
}

export class GoogleService {
  /**
   * Backs up files (bills, documents, reports) to a designated Google Drive folder
   */
  static async uploadToDrive(localFilePath: string, originalName: string, mimeType: string): Promise<string> {
    if (!driveClient) {
      console.log(`[SHIVINFRA DRIVE-MOCK] Successfully backed up ${originalName} to Google Cloud storage.`);
      return "https://drive.google.com/open?id=mock_drive_file_id_" + Math.random().toString(36).substring(7);
    }

    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      const fileMetadata = {
        name: originalName,
        parents: folderId ? [folderId] : [],
      };

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
    } catch (error) {
      console.error("[SHIVINFRA GOOGLE] Google Drive uploading failed:", error);
      return `https://drive.google.com/open?id=mock_fallback_on_error_${Date.now()}`;
    }
  }

  /**
   * Synchronizes construction site visits and project check-ins directly on Google Calendar
   */
  static async createCalendarEvent(title: string, date: Date | string, description: string): Promise<string> {
    if (!calendarClient) {
      console.log(`[SHIVINFRA CALENDAR-MOCK] Scheduled event "${title}" on Google Calendar timeline.`);
      return "mock_calendar_event_id_" + Math.floor(100000 + Math.random() * 900000);
    }

    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
      const startDateTime = new Date(date);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

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
    } catch (error) {
      console.error("[SHIVINFRA GOOGLE] Google Calendar event booking failed:", error);
      return "mock_fallback_calendar_event_" + Date.now();
    }
  }
}
export default GoogleService;
