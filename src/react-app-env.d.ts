interface ElectronFileAPI {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  writeFileSync(path: string, data: string | ArrayBuffer | ArrayBufferView, options?: string | object): void;
  appendFileSync(path: string, data: string | ArrayBuffer | ArrayBufferView, options?: string | object): void;
  readFileSync(path: string, options: string): string;
  readFileSync(path: string, options?: object): Uint8Array;
  readdirSync(path: string, options: { withFileTypes: true }): Array<{ name: string; isFile: boolean; isDirectory: boolean }>;
  readdirSync(path: string, options?: { withFileTypes?: false }): string[];
  statSync(path: string): { size: number; mtimeMs: number; isFile: boolean; isDirectory: boolean };
  unlinkSync(path: string): void;
  copyFileSync(source: string, destination: string): void;
  renameSync(source: string, destination: string): void;
  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
  emptyDirSync(path: string): void;
  copy(source: string, destination: string): Promise<void>;
  rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  readFile(path: string, callback: (error: Error | null, data: Uint8Array) => void): void;
  readFile(path: string, options: string | object, callback: (error: Error | null, data: Uint8Array | string) => void): void;
  readFile(path: string, options?: string | object): Promise<Uint8Array | string>;
  writeFile(path: string, data: string | ArrayBuffer | ArrayBufferView, callback: (error: Error | null) => void): void;
  writeFile(path: string, data: string | ArrayBuffer | ArrayBufferView, options: string | object, callback: (error: Error | null) => void): void;
  writeFile(path: string, data: string | ArrayBuffer | ArrayBufferView, options?: string | object): Promise<void>;
  promises: {
    readFile(path: string, options: string): Promise<string>;
    readFile(path: string, options?: object): Promise<Uint8Array>;
    readdir(path: string, options?: object): Promise<string[]>;
  };
}

interface ElectronAPI {
  invoke<T = any>(channel: string, ...args: unknown[]): Promise<T>;
  send(channel: string, ...args: unknown[]): void;
  sendSync<T = any>(channel: string, ...args: unknown[]): T;
  on(channel: string, listener: (payload: any) => void): () => void;
  once(channel: string, listener: (payload: any) => void): () => void;
  removeListener(channel: string, listener: (payload: any) => void): void;
  fs: ElectronFileAPI;
  path: {
    join(...parts: string[]): string;
    dirname(path: string): string;
    basename(path: string, suffix?: string): string;
    extname(path: string): string;
    resolve(...parts: string[]): string;
    posix: { join(...parts: string[]): string };
  };
  os: { platform(): string; homedir(): string };
  runtime: { platform: string; windowsStore: boolean };
  crypto: { md5(data: ArrayBuffer | ArrayBufferView): string; partialMd5(path: string): Promise<string>; fileMd5(path: string): Promise<string> };
  shell: { openExternal(url: string): Promise<void> };
  clipboard: { readText(): string };
}

interface VexDialogData {
  [key: string]: string;
}

interface VexDialogButton {
  text: string;
  type?: string;
  className?: string;
  click?: () => void;
}

interface VexAPI {
  dialog: {
    buttons: {
      YES: VexDialogButton;
      NO: VexDialogButton;
    };
    open(options: {
      message?: string;
      input?: string;
      buttons?: VexDialogButton[];
      callback: (data: VexDialogData | false) => void;
    }): void;
  };
}

interface Window {
  electronAPI: ElectronAPI;
  vex: VexAPI;
  learnMoreUrl?: string;
  translate?: import("./utils/plugins/types").TranslatePlugin;
  getDictText?: import("./utils/plugins/types").DictionaryPlugin;
}


declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PUBLIC_URL: string;
  }
}

declare module "*.bmp" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  import * as React from "react";

  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;

  const src: string;
  export default src;
}

// Side-effect imports (import "./foo.css") — required when noUncheckedSideEffectImports is on (TS 6+)
declare module "*.css";
declare module "*.scss";
declare module "*.sass";

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.module.sass" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "@mozilla/readability" {
  export class Readability {
    constructor(document: Document);
    parse(): any;
  }
}
