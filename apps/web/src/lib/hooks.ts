"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSdk } from "./sdk";
import { buildings } from "./buildings";
import type { BuildingWithMarket } from "./types";

const POLL_MS = 5_000;

export function useMarketBuildings() {
  const { client } = useSdk();
  const ids = useMemo(() => buildings.map((b) => b.id), []);

  return useQuery({
    queryKey: ["markets"],
    queryFn: async (): Promise<BuildingWithMarket[]> => {
      const onChain = await client.getAllBuildings(ids);
      const byId = new Map(onChain.map((o) => [o.buildingId, o]));
      const joined = buildings.map((b) => {
        const m = byId.get(b.id);
        return {
          ...b,
          priceSol: m?.priceSol ?? 0,
          supply: m?.supply ?? 0,
          marketCapSol: m?.marketCapSol ?? 0,
          graduated: m?.graduated ?? false,
          communityRank: 0,
        };
      });
      const sorted = [...joined].sort(
        (a, b) => b.marketCapSol - a.marketCapSol
      );
      const rankMap = new Map(
        sorted.map((b, i) => [b.id, i + 1] as const)
      );
      return joined
        .map((b) => ({
          ...b,
          communityRank: rankMap.get(b.id) ?? 0,
        }))
        .sort((a, b) => a.communityRank - b.communityRank);
    },
    refetchInterval: POLL_MS,
  });
}

export function useBuildingMarket(buildingId: string) {
  const q = useMarketBuildings();
  return {
    ...q,
    data: q.data?.find((b) => b.id === buildingId),
  };
}

export function useTokenBalance(buildingId: string) {
  const { client } = useSdk();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ["balance", buildingId, publicKey?.toBase58()],
    enabled: !!publicKey,
    queryFn: async () => {
      if (!publicKey) return 0;
      return client.getTokenBalance(buildingId, publicKey);
    },
    refetchInterval: POLL_MS,
  });
}

export function useInvalidateMarkets() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["markets"] });
    void qc.invalidateQueries({ queryKey: ["balance"] });
    void qc.invalidateQueries({ queryKey: ["txfeed"] });
  };
}

export type TxFeedItem = {
  signature: string;
  buildingId: string;
  buildingName: string;
  solAmount: number;
  type: "buy" | "sell";
  time: number;
};

/** Demo/mock tx feed + on-chain signatures when available. */
export function useTransactionFeed() {
  const markets = useMarketBuildings();
  return useQuery({
    queryKey: ["txfeed", markets.dataUpdatedAt],
    queryFn: async (): Promise<TxFeedItem[]> => {
      if (typeof window === "undefined") return [];
      const raw = window.sessionStorage.getItem("rnb:txfeed");
      const items: TxFeedItem[] = raw ? JSON.parse(raw) : [];
      return items.slice(0, 20);
    },
    refetchInterval: POLL_MS,
  });
}

export function pushTxFeed(item: TxFeedItem) {
  if (typeof window === "undefined") return;
  const raw = window.sessionStorage.getItem("rnb:txfeed");
  const items: TxFeedItem[] = raw ? JSON.parse(raw) : [];
  items.unshift(item);
  window.sessionStorage.setItem(
    "rnb:txfeed",
    JSON.stringify(items.slice(0, 40))
  );
}
