import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance } from "./internal/fhevm";

function _assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    const m = message ? `Assertion failed: ${message}` : `Assertion failed.`;
    console.error(m);
    throw new Error(m);
  }
}

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters;

  const [instance, _setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, _setStatus] = useState<FhevmGoState>("idle");
  const [error, _setError] = useState<Error | undefined>(undefined);
  const [_isRunning, _setIsRunning] = useState<boolean>(enabled);
  const [_providerChanged, _setProviderChanged] = useState<number>(0);
  const _abortControllerRef = useRef<AbortController | null>(null);
  const _providerRef = useRef<string | ethers.Eip1193Provider | undefined>(provider);
  const _chainIdRef = useRef<number | undefined>(chainId);
  const _mockChainsRef = useRef<Record<number, string> | undefined>(initialMockChains);

  const refresh = useCallback(() => {
    if (_abortControllerRef.current) {
      _providerRef.current = undefined;
      _chainIdRef.current = undefined;
      _abortControllerRef.current.abort();
      _abortControllerRef.current = null;
    }

    _providerRef.current = provider;
    _chainIdRef.current = chainId;

    _setInstance(undefined);
    _setError(undefined);
    _setStatus("idle");

    if (provider !== undefined) {
      _setProviderChanged((prev) => prev + 1);
    }
  }, [provider, chainId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    _setIsRunning(enabled);
  }, [enabled]);

  useEffect(() => {
    if (_isRunning === false) {
      if (_abortControllerRef.current) {
        _abortControllerRef.current.abort();
        _abortControllerRef.current = null;
      }
      _setInstance(undefined);
      _setError(undefined);
      _setStatus("idle");
      return;
    }

    if (_isRunning === true) {
      if (_providerRef.current === undefined) {
        _setInstance(undefined);
        _setError(undefined);
        _setStatus("idle");
        return;
      }

      if (!_abortControllerRef.current) {
        _abortControllerRef.current = new AbortController();
      }

      _assert(!_abortControllerRef.current.signal.aborted, "!controllerRef.current.signal.aborted");

      _setStatus("loading");
      _setError(undefined);

      const thisSignal = _abortControllerRef.current.signal;
      const thisProvider = _providerRef.current;
      const thisRpcUrlsByChainId = _mockChainsRef.current;

      const useExistingInstanceIfAny = () => {
        const globalInstance = (window as any).__cipher_fhe_instance__;
        const globalChainId = (window as any).__cipher_fhe_chain_id__;
        const expectedChainId = _chainIdRef.current;
        if (globalInstance) {
          if (
            typeof expectedChainId === "number" &&
            typeof globalChainId === "number" &&
            globalChainId !== expectedChainId
          ) {
            return false;
          }
          _setInstance(globalInstance);
          _setStatus("ready");
          _setError(undefined);
          return true;
        }
        return false;
      };

      if (useExistingInstanceIfAny()) {
        return;
      }

      createFhevmInstance({
        signal: thisSignal,
        provider: thisProvider,
        mockChains: thisRpcUrlsByChainId,
        onStatusChange: (s) => console.log(`[useFhevm] createFhevmInstance status changed: ${s}`)
      })
        .then((i) => {
          if (thisSignal.aborted) return;
          _assert(thisProvider === _providerRef.current, "thisProvider === _providerRef.current");
          _setInstance(i);
          (window as any).__cipher_fhe_instance__ = i;
          (window as any).__cipher_fhe_chain_id__ = _chainIdRef.current ?? null;
          _setError(undefined);
          _setStatus("ready");
        })
        .catch((e) => {
          if (thisSignal.aborted) return;
          _assert(thisProvider === _providerRef.current, "thisProvider === _providerRef.current");

          if (useExistingInstanceIfAny()) {
            return;
          }

          _setInstance(undefined);
          _setError(e);
          _setStatus("error");
        });
    }
  }, [_isRunning, _providerChanged]);

  return { instance, refresh, error, status };
}
