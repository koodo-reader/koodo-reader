import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.resolve(ROOT, "src");
const THEME_CSS = path.resolve(ROOT, "public/assets/styles/theme.css");

const ROUTES: Record<string, string> = {
  manager: "src/pages/manager/index.tsx",
  reader: "src/pages/reader/index.tsx",
  login: "src/pages/login/index.tsx",
  redirect: "src/pages/redirect/index.tsx",
  stats: "src/pages/stats/index.tsx",
};

const IMPORT_RE = /(?:from|import)\s+["'](\.[^"']+)["']/g;
const CLASS_RE = /\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g;
const KEYFRAME_RE = /@keyframes\s+([\w-]+)/g;
const ANIMATION_RE = /animation(?:-name)?\s*:\s*([^;{}]+)/g;
const INLINE_ANIMATION_RE = /animation\s*:\s*["'`]([\w-]+)/g;

type Graph = {
  modules: Set<string>;
  css: Set<string>;
};

function walk(dir: string, pattern: RegExp, result: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, pattern, result);
    } else if (pattern.test(fullPath)) {
      result.push(path.resolve(fullPath));
    }
  }
  return result;
}

function resolveImport(from: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    `${base}.js`,
    `${base}.css`,
    path.join(base, "index.tsx"),
    path.join(base, "index.ts"),
    path.join(base, "component.tsx"),
    path.join(base, "component.ts"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function buildGraph(root: string): Graph {
  const modules = new Set<string>();
  const css = new Set<string>();
  const queue = [path.resolve(ROOT, root)];

  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || modules.has(file) || css.has(file)) {
      continue;
    }
    if (file.endsWith(".css")) {
      css.add(file);
      continue;
    }
    modules.add(file);
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(IMPORT_RE)) {
      const resolved = resolveImport(file, match[1]);
      if (resolved) {
        queue.push(resolved);
      }
    }
  }

  return { modules, css };
}

function parseClasses(files: Iterable<string>): Set<string> {
  const result = new Set<string>();
  for (const file of files) {
    const content = fs
      .readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    for (const match of content.matchAll(CLASS_RE)) {
      result.add(match[1]);
    }
  }
  return result;
}

function parseKeyframes(files: Iterable<string>): Set<string> {
  const result = new Set<string>();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(KEYFRAME_RE)) {
      result.add(match[1]);
    }
  }
  return result;
}

function collectUsedClasses(modules: Iterable<string>): Set<string> {
  const classNames = parseClasses(walk(SRC, /\.css$/));
  const used = new Set<string>();

  const addTokens = (value: string) => {
    for (const token of value.split(/\s+/)) {
      if (token && classNames.has(token)) {
        used.add(token);
      }
    }
  };

  for (const file of modules) {
    const content = fs.readFileSync(file, "utf8");
    const attributeRe =
      /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/g;
    for (const match of content.matchAll(attributeRe)) {
      if (match[3] !== undefined) {
        if (match[3].includes(">")) {
          continue;
        }
        for (const literal of match[3].match(/[`"'][^`"']*[`"']/g) ?? []) {
          addTokens(literal.slice(1, -1));
        }
      } else {
        addTokens(match[1] ?? match[2] ?? "");
      }
    }
  }

  return used;
}

function collectUsedKeyframes(
  modules: Iterable<string>,
  routeCss: Iterable<string>
): Set<string> {
  const keyframes = parseKeyframes(walk(SRC, /\.css$/));
  const used = new Set<string>();

  for (const file of routeCss) {
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(ANIMATION_RE)) {
      for (const part of match[1].split(",")) {
        const name = part.trim().split(/\s+/)[0];
        if (keyframes.has(name)) {
          used.add(name);
        }
      }
    }
  }

  for (const file of modules) {
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(INLINE_ANIMATION_RE)) {
      if (keyframes.has(match[1])) {
        used.add(match[1]);
      }
    }
  }

  return used;
}

const entryGraph = buildGraph("src/index.tsx");
const globalClasses = new Set([
  ...parseClasses(entryGraph.css),
  ...parseClasses([THEME_CSS]),
]);
const globalKeyframes = new Set([
  ...parseKeyframes(entryGraph.css),
  ...parseKeyframes([THEME_CSS]),
]);

describe.each(Object.entries(ROUTES))(
  "shared styles for %s",
  (route, root) => {
    const graph = buildGraph(root);

    it("has every used class available", () => {
      const available = new Set([
        ...globalClasses,
        ...parseClasses(graph.css),
      ]);
      const missing = [...collectUsedClasses(graph.modules)].filter(
        (className) => !available.has(className)
      );
      expect(
        missing,
        `${route} uses classes whose CSS is not loaded: ${missing.join(", ")}`
      ).toEqual([]);
    });

    it("has every used keyframe available", () => {
      const available = new Set([
        ...globalKeyframes,
        ...parseKeyframes(graph.css),
      ]);
      const missing = [
        ...collectUsedKeyframes(graph.modules, graph.css),
      ].filter((name) => !available.has(name));
      expect(
        missing,
        `${route} uses keyframes whose CSS is not loaded: ${missing.join(", ")}`
      ).toEqual([]);
    });
  }
);
