import dotenv from "dotenv";

dotenv.config();

const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
const SYSTEM_TOKEN = process.env.META_WHATSAPP_TOKEN;

export class WhatsAppService {
  /**
   * Helper to dispatch an API call directly to Meta Cloud API endpoint
   */
  private static async postMetaAPI(payload: any): Promise<boolean> {
    if (!PHONE_NUMBER_ID || !SYSTEM_TOKEN || SYSTEM_TOKEN === "EAAG...") {
      console.log("[SHIVINFRA WHATSAPP-MOCK] Dispatched payload via Meta webhook simulation:", JSON.stringify(payload, null, 2));
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SYSTEM_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("[SHIVINFRA WHATSAPP-ERROR] Meta API dispatch failed:", result);
        return false;
      }

      console.log("[SHIVINFRA WHATSAPP] Message dispatched successfully through Meta Cloud API:", result.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.error("[SHIVINFRA WHATSAPP-ERROR] Fetch operation failed:", error);
      return false;
    }
  }

  /**
   * Sends standard Text Message
   */
  static async sendTextMessage(phone: string, text: string): Promise<boolean> {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: text },
    };
    return this.postMetaAPI(payload);
  }

  /**
   * Sends Document / PDF Brochure files
   */
  static async sendDocumentMessage(phone: string, documentUrl: string, filename: string, caption: string = ""): Promise<boolean> {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "document",
      document: {
        link: documentUrl,
        filename: filename,
        caption: caption,
      },
    };
    return this.postMetaAPI(payload);
  }

  /**
   * Sends interactive Quick Reply Buttons
   */
  static async sendInteractiveButtons(phone: string, text: string, buttons: Array<{ id: string; title: string }>): Promise<boolean> {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: text },
        action: {
          buttons: buttons.map((btn) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    };
    return this.postMetaAPI(payload);
  }

  /**
   * Sends interactive Selection List
   */
  static async sendInteractiveList(
    phone: string,
    title: string,
    bodyText: string,
    buttonLabel: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<boolean> {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: title,
        },
        body: {
          text: bodyText,
        },
        action: {
          button: buttonLabel,
          sections: sections.map((sec) => ({
            title: sec.title,
            rows: sec.rows.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description || "",
            })),
          })),
        },
      },
    };
    return this.postMetaAPI(payload);
  }

  /**
   * Sends GPS Coordinates / Site Location details
   */
  static async sendLocationMessage(phone: string, latitude: number, longitude: number, name: string, address: string): Promise<boolean> {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "location",
      location: {
        latitude,
        longitude,
        name,
        address,
      },
    };
    return this.postMetaAPI(payload);
  }

  /**
   * Downloads media from WhatsApp Cloud API
   * Returns the media buffer
   */
  static async downloadMedia(mediaId: string): Promise<Buffer | null> {
    if (!mediaId) {
      return null;
    }

    const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const SYSTEM_TOKEN = process.env.META_WHATSAPP_TOKEN;

    if (!PHONE_NUMBER_ID || !SYSTEM_TOKEN || SYSTEM_TOKEN === "EAAG...") {
      console.log("[SHIVINFRA WHATSAPP-MOCK] Media download simulated for:", mediaId);
      return null;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${mediaId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SYSTEM_TOKEN}`,
        },
      });

      if (!response.ok) {
        console.error("[SHIVINFRA WHATSAPP-ERROR] Media download failed:", response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      const mediaUrl = result.url;

      if (!mediaUrl) {
        console.error("[SHIVINFRA WHATSAPP-ERROR] No media URL in response");
        return null;
      }

      const mediaResponse = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${SYSTEM_TOKEN}`,
        },
      });

      if (!mediaResponse.ok) {
        console.error("[SHIVINFRA WHATSAPP-ERROR] Media fetch failed:", mediaResponse.status, mediaResponse.statusText);
        return null;
      }

      const arrayBuffer = await mediaResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("[SHIVINFRA WHATSAPP-ERROR] Media download error:", error);
      return null;
    }
  }
}
export default WhatsAppService;
