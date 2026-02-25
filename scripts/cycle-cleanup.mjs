import path from "path";
import { fileURLToPath } from "url";
import { mkdir, rm } from "fs/promises";
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const logsDir = path.join(projectRoot, "data", "logs");

const confirmToken = "DELETE LOGS";
const hasYesFlag = process.argv.includes("--yes");

if (!hasYesFlag) {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(
    `This will permanently remove local runtime logs at ${logsDir}.\nType "${confirmToken}" to continue: `
  );
  rl.close();

  if (answer.trim() !== confirmToken) {
    console.log("Cycle cleanup cancelled.");
    process.exit(1);
  }
}

await rm(logsDir, { recursive: true, force: true });
await mkdir(logsDir, { recursive: true });

console.log(`Cycle cleanup complete: ${logsDir}`);
