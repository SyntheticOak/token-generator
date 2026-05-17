import { CanvasDoc } from "../types";

export function canExportToken(doc: CanvasDoc, frameImg: HTMLImageElement | null): boolean {
  return Boolean(doc.frame && frameImg);
}
