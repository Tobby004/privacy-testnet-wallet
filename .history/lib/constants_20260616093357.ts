export const RPC_ENDPOINTS = [
  "https://sepolia.drpc.org",
  "https://rpc.sepolia.org",
  "https://ethereum-sepolia-rpc.publicnode.com",
];

export const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: RPC_ENDPOINTS[0],
  },
};

export const MEV_BLOCKER_RPC = "https://api.mevblocker.io/tx";