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
    faucetUrl: "https://www.sepoliafaucet.io",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
  goerli: {
    chainId: 5,
    name: "Goerli",
    rpcUrls: [
      "https://goerli.drpc.org",
      "https://rpc.goerli.mudit.blog",
    ],
    explorerUrl: "https://goerli.etherscan.io",
    faucetUrl: "https://goerlifaucet.com",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
};

export type NetworkId = keyof typeof NETWORKS;

export function getNetwork(id: NetworkId) {
  return NETWORKS[id];
}