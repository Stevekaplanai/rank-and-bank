import type { Building } from "./types";
import buildingsJson from "../../../../data/buildings.json";

export const buildings = buildingsJson as Building[];

export function getBuilding(id: string): Building | undefined {
  return buildings.find((b) => b.id === id);
}

/** Demo rally pick: lowest Ryan rank in the featured-5 set (`the-crosby`, Ryan #79). */
export const CONTROVERSIAL_BUILDING_ID = "the-crosby";
