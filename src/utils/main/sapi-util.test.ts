import { describe, expect, it } from "vitest";
import sapiUtilModule from "./sapi-util";

// 主进程的 SAPI 工具是 CommonJS JavaScript
const {
  toSapiRate,
  mapInstalledVoices,
  getPowerShellPath,
  getWorkerScriptPath,
  withBom,
}: any = (sapiUtilModule as any)._internal;

describe("toSapiRate", () => {
  it.each([
    [1, 0],
    [0.5, -6],
    [2, 6],
    [1.25, 2],
    [1.5, 4],
    [0.1, -10],
    [10, 10],
    [0, 0],
    [-1, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])("maps speed %s to SAPI rate %s", (speed, expected) => {
    expect(toSapiRate(speed)).toBe(expected);
  });
});

describe("mapInstalledVoices", () => {
  const rawVoices = [
    {
      name: "Microsoft David Desktop",
      id: "TTS_MS_EN-US_DAVID_11.0",
      culture: "en-US",
      gender: "Male",
      enabled: true,
    },
    {
      name: "Microsoft Xiaoxiao (Natural)",
      displayName: "Microsoft Xiaoxiao (Natural) - Chinese (Simplified, China)",
      id: "Local-zh-CN-XiaoxiaoNeural",
      culture: "zh-CN",
      gender: "Female",
      enabled: true,
    },
    {
      name: "Microsoft Yunxi (Natural)",
      id: "MicrosoftWindows.Voice.zh-CN.Yunxi.1",
      culture: "zh-CN",
      gender: "Male",
      enabled: true,
    },
    {
      name: "Disabled Voice",
      id: "TTS_DISABLED",
      culture: "en-US",
      gender: "Neutral",
      enabled: false,
    },
    {
      name: "No Culture Voice",
      id: "TTS_NO_CULTURE",
      culture: "",
      gender: "Male",
      enabled: true,
    },
    {
      name: "Microsoft Xiaoxiao (Natural)",
      id: "TTS_DUPLICATE",
      culture: "zh-CN",
      gender: "Female",
      enabled: true,
    },
  ];

  it("filters invalid voices, dedupes by name and puts adapter voices first", () => {
    const voices = mapInstalledVoices(rawVoices, "test-plugin");

    expect(voices.map((voice: any) => voice.name)).toEqual([
      "Microsoft Xiaoxiao (Natural)",
      "Microsoft Yunxi (Natural)",
      "Microsoft David Desktop",
    ]);
    expect(voices[0]).toMatchObject({
      name: "Microsoft Xiaoxiao (Natural)",
      displayName: "Microsoft Xiaoxiao (Natural) - Chinese (Simplified, China)",
      locale: "zh-CN",
      gender: "female",
      plugin: "test-plugin",
      config: { voiceName: "Microsoft Xiaoxiao (Natural)" },
    });
    expect(voices[2]).toMatchObject({
      gender: "male",
      displayName: "Microsoft David Desktop - en-US",
    });
  });

  it("maps unknown genders to notset and tolerates an empty list", () => {
    const voices = mapInstalledVoices(
      [
        {
          name: "Neutral Voice",
          id: "TTS_NEUTRAL",
          culture: "en-US",
          gender: "Neutral",
          enabled: true,
        },
      ],
      "test-plugin"
    );
    expect(voices[0].gender).toBe("notset");
    expect(mapInstalledVoices([], "test-plugin")).toEqual([]);
    expect(mapInstalledVoices(undefined, "test-plugin")).toEqual([]);
  });
});

describe("getPowerShellPath", () => {
  const systemRoot = "C:\\Windows";
  const system32 = `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
  const sysnative = `${systemRoot}\\Sysnative\\WindowsPowerShell\\v1.0\\powershell.exe`;

  it("uses the 64-bit System32 PowerShell on 64-bit Windows", () => {
    expect(getPowerShellPath("x64", systemRoot, () => true)).toBe(system32);
    expect(getPowerShellPath("arm64", systemRoot, () => true)).toBe(system32);
  });

  it("uses Sysnative from 32-bit builds so the 64-bit SAPI view is visible", () => {
    expect(getPowerShellPath("ia32", systemRoot, () => true)).toBe(sysnative);
    expect(
      getPowerShellPath("ia32", systemRoot, (candidate: string) =>
        [system32, sysnative].includes(candidate)
      )
    ).toBe(sysnative);
  });

  it("falls back to System32 and PATH", () => {
    expect(getPowerShellPath("ia32", systemRoot, () => false)).toBe(
      "powershell.exe"
    );
    expect(getPowerShellPath("x64", "", () => true)).toBe("powershell.exe");
  });
});

describe("worker script helpers", () => {
  it("builds a stable worker script path", () => {
    expect(getWorkerScriptPath("C:\\Users\\test\\AppData")).toBe(
      "C:\\Users\\test\\AppData\\natural-voice-sapi-adapter\\worker.ps1"
    );
  });

  it("prefixes the script with a UTF-8 BOM", () => {
    expect(withBom("Write-Output 1").charCodeAt(0)).toBe(0xfeff);
  });
});
