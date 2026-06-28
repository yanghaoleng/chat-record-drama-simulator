import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../_http.js";
import { getDeepSeekSettingsView } from "../../server/settings.js";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "GET") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  return sendJson(response, 200, await getDeepSeekSettingsView());
}
