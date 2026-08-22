#!/usr/bin/env node

import { Command } from "commander";
import cliLogger from "../src/logger/index.js";
import { EnvironmentChecker } from "../src/environment/index.js";
import { CLIManager } from "../src/manager.js";
import pkg from "../../package.json" with { type: "json" };

const program = new Command();

program
  .name("resume-builder")
  .description("Simple CLI tool for building Persian CVs")
  .version(pkg.version || "1.0.0");

program
  .command("start")
  .description("Start the application")
  .option("--no-check", "Skip environment checks")
  .option("--port <port>", "Override default port", "3000")
  .action(async (options) => {
    cliLogger.info("Starting Resume Builder...");

    const environmentChecker = new EnvironmentChecker();
    if (options.check !== false) {
      cliLogger.info("Checking environment...");
      const checks = await environmentChecker.run();
      if (!checks.every((c) => c.success)) {
        cliLogger.error("Environment check failed");
        process.exit(1);
      }
    }

    const manager = new CLIManager();
    await manager.start({
      checkEnv: options.check !== false,
      port: parseInt(options.port, 10),
    });

    cliLogger.success("Application is ready!");
  });

program
  .command("doctor")
  .description("Run diagnostics")
  .action(async () => {
    cliLogger.info("Running diagnostics...\n");
    const environmentChecker = new EnvironmentChecker();
    const checks = await environmentChecker.run();
    const passed = checks.filter((c) => c.success).length;
    const total = checks.length;

    checks.forEach((check) => {
      if (check.success) {
        cliLogger.success(`${check.name}: ${check.message}${check.details ? ` (${check.details})` : ""}`);
      } else {
        cliLogger.error(`${check.name}: ${check.message}${check.details ? ` (${check.details})` : ""}`);
      }
    });

    cliLogger.info(`\nDiagnostics complete: ${passed}/${total} checks passed`);

    if (passed === total) {
      cliLogger.success("Everything looks good.");
      process.exit(0);
    } else {
      cliLogger.error("Some checks failed. Please review the errors above.");
      process.exit(1);
    }
  });

program
  .command("build")
  .description("Build the production version")
  .action(async () => {
    cliLogger.info("Building production version...");
    const manager = new CLIManager();
    await manager.build();
    cliLogger.success("Build complete!");
  });

program.parse();