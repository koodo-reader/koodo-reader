import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { handleContextMenu, vexTextareaAsync } from "../../../utils/common";
import { aiRequest } from "../../../utils/request/common";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import { useAppStore } from "../../../store/useAppStore";

export interface AIModelConfig {
  endpoint: string;
  modelName: string;
  modelId: string;
  apiKey: string;
  providerId: string;
  providerName: string;
}

export interface SettingInfoState {
  isAddNew: boolean;
  isEditing: boolean;
  editingKey: string;
  selectedProvider: string;
  selectedModel: string;
  endpoint: string;
  modelName: string;
  modelId: string;
  apiKey: string;
  isTesting: boolean;
  testResult: string;
  fetchedModels: { id: string; name: string }[];
  isFetchingModels: boolean;
  aiTranslateModel: string;
  aiDictModel: string;
  aiAssistanceModel: string;
  aiTranslatePrompt: string;
  aiDictPrompt: string;
  aiAssistancePrompt: string;
}

const AISetting = () => {
  const handleFetchPlugins = useAppStore((s) => s.handleFetchPlugins);
  const { t } = useTranslation();
  const [state, setState] = useState<SettingInfoState>(() => ({
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
  }));
  const stateRef = useLatest(state);

  const updateState = (patch: Partial<SettingInfoState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState((prev) => ({ ...prev, ...patch }));
  };

  const scrollSettingInfoTop = () => {
    const infoEl = document.querySelector(".setting-dialog-info");
    if (infoEl) infoEl.scrollTop = 0;
  };

  const getAIModels = () => {
    // Load AI models from ConfigService
    let aiModels: { key: string; displayName: string; config: any }[] = [];
    const aiModelConfig =
      ConfigService.getAllObjectConfig("aiModelConfig") || {};
    Object.values(aiModelConfig).forEach((entry: any) => {
      if (entry && entry.key) {
        aiModels.push({
          key: entry.key,
          displayName: entry.displayName,
          config: entry.config,
        });
      }
    });
    return aiModels;
  };

  const parseConfig = (plugin: any): AIModelConfig | null => {
    try {
      if (typeof plugin.config === "string") {
        return JSON.parse(plugin.config);
      }
      return plugin.config as AIModelConfig;
    } catch {
      return null;
    }
  };

  const resetForm = () => {
    updateState({
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

  const handleProviderChange = (providerId: string) => {
    const provider = KookitConfig.AiProviderList.find(
      (p) => p.id === providerId
    );
    updateState({
      selectedProvider: providerId,
      selectedModel: "",
      endpoint: provider ? provider.defaultEndpoint : "",
      modelName: "",
      modelId: "",
      fetchedModels: [],
      testResult: "",
    });
  };

  const handleModelSelect = (modelId: string) => {
    if (!modelId) {
      updateState({ selectedModel: "", modelName: "", modelId: "" });
      return;
    }
    const found = stateRef.current.fetchedModels.find((m) => m.id === modelId);
    updateState({
      selectedModel: modelId,
      modelName: found ? found.name : modelId,
      modelId: modelId,
      testResult: "",
    });
  };

  const handleFetchModels = async () => {
    const provider = KookitConfig.AiProviderList.find(
      (p) => p.id === stateRef.current.selectedProvider
    );
    if (!provider || !provider.modelsEndpoint) {
      toast.error(
        t(
          "This provider does not support fetching model list, please fill in manually"
        )
      );
      return;
    }
    if (
      !stateRef.current.apiKey &&
      stateRef.current.selectedProvider !== "ollama" &&
      stateRef.current.selectedProvider !== "lmstudio" &&
      stateRef.current.selectedProvider !== "vllm"
    ) {
      toast.error(t("Please enter API Key first"));
      return;
    }
    updateState({ isFetchingModels: true });
    try {
      const headers: Record<string, string> = {};
      if (stateRef.current.apiKey) {
        headers["Authorization"] = `Bearer ${stateRef.current.apiKey}`;
      }
      const response = await aiRequest(provider.modelsEndpoint, "GET", headers);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = JSON.parse(response.body);
      const rawModels = data.data || data.models || data.results || data || [];
      if (rawModels.length === 0) {
        toast.error(t("No models found"));
        toast.error(
          t("You can add models manually by selecting the custom model")
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
      updateState({ fetchedModels: models });
      if (models.length > 0) {
        toast.success(t("Fetched models") + ": " + models.length);
      } else {
        toast.error(t("No models found"));
      }
    } catch (e: any) {
      toast.error(t("Failed to fetch model list") + ": " + e.message);
    } finally {
      updateState({ isFetchingModels: false });
    }
  };

  const handleTest = async () => {
    const { endpoint, modelId, apiKey } = stateRef.current;
    if (!endpoint || !modelId || !apiKey) {
      toast.error(t("Please fill in all required fields"));
      return;
    }
    updateState({ isTesting: true, testResult: "" });
    try {
      const chatEndpoint = endpoint.endsWith("/")
        ? endpoint + "chat/completions"
        : endpoint + "/chat/completions";
      const response = await aiRequest(
        chatEndpoint,
        "POST",
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        JSON.stringify({
          model: modelId,
          messages: [
            { role: "user", content: "Hi, just testing. Reply with OK." },
          ],
          max_tokens: 10,
        })
      );
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.body.substring(0, 200)}`
        );
      }
      const data = JSON.parse(response.body);
      const reply =
        data.choices?.[0]?.message?.content ||
        JSON.stringify(data).substring(0, 100);
      updateState({ testResult: "success" });
      toast.success(t("Test successful") + ": " + reply);
    } catch (e: any) {
      updateState({ testResult: "fail" });
      toast.error(t("Test failed") + ": " + e.message);
    } finally {
      updateState({ isTesting: false });
    }
  };

  const handleSave = async () => {
    const {
      endpoint,
      modelName,
      modelId,
      apiKey,
      selectedProvider,
      isEditing,
      editingKey,
    } = stateRef.current;
    if (!endpoint || !modelName || !modelId || !apiKey) {
      toast.error(t("Please fill in all required fields"));
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
    const key = isEditing ? editingKey : Date.now().toString();
    const modelEntry = {
      key,
      displayName: modelName,
      config,
    };

    try {
      ConfigService.setObjectConfig(key, modelEntry, "aiModelConfig");
      toast.success(
        t(isEditing ? "Update successful" : "Addition successful")
      );
      handleFetchPlugins();
      resetForm();
    } catch (e: any) {
      toast.error(t("Operation failed") + ": " + e.message);
    }
  };

  const handleDelete = (key: string) => {
    try {
      ConfigService.deleteObjectConfig(key, "aiModelConfig");
      // 如果被删除的模型正被某个功能使用，则清空对应配置
      if (stateRef.current.aiTranslateModel === key) {
        updateState({ aiTranslateModel: "" });
        ConfigService.setReaderConfig("aiTranslateModel", "");
      }
      if (stateRef.current.aiDictModel === key) {
        updateState({ aiDictModel: "" });
        ConfigService.setReaderConfig("aiDictModel", "");
      }
      if (stateRef.current.aiAssistanceModel === key) {
        updateState({ aiAssistanceModel: "" });
        ConfigService.setReaderConfig("aiAssistanceModel", "");
      }
      toast.success(t("Deletion successful"));
    } catch (e: any) {
      toast.error(t("Deletion failed") + ": " + e.message);
    }
    handleFetchPlugins();
  };

  const handleEdit = (plugin: any) => {
    const entry = ConfigService.getObjectConfig(
      plugin.key,
      "aiModelConfig",
      null
    );
    const config: AIModelConfig | null = entry
      ? entry.config
      : parseConfig(plugin);
    if (!config) {
      toast.error(t("Failed to parse model configuration"));
      return;
    }
    updateState({
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
    scrollSettingInfoTop();
  };

  const handleEditPrompt = async (
    type: "aiTranslate" | "aiDict" | "aiAssistance"
  ) => {
    const configKey = type + "Prompt";
    const currentValue =
      (stateRef.current as any)[configKey] || KookitConfig.DefaultPrompts[type];
    const result = await vexTextareaAsync(
      t("Edit prompt"),
      currentValue
    );
    if (result === false) return;
    updateState({ [configKey]: result } as any);
    ConfigService.setReaderConfig(configKey, result);
    toast.success(t("Change successful"));
  };

  const renderAddForm = () => {
    const isCustom =
      !state.selectedProvider || state.selectedProvider === "custom";
    const provider = KookitConfig.AiProviderList.find(
      (p) => p.id === state.selectedProvider
    );
    const hasModelsEndpoint = provider && provider.modelsEndpoint;
    const hasFetchedModels = state.fetchedModels.length > 0;

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
            value={state.selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="" className="lang-setting-option">
              {t("Please select")}
            </option>
            {KookitConfig.AiProviderList.map((p) => (
              <option key={p.id} value={p.id} className="lang-setting-option">
                {t(p.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: API Key (shown after provider is selected, before fetching models) */}
        {(state.selectedProvider || isCustom) &&
          state.selectedProvider !== "" && (
            <div className="ai-setting-form-row">
              <label className="ai-setting-label">API Key</label>
              <input
                type="password"
                className="token-dialog-username-box"
                placeholder={t("Enter your API Key")}
                value={state.apiKey}
                id="ai-api-key-box"
                onContextMenu={() => {
                  handleContextMenu("ai-api-key-box", true);
                }}
                onChange={(e) =>
                  updateState({ apiKey: e.target.value.trim() })
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
              onClick={handleFetchModels}
            >
              {state.isFetchingModels ? (
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
              value={state.selectedModel}
              onChange={(e) => handleModelSelect(e.target.value)}
            >
              <option value="" className="lang-setting-option">
                {t("Please select a model")}
              </option>
              {state.fetchedModels.map((m) => (
                <option key={m.id} value={m.id} className="lang-setting-option">
                  {m.name || m.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 5: Endpoint, Model name, Model ID (always shown for custom, shown after selection for others) */}
        {(isCustom || state.selectedModel || state.isEditing) && (
          <>
            {/* Endpoint */}
            <div className="ai-setting-form-row">
              <label className="ai-setting-label">Endpoint</label>
              <input
                type="text"
                className="token-dialog-username-box"
                placeholder="https://api.example.com/v1"
                value={state.endpoint}
                id="ai-endpoint-box"
                onContextMenu={() => {
                  handleContextMenu("ai-endpoint-box", true);
                }}
                onChange={(e) =>
                  updateState({ endpoint: e.target.value.trim() })
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
                placeholder={t("Display name of the model")}
                value={state.modelName}
                id="ai-model-name-box"
                onContextMenu={() => {
                  handleContextMenu("ai-model-name-box", true);
                }}
                onChange={(e) => updateState({ modelName: e.target.value })}
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
                placeholder={t("e.g. gpt-4o, claude-sonnet-4-20250514")}
                value={state.modelId}
                id="ai-model-id-box"
                onContextMenu={() => {
                  handleContextMenu("ai-model-id-box", true);
                }}
                onChange={(e) => updateState({ modelId: e.target.value.trim() })}
              />
            </div>
          </>
        )}

        {/* Buttons: Add/Save, Cancel, Test */}
        <div className="token-dialog-button-container">
          <div className="voice-add-confirm" onClick={handleSave}>
            <Trans>{state.isEditing ? "Save" : "Add"}</Trans>
          </div>
          <div className="voice-add-button-container">
            <div className="voice-add-cancel" onClick={resetForm}>
              <Trans>Cancel</Trans>
            </div>
            <div
              className="voice-add-confirm"
              style={{ marginRight: "10px" }}
              onClick={handleTest}
            >
              {state.isTesting ? <Trans>Testing...</Trans> : <Trans>Test</Trans>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const aiModels = getAIModels();

  return (
    <>
      {state.isAddNew && renderAddForm()}

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

      {aiModels.length === 0 && (
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

      {aiModels.map((item) => {
        const config = parseConfig(item);
        return (
          <div
            className="setting-dialog-new-title"
            key={item.key}
            style={{ marginLeft: "15px" }}
          >
            <span>
              <span className="icon-ai-assist setting-plugin-icon"></span>
              <span className="setting-plugin-name">
                {t(item.displayName)}
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
                onClick={() => handleEdit(item)}
              >
                <Trans>Edit</Trans>
              </span>
              <span
                className="change-location-button"
                onClick={() => handleDelete(item.key)}
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
            onClick={() => handleEditPrompt("aiTranslate")}
          >
            <Trans>Edit prompt</Trans>
          </span>
        </span>
        <select
          className="lang-setting-dropdown"
          value={state.aiTranslateModel}
          onChange={(e) => {
            const val = e.target.value;
            updateState({ aiTranslateModel: val });
            ConfigService.setReaderConfig("aiTranslateModel", val);
            toast.success(t("Change successful"));
            handleFetchPlugins();
          }}
        >
          <option value="" className="lang-setting-option">
            {t("Please select")}
          </option>
          {aiModels.map((item) => (
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
            onClick={() => handleEditPrompt("aiDict")}
          >
            <Trans>Edit prompt</Trans>
          </span>
        </span>
        <select
          className="lang-setting-dropdown"
          value={state.aiDictModel}
          onChange={(e) => {
            const val = e.target.value;
            updateState({ aiDictModel: val });
            ConfigService.setReaderConfig("aiDictModel", val);
            toast.success(t("Change successful"));
            handleFetchPlugins();
          }}
        >
          <option value="" className="lang-setting-option">
            {t("Please select")}
          </option>
          {aiModels.map((item) => (
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
            onClick={() => handleEditPrompt("aiAssistance")}
          >
            <Trans>Edit prompt</Trans>
          </span>
        </span>
        <select
          className="lang-setting-dropdown"
          value={state.aiAssistanceModel}
          onChange={(e) => {
            const val = e.target.value;
            updateState({ aiAssistanceModel: val });
            ConfigService.setReaderConfig("aiAssistanceModel", val);
            toast.success(t("Change successful"));
            handleFetchPlugins();
          }}
        >
          <option value="" className="lang-setting-option">
            {t("Please select")}
          </option>
          {aiModels.map((item) => (
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
            updateState({
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
            });
            scrollSettingInfoTop();
          }}
        >
          <Trans>Add new model</Trans>
        </span>
      </div>
    </>
  );
};

export default AISetting;
