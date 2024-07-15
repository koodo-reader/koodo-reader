class Plugin {
  identifier: string;
  type: string;
  displayName: string;
  icon: string;
  version: string;
  config: object;
  langList: object | any[];
  voiceList: object | any[];
  scriptSHA256: string;
  script: string;
  constructor(
    identifier: string,
    type: string,
    displayName: string,
    icon: string,
    version: string,
    config: object,
    langList: any,
    voiceList: any,
    scriptSHA256: string,
    script: string
  ) {
    this.identifier = identifier;
    this.type = type;
    this.displayName = displayName;
    this.icon = icon;
    this.version = version;
    this.config = config;
    this.langList = langList;
    this.voiceList = voiceList;
    this.script = script;
    this.scriptSHA256 = scriptSHA256;
  }
}

export default Plugin;
