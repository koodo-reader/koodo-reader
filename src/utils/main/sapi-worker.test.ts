import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import { createContext, runInContext } from "node:vm";
import path from "node:path";

const source = readFileSync(
  path.resolve("src/utils/main/sapi-util.js"),
  "utf8"
);

const deferred = () => {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((done) => { resolve = done; });
  return { promise, resolve };
};

function loadWorker(readFile = vi.fn().mockResolvedValue("")) {
  const stdout = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });
  const stdin = Object.assign(new EventEmitter(), {
    write: vi.fn(), end: vi.fn(),
  });
  const child = Object.assign(new EventEmitter(), {
    stdout, stdin, stderr: new EventEmitter(), exitCode: null, kill: vi.fn(),
  });
  const spawn = vi.fn(() => child);
  const exports: { listVoices?: (key: string) => Promise<unknown> } = {};
  const context = createContext({
    module: { exports },
    require: (name: string) => {
      if (name === "fs") return {
        existsSync: () => false,
        promises: { readFile, mkdir: vi.fn(), writeFile: vi.fn() },
      };
      if (name === "path") return path;
      if (name === "child_process") return { spawn };
      if (name === "electron") return {
        app: { getPath: () => "C:\\test", on: vi.fn() },
      };
      throw new Error(`Unexpected module ${name}`);
    },
    process: { arch: "x64", env: {}, on: vi.fn() },
    console, Error, setTimeout, clearTimeout,
  });
  runInContext(source, context);
  const api = runInContext("module.exports", context) as {
    listVoices: (key: string) => Promise<unknown>;
  };
  return { api, child, spawn, readFile };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("SAPI request deadline", () => {
  it("rejects stalled startup and prevents a late spawn, then allows retry", async () => {
    const preparation = deferred();
    const { api, spawn, child } = loadWorker(
      vi.fn().mockReturnValueOnce(preparation.promise).mockResolvedValue("")
    );
    const first = expect(api.listVoices("plugin")).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(20000);
    await first;
    expect(spawn).not.toHaveBeenCalled();

    const retry = api.listVoices("plugin");
    await vi.advanceTimersByTimeAsync(0);
    expect(spawn).toHaveBeenCalledTimes(1);
    preparation.resolve("");
    await vi.advanceTimersByTimeAsync(0);
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(child.kill).not.toHaveBeenCalled();
    const request = JSON.parse(child.stdin.write.mock.calls[0][0]);
    child.stdout.emit("data", JSON.stringify({ id: request.id, ok: true, voices: [] }) + "\n");
    await expect(retry).resolves.toEqual([]);
  });

  it("charges preparation time against the processing deadline and kills the worker", async () => {
    const preparation = deferred();
    const { api, spawn, child } = loadWorker(vi.fn(() => preparation.promise));
    const result = expect(api.listVoices("plugin")).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(10000);
    preparation.resolve("");
    await vi.advanceTimersByTimeAsync(0);
    expect(spawn).toHaveBeenCalledOnce();
    expect(child.stdin.write).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10000);
    await result;
    expect(child.stdin.end).toHaveBeenCalledOnce();
    expect(child.kill).toHaveBeenCalledOnce();
  });

  it("cleans up a failed write and clears the deadline", async () => {
    const { api, child } = loadWorker();
    child.stdin.write.mockImplementation(() => { throw new Error("pipe failed"); });
    const result = expect(api.listVoices("plugin")).rejects.toThrow("pipe failed");
    await vi.advanceTimersByTimeAsync(0);
    await result;
    expect(child.kill).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
