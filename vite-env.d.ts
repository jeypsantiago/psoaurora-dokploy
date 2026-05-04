/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __AURORA_RUNTIME_CONFIG__?: {
    VITE_POCKETBASE_URL?: string;
    POCKETBASE_URL?: string;
  };
}
