import chalk from "chalk";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

  debug(...args) {
    if (this.verbose) {
      process.stdout.write(chalk.gray("[DEBUG]") + " " + args.join(" ") + "\n");
    }
  },

  prompt(message) {
    return new Promise((resolve) => {
      rl.question(chalk.yellow(message) + " ", resolve);
    });
  },

  spinner(message) {
    process.stdout.write(chalk.blue(`${message}...`));
  },

  stopSpinner(success) {
    const symbol = success ? chalk.green("✓") : chalk.red("✗");
    process.stdout.write(`\r${symbol} ${message}\n`);
  },

  table(headers, rows) {
    const columnWidths = headers.map((_, i) =>
      Math.max(
        headers[i].length,
        ...rows.map((row) => row[i]?.length || 0)
      ) + 2
    );

    const getAligned = (text, width, align = "left") => {
      const padding = " ".repeat(width - text.length);
      return align === "left" ? text + padding : padding + text;
    };

    const headerLine = "|" + headers.map((h, i) =>
      getAligned(h, columnWidths[i])
    ).join("|") + "|";
    const border = "|" + columnWidths.map((w) => "-".repeat(w + 2)).join("|") + "|";

    process.stdout.write("\n" + border + "\n");
    process.stdout.write("|" + getAligned("  " + headers.join("  ") + "  ", headerLine.length - 4, "center") + "|\n");
    process.stdout.write(border + "\n");

    rows.forEach((row) => {
      const rowLine = "|" + row.map((cell, i) =>
        getAligned(cell || "", columnWidths[i])
      ).join("|") + "|";
      process.stdout.write("|" + getAligned("  " + rowLine.slice(0, -2) + "  ", rowLine.length - 4, "center") + "|\n");
    });

    process.stdout.write(border + "\n");
  },
};