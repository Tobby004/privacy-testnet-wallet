export const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrls: [
      "https://sepolia.drpc.org",
      "https://rpc.sepolia.org",
      "https://ethereum-sepolia-rpc.publicnode.com",
    ],
    explorerUrl: "https://sepolia.etherscan.io",
    faucetUrl: "https://www.alchemy.com/faucets/ethereum-sepolia",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrls: [
      "https://sepolia.base.org",
      "https://base-sepolia-rpc.publicnode.com",
    ],
    explorerUrl: "https://sepolia.basescan.org",
    faucetUrl: "https://www.alchemy.com/faucets/base-sepolia",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrls: [
      "https://sepolia-rollup.arbitrum.io/rpc",
      "https://arbitrum-sepolia-rpc.publicnode.com",
    ],
    explorerUrl: "https://sepolia.arbiscan.io",
    faucetUrl: "https://www.alchemy.com/faucets/arbitrum-sepolia",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
  polygonAmoy: {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrls: [
      "https://rpc-amoy.polygon.technology",
      "https://polygon-amoy-bor-rpc.publicnode.com",
    ],
    explorerUrl: "https://amoy.polygonscan.com",
    faucetUrl: "https://faucet.polygon.technology",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  },
};

export type NetworkId = keyof typeof NETWORKS;

export function getNetwork(id: NetworkId) {
  return NETWORKS[id];
}