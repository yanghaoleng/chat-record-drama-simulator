import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "./_http.js";

export default function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "GET") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  return sendJson(response, 200, { ok: true });
}
