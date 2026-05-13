#!/usr/bin/env node
// Runs the ordered acceptance gates declared in .factory/manifest.yaml and writes
// a structured report to .factory/report.json. Exits 0 only if every gate passes.
// Designed to be called by the factory orchestrator inside a fresh VM, but safe
// to run locally (`yarn run factory:gate`) to preview what the factory will see.

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const manifestPath = resolve(repoRoot, ".factory/manifest.yaml");
const reportPath = resolve(repoRoot, ".factory/report.json");

const parseGatesFromManifest = (yaml) => {
  // Minimal extractor — the factory provides a real YAML parser; locally we only
  // need the `gates:` list. Keeps this script dependency-free.
  const lines = yaml.split("\n");
  const start = lines.findIndex((line) => line.trim() === "gates:");
  if (start === -1) throw new Error("manifest.yaml: missing `gates:` section");

  const gates = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break;
    const idMatch = line.match(/^\s*-\s*id:\s*(\S+)/);
    if (idMatch) {
      if (current) gates.push(current);
      current = { id: idMatch[1], command: "" };
      continue;
    }
    const cmdMatch = line.match(/^\s+command:\s*"(.+)"\s*$/);
    if (cmdMatch && current) current.command = cmdMatch[1];
  }
  if (current) gates.push(current);
  return gates;
};

const runGate = (gate) =>
  new Promise((resolveRun) => {
    const startedAt = Date.now();
    const child = spawn(gate.command, {
      shell: true,
      cwd: repoRoot,
      env: { ...process.env, CI: "true", FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on("close", (code) => {
      resolveRun({
        id: gate.id,
        command: gate.command,
        exit_code: code ?? -1,
        status: code === 0 ? "passed" : "failed",
        duration_ms: Date.now() - startedAt,
        stdout_tail: stdout.slice(-4000),
        stderr_tail: stderr.slice(-4000),
      });
    });
  });

const writeReport = (report) => {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
};

const main = async () => {
  const manifest = readFileSync(manifestPath, "utf8");
  const gates = parseGatesFromManifest(manifest);
  if (gates.length === 0) throw new Error("manifest.yaml: no gates defined");

  const results = [];
  let failedAt = null;
  for (const gate of gates) {
    process.stdout.write(`\n── factory-gate: ${gate.id} → ${gate.command}\n`);
    const result = await runGate(gate);
    results.push(result);
    if (result.status === "failed") {
      failedAt = gate.id;
      break;
    }
  }

  const report = {
    schema_version: 1,
    repo: "tower-front",
    started_at: new Date().toISOString(),
    overall_status: failedAt ? "failed" : "passed",
    failed_at: failedAt,
    gates: results,
  };
  writeReport(report);

  process.stdout.write(
    `\nfactory-gate: ${report.overall_status}${failedAt ? ` (failed at ${failedAt})` : ""}\n` +
      `report → ${reportPath}\n`,
  );
  process.exit(failedAt ? 1 : 0);
};

main().catch((error) => {
  const failure = {
    schema_version: 1,
    repo: "tower-front",
    started_at: new Date().toISOString(),
    overall_status: "errored",
    error: error instanceof Error ? error.message : String(error),
    gates: [],
  };
  try {
    writeReport(failure);
  } catch {
    // ignore
  }
  console.error("factory-gate: errored —", failure.error);
  process.exit(2);
});
