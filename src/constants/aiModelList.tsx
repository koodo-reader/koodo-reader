export interface AIProviderInfo {
  id: string;
  name: string;
  defaultEndpoint: string;
  modelsEndpoint: string;
}

export const aiProviderList: AIProviderInfo[] = [
  {
    id: "custom",
    name: "Custom model",
    defaultEndpoint: "",
    modelsEndpoint: "",
  },
  // ── Global Providers ──
  {
    id: "openai",
    name: "OpenAI",
    defaultEndpoint: "https://api.openai.com/v1",
    modelsEndpoint: "https://api.openai.com/v1/models",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultEndpoint: "https://api.anthropic.com/v1",
    modelsEndpoint: "https://api.anthropic.com/v1/models",
  },
  {
    id: "google",
    name: "Google Gemini",
    defaultEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    modelsEndpoint:
      "https://generativelanguage.googleapis.com/v1beta/openai/models",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultEndpoint: "https://api.deepseek.com/v1",
    modelsEndpoint: "https://api.deepseek.com/v1/models",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    defaultEndpoint: "https://api.mistral.ai/v1",
    modelsEndpoint: "https://api.mistral.ai/v1/models",
  },
  {
    id: "cohere",
    name: "Cohere",
    defaultEndpoint: "https://api.cohere.com/compatibility/v1",
    modelsEndpoint: "https://api.cohere.com/compatibility/v1/models",
  },
  {
    id: "groq",
    name: "Groq",
    defaultEndpoint: "https://api.groq.com/openai/v1",
    modelsEndpoint: "https://api.groq.com/openai/v1/models",
  },
  {
    id: "together",
    name: "Together AI",
    defaultEndpoint: "https://api.together.xyz/v1",
    modelsEndpoint: "https://api.together.xyz/v1/models",
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    defaultEndpoint: "https://api.fireworks.ai/inference/v1",
    modelsEndpoint: "https://api.fireworks.ai/inference/v1/models",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    defaultEndpoint: "https://api.perplexity.ai",
    modelsEndpoint: "https://api.perplexity.ai/models",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    defaultEndpoint: "https://openrouter.ai/api/v1",
    modelsEndpoint: "https://openrouter.ai/api/v1/models",
  },
  {
    id: "ai21",
    name: "AI21 Labs",
    defaultEndpoint: "https://api.ai21.com/studio/v1",
    modelsEndpoint: "https://api.ai21.com/studio/v1/models",
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    defaultEndpoint: "https://api.x.ai/v1",
    modelsEndpoint: "https://api.x.ai/v1/models",
  },
  {
    id: "sambanova",
    name: "SambaNova",
    defaultEndpoint: "https://api.sambanova.ai/v1",
    modelsEndpoint: "https://api.sambanova.ai/v1/models",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    defaultEndpoint: "https://api.cerebras.ai/v1",
    modelsEndpoint: "https://api.cerebras.ai/v1/models",
  },
  {
    id: "hyperbolic",
    name: "Hyperbolic",
    defaultEndpoint: "https://api.hyperbolic.xyz/v1",
    modelsEndpoint: "https://api.hyperbolic.xyz/v1/models",
  },
  {
    id: "novita",
    name: "Novita AI",
    defaultEndpoint: "https://api.novita.ai/v3/openai",
    modelsEndpoint: "https://api.novita.ai/v3/openai/models",
  },
  {
    id: "lepton",
    name: "Lepton AI",
    defaultEndpoint: "https://llm.lepton.run/api/v1",
    modelsEndpoint: "https://llm.lepton.run/api/v1/models",
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    defaultEndpoint: "https://api.deepinfra.com/v1/openai",
    modelsEndpoint: "https://api.deepinfra.com/v1/openai/models",
  },
  {
    id: "replicate",
    name: "Replicate",
    defaultEndpoint: "https://openai-proxy.replicate.com/v1",
    modelsEndpoint: "https://openai-proxy.replicate.com/v1/models",
  },
  // ── China Providers ──
  {
    id: "zhipu",
    name: "Zhipu AI (智谱)",
    defaultEndpoint: "https://open.bigmodel.cn/api/paas/v4",
    modelsEndpoint: "https://open.bigmodel.cn/api/paas/v4/models",
  },
  {
    id: "qwen",
    name: "Alibaba Qwen (通义千问)",
    defaultEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    modelsEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
  },
  {
    id: "moonshot",
    name: "Moonshot (月之暗面)",
    defaultEndpoint: "https://api.moonshot.cn/v1",
    modelsEndpoint: "https://api.moonshot.cn/v1/models",
  },
  {
    id: "baidu",
    name: "Baidu ERNIE (文心一言)",
    defaultEndpoint: "https://qianfan.baidubce.com/v2",
    modelsEndpoint: "https://qianfan.baidubce.com/v2/models",
  },
  {
    id: "doubao",
    name: "Volcengine Doubao (豆包)",
    defaultEndpoint: "https://ark.cn-beijing.volces.com/api/v3",
    modelsEndpoint: "https://ark.cn-beijing.volces.com/api/v3/models",
  },
  {
    id: "spark",
    name: "iFlytek Spark (讯飞星火)",
    defaultEndpoint: "https://spark-api-open.xf-yun.com/v1",
    modelsEndpoint: "https://spark-api-open.xf-yun.com/v1/models",
  },
  {
    id: "hunyuan",
    name: "Tencent Hunyuan (腾讯混元)",
    defaultEndpoint: "https://api.hunyuan.cloud.tencent.com/v1",
    modelsEndpoint: "https://api.hunyuan.cloud.tencent.com/v1/models",
  },
  {
    id: "minimax",
    name: "MiniMax",
    defaultEndpoint: "https://api.minimax.chat/v1",
    modelsEndpoint: "https://api.minimax.chat/v1/models",
  },
  {
    id: "baichuan",
    name: "Baichuan (百川)",
    defaultEndpoint: "https://api.baichuan-ai.com/v1",
    modelsEndpoint: "https://api.baichuan-ai.com/v1/models",
  },
  {
    id: "stepfun",
    name: "StepFun (阶跃星辰)",
    defaultEndpoint: "https://api.stepfun.com/v1",
    modelsEndpoint: "https://api.stepfun.com/v1/models",
  },
  {
    id: "lingyi",
    name: "Lingyiwanwu (零一万物)",
    defaultEndpoint: "https://api.lingyiwanwu.com/v1",
    modelsEndpoint: "https://api.lingyiwanwu.com/v1/models",
  },
  {
    id: "siliconflow",
    name: "SiliconFlow (硅基流动)",
    defaultEndpoint: "https://api.siliconflow.cn/v1",
    modelsEndpoint: "https://api.siliconflow.cn/v1/models",
  },
  {
    id: "infini",
    name: "Infini AI (无问芯穹)",
    defaultEndpoint: "https://cloud.infini-ai.com/maas/v1",
    modelsEndpoint: "https://cloud.infini-ai.com/maas/v1/models",
  },
  // ── Self-hosted / Compatible ──
  {
    id: "ollama",
    name: "Ollama (Local)",
    defaultEndpoint: "http://localhost:11434/v1",
    modelsEndpoint: "http://localhost:11434/v1/models",
  },
  {
    id: "lmstudio",
    name: "LM Studio (Local)",
    defaultEndpoint: "http://localhost:1234/v1",
    modelsEndpoint: "http://localhost:1234/v1/models",
  },
  {
    id: "vllm",
    name: "vLLM (Local)",
    defaultEndpoint: "http://localhost:8000/v1",
    modelsEndpoint: "http://localhost:8000/v1/models",
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    defaultEndpoint: "",
    modelsEndpoint: "",
  },
  {
    id: "aws_bedrock",
    name: "AWS Bedrock",
    defaultEndpoint: "",
    modelsEndpoint: "",
  },
];
