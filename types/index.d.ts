declare module "rc-color-picker" {}
declare module "react-tooltip" {
  export const Tooltip: any;
  export default Tooltip;
}
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

declare module "@mozilla/readability" {
  export class Readability {
    constructor(document: Document);
    parse(): any;
  }
}
