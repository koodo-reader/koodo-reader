import React from "react";
import { SettingInfoProps, SettingInfoState, AIModelConfig } from "./interface";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import DatabaseService from "../../../utils/storage/databaseService";
import { handleContextMenu, vexTextareaAsync } from "../../../utils/common";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";

class AISetting extends React.Component<SettingInfoProps, SettingInfoState> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isAddNew: false,
      isEditing: false,
      editingKey: "",
      selectedProvider: "",
      selectedModel: "",
      endpoint: "",
      modelName: "",
      modelId: "",
      apiKey: "",
      isTesting: false,
      testResult: "",
      fetchedModels: [],
      isFetchingModels: false,
      aiTranslateModel: ConfigService.getReaderConfig("aiTranslateModel") || "",
      aiDictModel: ConfigService.getReaderConfig("aiDictModel") || "",
      aiAssistanceModel:
        ConfigService.getReaderConfig("aiAssistanceModel") || "",
      aiTranslatePrompt:
        ConfigService.getReaderConfig("aiTranslatePrompt") || "",
      aiDictPrompt: ConfigService.getReaderConfig("aiDictPrompt") || "",
      aiAssistancePrompt:
        ConfigService.getReaderConfig("aiAssistancePrompt") || "",
    };
  }

  getAIPlugins = () => {
    return (this.props.plugins || []).filter((item) => item.type === "ai");
  };

  parseConfig = (plugin: any): AIModelConfig | null => {
    try {
      if (typeof plugin.config === "string") {
        return JSON.parse(plugin.config);
      }
      return plugin.config as AIModelConfig;
    } catch {
      return null;
    }
  };

  resetForm = () => {
    this.setState({
      isAddNew: false,
      isEditing: false,
      editingKey: "",
      selectedProvider: "",
      selectedModel: "",
      endpoint: "",
      modelName: "",
      modelId: "",
      apiKey: "",
      isTesting: false,
      testResult: "",
      fetchedModels: [],
    });
  };

  handleProviderChange = (providerId: string) => {
    const provider = KookitConfig.AiProviderList.find(
      (p) => p.id === providerId
    );
    this.setState({
      selectedProvider: providerId,
      selectedModel: "",
      endpoint: provider ? provider.defaultEndpoint : "",
      modelName: "",
      modelId: "",
      fetchedModels: [],
      testResult: "",
    });
  };

  handleModelSelect = (modelId: string) => {
    if (!modelId) {
      this.setState({ selectedModel: "", modelName: "", modelId: "" });
      return;
    }
    const found = this.state.fetchedModels.find((m) => m.id === modelId);
    this.setState({
      selectedModel: modelId,
      modelName: found ? found.name : modelId,
      modelId: modelId,
      testResult: "",
    });
  };

  handleFetchModels = async () => {
    const provider = KookitConfig.AiProviderList.find(
      (p) => p.id === this.state.selectedProvider
    );
    if (!provider || !provider.modelsEndpoint) {
      toast.error(
        this.props.t(
          "This provider does not support fetching model list, please fill in manually"
        )
      );
      return;
    }
    if (
      !this.state.apiKey &&
      this.state.selectedProvider !== "ollama" &&
      this.state.selectedProvider !== "lmstudio" &&
      this.state.selectedProvider !== "vllm"
    ) {
      toast.error(this.props.t("Please enter API Key first"));
      return;
    }
    this.setState({ isFetchingModels: true });
    try {
      const headers: Record<string, string> = {};
      if (this.state.apiKey) {
        headers["Authorization"] = `Bearer ${this.state.apiKey}`;
      }
      const response = await fetch(provider.modelsEndpoint, { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const rawModels = data.data || data.models || data.results || data || [];
      if (rawModels.length === 0) {
        toast.error(this.props.t("No models found"));
        toast.error(
          this.props.t(
            "You can add models manually by selecting the custom model"
          )
        );
        return;
      }
      const models = rawModels.map((m: any) => ({
        id: m.id || m.model || m.name,
        name: m.id || m.display_name || m.name || m.model,
      }));
      models.sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name)
      );
      this.setState({ fetchedModels: models });
      if (models.length > 0) {
        toast.success(this.props.t("Fetched models") + ": " + models.length);
      } else {
        toast.error(this.props.t("No models found"));
      }
    } catch (e: any) {
      toast.error(
        this.props.t("Failed to fetch model list") + ": " + e.message
      );
    } finally {
      this.setState({ isFetchingModels: false });
    }
  };

  handleTest = async () => {
    const { endpoint, modelId, apiKey } = this.state;
    if (!endpoint || !modelId || !apiKey) {
      toast.error(this.props.t("Please fill in all required fields"));
      return;
    }
    this.setState({ isTesting: true, testResult: "" });
    try {
      const chatEndpoint = endpoint.endsWith("/")
        ? endpoint + "chat/completions"
        : endpoint + "/chat/completions";
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "user", content: "Hi, just testing. Reply with OK." },
          ],
          max_tokens: 10,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText.substring(0, 200)}`
        );
      }
      const data = await response.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        JSON.stringify(data).substring(0, 100);
      this.setState({ testResult: "success" });
      toast.success(this.props.t("Test successful") + ": " + reply);
    } catch (e: any) {
      this.setState({ testResult: "fail" });
      toast.error(this.props.t("Test failed") + ": " + e.message);
    } finally {
      this.setState({ isTesting: false });
    }
  };

  handleSave = async () => {
    const {
      endpoint,
      modelName,
      modelId,
      apiKey,
      selectedProvider,
      isEditing,
      editingKey,
    } = this.state;
    if (!endpoint || !modelName || !modelId || !apiKey) {
      toast.error(this.props.t("Please fill in all required fields"));
      return;
    }
    const provider = KookitConfig.AiProviderList.find(
      (p) => p.id === selectedProvider
    );
    const config: AIModelConfig = {
      endpoint,
      modelName,
      modelId,
      apiKey,
      providerId: selectedProvider || "custom",
      providerName: provider ? provider.name : "Custom",
    };
    const pluginRecord = {
      key: isEditing ? editingKey : Date.now().toString(),
      type: "ai",
      displayName: modelName,
      icon: "ai-assist",
      version: "1.0.0",
      autoValue: "",
      config: config,
      langList: [],
      voiceList: [],
      scriptSHA256: "",
      script: "",
    };

    try {
      if (isEditing) {
        await DatabaseService.updateRecord(pluginRecord, "plugins");
        toast.success(this.props.t("Update successful"));
      } else {
        await DatabaseService.saveRecord(pluginRecord, "plugins");
        toast.success(this.props.t("Addition successful"));
      }
      this.props.handleFetchPlugins();
      this.resetForm();
    } catch (e: any) {
      toast.error(this.props.t("Operation failed") + ": " + e.message);
    }
  };

  handleDelete = async (key: string) => {
    try {
      await DatabaseService.deleteRecord(key, "plugins");
      this.props.handleFetchPlugins();
      // 如果被删除的模型正被某个功能使用，则清空对应配置
      if (this.state.aiTranslateModel === key) {
        this.setState({ aiTranslateModel: "" });
        ConfigService.setReaderConfig("aiTranslateModel", "");
      }
      if (this.state.aiDictModel === key) {
        this.setState({ aiDictModel: "" });
        ConfigService.setReaderConfig("aiDictModel", "");
      }
      if (this.state.aiAssistanceModel === key) {
        this.setState({ aiAssistanceModel: "" });
        ConfigService.setReaderConfig("aiAssistanceModel", "");
      }
      toast.success(this.props.t("Deletion successful"));
    } catch (e: any) {
      toast.error(this.props.t("Deletion failed") + ": " + e.message);
    }
    this.props.handleFetchPlugins();
  };

  handleEdit = (plugin: any) => {
    const config = this.parseConfig(plugin);
    if (!config) {
      toast.error(this.props.t("Failed to parse model configuration"));
      return;
    }
    this.setState({
      isAddNew: true,
      isEditing: true,
      editingKey: plugin.key,
      selectedProvider: config.providerId || "custom",
      selectedModel: config.modelId || "",
      endpoint: config.endpoint || "",
      modelName: config.modelName || plugin.displayName || "",
      modelId: config.modelId || "",
      apiKey: config.apiKey || "",
      testResult: "",
      fetchedModels: [],
    });
    const infoEl = document.querySelector(".setting-dialog-info");
    if (infoEl) infoEl.scrollTop = 0;
  };

  handleEditPrompt = async (
    type: "aiTranslate" | "aiDict" | "aiAssistance"
  ) => {
    const configKey = type + "Prompt";
    const currentValue =
      (this.state as any)[configKey] || KookitConfig.DefaultPrompts[type];
    const result = await vexTextareaAsync(
      this.props.t("Edit prompt"),
      currentValue
    );
    if (result === false) return;
    (this.setState as any)({ [configKey]: result });
    ConfigService.setReaderConfig(configKey, result);
    toast.success(this.props.t("Change successful"));
  };

  renderAddForm = () => {
    const isCustom =
      !this.state.selectedProvider || this.state.selectedProvider === "custom";
    const provider = KookitConfig.AiProviderList.find(
      (p) => p.id === this.state.selectedProvider
    );
    const hasModelsEndpoint = provider && provider.modelsEndpoint;
    const hasFetchedModels = this.state.fetchedModels.length > 0;

    return (
      <div
        className="voice-add-new-container"
        style={{
          marginLeft: "25px",
          width: "calc(100% - 50px)",
          fontWeight: 500,
        }}
      >
        {/* Step 1: Provider selection */}
        <div className="ai-setting-form-row">
          <label className="ai-setting-label">
            <Trans>Provider</Trans>
          </label>
          <select
            className="lang-setting-dropdown"
            style={{ width: "100px" }}
            value={this.state.selectedProvider}
            onChange={(e) => this.handleProviderChange(e.target.value)}
          >
            <option value="" className="lang-setting-option">
              {this.props.t("Please select")}
            </option>
            {KookitConfig.AiProviderList.map((p) => (
              <option key={p.id} value={p.id} className="lang-setting-option">
                {this.props.t(p.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: API Key (shown after provider is selected, before fetching models) */}
        {(this.state.selectedProvider || isCustom) &&
          this.state.selectedProvider !== "" && (
            <div className="ai-setting-form-row">
              <label className="ai-setting-label">API Key</label>
              <input
                type="password"
                className="token-dialog-username-box"
                placeholder={this.props.t("Enter your API Key")}
                value={this.state.apiKey}
                id="ai-api-key-box"
                onContextMenu={() => {
                  handleContextMenu("ai-api-key-box", true);
                }}
                onChange={(e) =>
                  this.setState({ apiKey: e.target.value.trim() })
                }
              />
            </div>
          )}

        {/* Step 3: Fetch models button (for non-custom providers with modelsEndpoint) */}
        {!isCustom && hasModelsEndpoint && (
          <div className="ai-setting-form-row">
            <span
              className="change-location-button"
              style={{
                display: "inline-flex",
                marginTop: "6px",
              }}
              onClick={this.handleFetchModels}
            >
              {this.state.isFetchingModels ? (
                <Trans>Loading...</Trans>
              ) : (
                <Trans>Fetch models</Trans>
              )}
            </span>
          </div>
        )}

        {/* Step 4: Model selection dropdown (after models fetched) */}
        {!isCustom && hasFetchedModels && (
          <div className="ai-setting-form-row">
            <label className="ai-setting-label">
              <Trans>Select model</Trans>
            </label>
            <select
              className="lang-setting-dropdown"
              style={{ width: "100px" }}
              value={this.state.selectedModel}
              onChange={(e) => this.handleModelSelect(e.target.value)}
            >
              <option value="" className="lang-setting-option">
                {this.props.t("Please select a model")}
              </option>
              {this.state.fetchedModels.map((m) => (
                <option key={m.id} value={m.id} className="lang-setting-option">
                  {m.name || m.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 5: Endpoint, Model name, Model ID (always shown for custom, shown after selection for others) */}
        {(isCustom || this.state.selectedModel || this.state.isEditing) && (
          <>
            {/* Endpoint */}
            <div className="ai-setting-form-row">
              <label className="ai-setting-label">Endpoint</label>
              <input
                type="text"
                className="token-dialog-username-box"
                placeholder="https://api.example.com/v1"
                value={this.state.endpoint}
                id="ai-endpoint-box"
                onContextMenu={() => {
                  handleContextMenu("ai-endpoint-box", true);
                }}
                onChange={(e) =>
                  this.setState({ endpoint: e.target.value.trim() })
                }
              />
            </div>

            {/* Model name */}
            <div className="ai-setting-form-row">
              <label className="ai-setting-label">
                <Trans>Model name</Trans>
              </label>
              <input
                type="text"
                className="token-dialog-username-box"
                placeholder={this.props.t("Display name of the model")}
                value={this.state.modelName}
                id="ai-model-name-box"
                onContextMenu={() => {
                  handleContextMenu("ai-model-name-box", true);
                }}
                onChange={(e) => this.setState({ modelName: e.target.value })}
              />
            </div>

            {/* Model ID */}
            <div className="ai-setting-form-row">
              <label className="ai-setting-label">
                <Trans>Model ID</Trans>
              </label>
              <input
                type="text"
                className="token-dialog-username-box"
                placeholder={this.props.t(
                  "e.g. gpt-4o, claude-sonnet-4-20250514"
                )}
                value={this.state.modelId}
                id="ai-model-id-box"
                onContextMenu={() => {
                  handleContextMenu("ai-model-id-box", true);
                }}
                onChange={(e) =>
                  this.setState({ modelId: e.target.value.trim() })
                }
              />
            </div>
          </>
        )}

        {/* Buttons: Add/Save, Cancel, Test */}
        <div className="token-dialog-button-container">
          <div className="voice-add-confirm" onClick={this.handleSave}>
            <Trans>{this.state.isEditing ? "Save" : "Add"}</Trans>
          </div>
          <div className="voice-add-button-container">
            <div className="voice-add-cancel" onClick={this.resetForm}>
              <Trans>Cancel</Trans>
            </div>
            <div
              className="voice-add-confirm"
              style={{ marginRight: "10px" }}
              onClick={this.handleTest}
            >
              {this.state.isTesting ? (
                <Trans>Testing...</Trans>
              ) : (
                <Trans>Test</Trans>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const aiPlugins = this.getAIPlugins();

    return (
      <>
        {this.state.isAddNew && this.renderAddForm()}

        <div
          style={{
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "20px",
            marginLeft: "20px",
            marginTop: "20px",
          }}
        >
          <Trans>Added AI models</Trans>
        </div>

        {aiPlugins.length === 0 && (
          <div
            style={{
              textAlign: "center",
              opacity: 0.5,
              padding: "30px 0",
              fontSize: "14px",
            }}
          >
            <Trans>No AI models added yet</Trans>
          </div>
        )}

        {aiPlugins.map((item) => {
          const config = this.parseConfig(item);
          return (
            <div
              className="setting-dialog-new-title"
              key={item.key}
              style={{ marginLeft: "15px" }}
            >
              <span>
                <span className="icon-ai-assist setting-plugin-icon"></span>
                <span className="setting-plugin-name">
                  {this.props.t(item.displayName)}
                </span>
                {config && (
                  <span
                    style={{
                      // fontSize: "12px",
                      opacity: 0.6,
                      marginLeft: "8px",
                    }}
                  >
                    ({config.providerName || config.providerId})
                  </span>
                )}
              </span>

              <span
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span
                  className="change-location-button"
                  onClick={() => this.handleEdit(item)}
                >
                  <Trans>Edit</Trans>
                </span>
                <span
                  className="change-location-button"
                  onClick={() => this.handleDelete(item.key)}
                >
                  <Trans>Delete</Trans>
                </span>
              </span>
            </div>
          );
        })}

        <div
          style={{
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "20px",
            marginLeft: "20px",
            marginTop: "20px",
          }}
        >
          <Trans>Model assignment</Trans>
        </div>

        <div className="setting-dialog-new-title">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trans>AI translation model</Trans>
            <span
              className="change-location-button"
              style={{ fontSize: "12px" }}
              onClick={() => this.handleEditPrompt("aiTranslate")}
            >
              <Trans>Edit prompt</Trans>
            </span>
          </span>
          <select
            className="lang-setting-dropdown"
            value={this.state.aiTranslateModel}
            onChange={(e) => {
              const val = e.target.value;
              this.setState({ aiTranslateModel: val });
              ConfigService.setReaderConfig("aiTranslateModel", val);
              toast.success(this.props.t("Change successful"));
              this.props.handleFetchPlugins();
            }}
          >
            <option value="" className="lang-setting-option">
              {this.props.t("Please select")}
            </option>
            {aiPlugins.map((item) => (
              <option
                key={item.key}
                value={item.key}
                className="lang-setting-option"
              >
                {item.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-dialog-new-title">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trans>AI dictionary model</Trans>
            <span
              className="change-location-button"
              style={{ fontSize: "12px" }}
              onClick={() => this.handleEditPrompt("aiDict")}
            >
              <Trans>Edit prompt</Trans>
            </span>
          </span>
          <select
            className="lang-setting-dropdown"
            value={this.state.aiDictModel}
            onChange={(e) => {
              const val = e.target.value;
              this.setState({ aiDictModel: val });
              ConfigService.setReaderConfig("aiDictModel", val);
              toast.success(this.props.t("Change successful"));
              this.props.handleFetchPlugins();
            }}
          >
            <option value="" className="lang-setting-option">
              {this.props.t("Please select")}
            </option>
            {aiPlugins.map((item) => (
              <option
                key={item.key}
                value={item.key}
                className="lang-setting-option"
              >
                {item.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-dialog-new-title">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trans>AI assistance model</Trans>
            <span
              className="change-location-button"
              style={{ fontSize: "12px" }}
              onClick={() => this.handleEditPrompt("aiAssistance")}
            >
              <Trans>Edit prompt</Trans>
            </span>
          </span>
          <select
            className="lang-setting-dropdown"
            value={this.state.aiAssistanceModel}
            onChange={(e) => {
              const val = e.target.value;
              this.setState({ aiAssistanceModel: val });
              ConfigService.setReaderConfig("aiAssistanceModel", val);
              toast.success(this.props.t("Change successful"));
              this.props.handleFetchPlugins();
            }}
          >
            <option value="" className="lang-setting-option">
              {this.props.t("Please select")}
            </option>
            {aiPlugins.map((item) => (
              <option
                key={item.key}
                value={item.key}
                className="lang-setting-option"
              >
                {item.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-dialog-new-plugin">
          <span
            style={{ fontWeight: "bold" }}
            onClick={() => {
              const infoEl = document.querySelector(".setting-dialog-info");
              this.setState(
                {
                  isAddNew: true,
                  isEditing: false,
                  editingKey: "",
                  selectedProvider: "",
                  selectedModel: "",
                  endpoint: "",
                  modelName: "",
                  modelId: "",
                  apiKey: "",
                  testResult: "",
                  fetchedModels: [],
                },
                () => {
                  if (infoEl) infoEl.scrollTop = 0;
                }
              );
            }}
          >
            <Trans>Add new model</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default AISetting;
