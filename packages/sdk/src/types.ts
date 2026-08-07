export type BuildingOnChain = {
  buildingId: string;
  mint: string;
  supply: number;
  reserveLamports: number;
  graduated: boolean;
  priceSol: number;
  marketCapSol: number;
};

export type DeploymentConfig = {
  cluster: string;
  programId: string;
  rpcUrl: string;
  graduationThresholdSol: number;
  curve: {
    basePriceLamports: number;
    slopeLamports: number;
  };
  buildings: Record<
    string,
    {
      mint: string;
      buildingPda: string;
    }
  >;
};
