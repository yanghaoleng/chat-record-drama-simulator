import type { ServerResponse } from "node:http";
import { readJsonBody, sendJson, type JsonRequest } from "../_http.js";
import { continueStoryWithDeepSeek } from "../../server/deepseek.js";

export default async function handler(request: JsonRequest, response: ServerResponse) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(request);
    return sendJson(response, 200, await continueStoryWithDeepSeek(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "DeepSeek story continuation failed";
    return sendJson(response, 502, { error: message });
  }
}
