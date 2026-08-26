import chalk from "chalk";
import * as readline from "readline";

let rl = null;

function getReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

export default {
  verbose: false,

  log(...args) {
    process.stdout.write(args.join(" ") + "\n");
  },

  info(...args) {
    process.stdout.write(chalk.blue("ℹ") + " " + args.join(" ") + "\n");
  },

  success(...args) {
    process.stdout.write(chalk.green("✓") + " " + args.join(" ") + "\n");
  },

  error(...args) {
    process.stderr.write(chalk.red("✗") + " " + args.join(" ") + "\n");
  },

  warn(...args) {
    process.stderr.write(chalk.yellow("⚠") + " " + args.join(" ") + "\n");
  },

  muted(...args) {
    process.stdout.write(chalk.gray(args.join(" ")) + "\n");
  },

  debug(...args) {
    if (this.verbose) {
      process.stdout.write(chalk.gray("[DEBUG] ") + args.join(" ") + "\n");
    }
  },

  prompt(message) {
    return new Promise((resolve) => {
      getReadline().question(chalk.yellow(message) + " ", resolve);
    });
  },
};
