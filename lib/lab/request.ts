import { z } from "zod";
import { frameworks } from "./catalog";
import { documents } from "../documents";

export const labRequestSchema = z.object({
  framework: z.enum(frameworks.map(item => item.id)),
  question: z.string().trim().min(1).max(2000),
  documentIds: z.array(z.string().refine(id => documents.some(doc => doc.id === id))).min(1).max(documents.length)
    .transform(ids => [...new Set(ids)]),
});
