/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_RPC_URL: string;
  readonly VITE_PUBLIC_REGISTRY_ADDRESS: string;
  readonly VITE_PUBLIC_RELAYER_URL: string;
  readonly VITE_PUBLIC_WALLETCONNECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
