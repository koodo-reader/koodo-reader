class Plugin {
  key: string;
  type: string;
  displayName: string;
  icon: string;
  version: string;
  autoValue: string;
  config: object;
  langList: object | any[];
  voiceList: object | any[];
  scriptSHA256: string;
  script: string;
  constructor(
    key: string,
    type: string,
    displayName: string,
    icon: string,
    version: string,
    autoValue: string,
    config: object,
    langList: any,
    voiceList: any,
    scriptSHA256: string,
    script: string
  ) {
    this.key = key;
    this.type = type;
    this.displayName = displayName;
    this.icon = icon;
    this.version = version;
    this.autoValue = autoValue;
    this.config = config;
    this.langList = langList;
    this.voiceList = voiceList;
    this.script = script;
    this.scriptSHA256 = scriptSHA256;
  }
}

export default Plugin;
