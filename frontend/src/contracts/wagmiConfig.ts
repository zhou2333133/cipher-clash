import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { sepolia } from "wagmi/chains";

import { contractAddresses } from "./addresses";

const projectId = import.meta.env.VITE_PUBLIC_WALLETCONNECT_ID ?? "demo-walletconnect";

export const wagmiConfig = getDefaultConfig({
  appName: "CipherClash",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(contractAddresses.rpcUrl)
  }
});
