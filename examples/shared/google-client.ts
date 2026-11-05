import { GoogleGenAI } from "@google/genai";
import { vertexConfig } from "./context";

export function createGoogleClient() {
  const { project, location } = vertexConfig();
  return new GoogleGenAI({ vertexai: true, project, location });
}
