export const contractAddresses = {
  registry: (import.meta.env.VITE_PUBLIC_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  rpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL ?? "https://rpc.testnet.zama.ai/sepolia",
  relayerUrl: import.meta.env.VITE_PUBLIC_RELAYER_URL ?? "https://relayer.testnet.zama.cloud"
};
