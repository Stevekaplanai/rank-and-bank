import type { Building } from "./types";
import buildingsJson from "../../../../data/buildings.json";

export const buildings = buildingsJson as Building[];

export function getBuilding(id: string): Building | undefined {
  return buildings.find((b) => b.id === id);
}

export const CONTROVERSIAL_BUILDING_ID = "brickell-flatiron";
