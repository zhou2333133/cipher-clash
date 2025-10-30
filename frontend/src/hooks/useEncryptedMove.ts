import { useState } from "react";
import { usePublicClient } from "wagmi";

import { contractAddresses } from "../contracts/addresses";
import { useFhevm } from "../fhevm/useFhevm";

interface EncryptionResult {
  encryptedData: string;
  inputProof: string;
}

interface UseEncryptionReturn {
  encryptMove: (value: number, contractAddress: string, userAddress: string) => Promise<EncryptionResult>;
  isEncrypting: boolean;
  encryptionError: string | null;
  status: ReturnType<typeof useFhevm>["status"];
  isReady: boolean;
}

export const useEncryptedMove = (): UseEncryptionReturn => {
  const publicClient = usePublicClient();
  const eip1193Provider =
    typeof window !== "undefined" && (window as unknown as { ethereum?: any }).ethereum
      ? (window as unknown as { ethereum: any }).ethereum
      : contractAddresses.rpcUrl;

  const chainId = publicClient?.chain?.id;

  const { instance, status } = useFhevm({
    provider: eip1193Provider,
    chainId,
    enabled: true
  });

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionError, setEncryptionError] = useState<string | null>(null);

  const encryptMove = async (
    value: number,
    contractAddress: string,
    userAddress: string
  ): Promise<EncryptionResult> => {
    if (!instance || status !== "ready") {
      throw new Error(`FHEVM instance not ready (status: ${status})`);
    }

    setIsEncrypting(true);
    setEncryptionError(null);

    try {
      const input = instance.createEncryptedInput(contractAddress, userAddress);
      input.add8(value);

      const encrypted = await input.encrypt();

      const toHex = (data: Uint8Array | string): string => {
        if (typeof data === "string") return data;
        return (
          "0x" +
          Array.from(data)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
        );
      };

      return {
        encryptedData: toHex(encrypted.handles[0]),
        inputProof: toHex(encrypted.inputProof)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Encryption failed";
      setEncryptionError(errorMessage);
      throw new Error(`Failed to encrypt move: ${errorMessage}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  return {
    encryptMove,
    isEncrypting,
    encryptionError,
    status,
    isReady: status === "ready" && Boolean(instance)
  };
};
