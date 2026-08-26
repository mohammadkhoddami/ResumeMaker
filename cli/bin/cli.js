#!/usr/bin/env node

import { Command } from "commander";
import cliLogger from "../src/logger/index.js";
import { EnvironmentChecker } from "../src/environment/index.js";
import { CLIManager } from "../src/manager.js";
import { readPackageInfo } from "../src/paths/index.js";

function ensureSupportedNode() {
  const [major] = process.versions.node.split(".").map(Number);
  if (major < 18) {
    cliLogger.error(
      `Node.js v${process.versions.node} is not supported. Please upgrade to Node.js 18 or newer.`
    );
    process.exit(1);
  }
}

async function main() {
  ensureSupportedNode();

  const pkg = readPackageInfo();
  const program = new Command();

  program
    .name("resume-builder")
    .description("One-command launcher for the Persian Resume Builder app")
    .version(pkg.version ?? "0.0.0")
    .option("-v, --verbose", "Show debug output", false);

  program
    .command("start", { isDefault: true })
    .description("Start the application (default command)")
    .option("--no-check", "Skip pre-flight environment checks")
    .action(async (options) => {
      const manager = new CLIManager();
      await manager.start({ check: options.check !== false });
    });

  program
    .command("doctor")
    .description("Run diagnostics against the installed package")
    .action(async () => {
      cliLogger.info("Running diagnostics...\n");

      const checker = new EnvironmentChecker();
      const results = await checker.run();
      const blockers = results.filter((r) => !r.ok && r.kind === "error");
      const fixable = results.filter((r) => r.kind === "fixable");
      const warnings = results.filter((r) => r.kind === "warn" || r.kind === "info");

      for (const result of results) {
        if (result.ok && result.kind !== "info") {
          cliLogger.success(
            `${result.name}${result.details ? `: ${result.details}` : ` – ${result.message}`}`
          );
        } else if (result.kind === "fixable") {
          cliLogger.warn(`${result.name}: ${result.message} (fixed automatically on start)`);
        } else if (result.kind === "warn" || result.kind === "info") {
          cliLogger.warn(`${result.name}: ${result.message}`);
        } else {
          cliLogger.error(`${result.name}: ${result.message}`);
        }
        if (result.details && result.ok) cliLogger.muted(`    ${result.details}`);
        if (result.hint && (!result.ok || result.kind === "warn")) {
          for (const line of result.hint.split("\n")) cliLogger.muted(`    ${line}`);
        }
      }

      console.log("");
      cliLogger.info(`Diagnostics complete: ${results.length - blockers.length}/${results.length} checks passed`);

      if (blockers.length > 0) {
        cliLogger.error("Blocking problems found. Please resolve them and run doctor again.");
        process.exit(1);
      }

      if (fixable.length > 0 || warnings.length > 0) {
        cliLogger.info(
          "Nothing is blocking you: 'resume-builder start' sets up everything automatically."
        );
      } else {
        cliLogger.success("Everything looks good.");
      }
      process.exit(0);
    });

  program
    .command("build")
    .description("Build the production frontend bundle")
    .action(async () => {
      const manager = new CLIManager();
      await manager.build();
    });

  program.hook("preAction", () => {
    if (program.opts().verbose) {
      cliLogger.verbose = true;
    }
  });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  cliLogger.error(error?.message ?? "An unexpected error occurred.");
  process.exit(1);
});
