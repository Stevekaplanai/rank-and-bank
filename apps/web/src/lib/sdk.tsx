"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Connection } from "@solana/web3.js";
import { RankAndBankClient, type DeploymentConfig } from "@rank-and-bank/sdk";
import { deployment, RPC_URL, PROGRAM_ID, USE_MOCK } from "./config";

type SdkContextValue = {
  client: RankAndBankClient;
  connection: Connection;
  useMock: boolean;
};

const SdkContext = createContext<SdkContextValue | null>(null);

export function SdkProvider({ children }: { children: ReactNode }) {
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const clientRef = useRef<RankAndBankClient | null>(null);

  const value = useMemo(() => {
    const cfg: DeploymentConfig = {
      ...deployment,
      programId: PROGRAM_ID,
      rpcUrl: RPC_URL,
    };
    if (!clientRef.current) {
      clientRef.current = new RankAndBankClient({
        connection,
        deployment: cfg,
        useMock: USE_MOCK,
      });
    }
    return {
      client: clientRef.current,
      connection,
      useMock: clientRef.current.useMock,
    };
  }, [connection]);

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

export function useSdk(): SdkContextValue {
  const ctx = useContext(SdkContext);
  if (!ctx) throw new Error("useSdk must be used within SdkProvider");
  return ctx;
}
