import { parentPort } from "node:worker_threads";
import type { HtmlVariation } from "ngx-html-bridge";
import { run } from "./run.js";

parentPort?.on(
	"message",
	async (message: { templatePath: string; variation: HtmlVariation }) => {
		const { templatePath, variation } = message;
		const result = await run(templatePath, variation);
		parentPort?.postMessage(result);
	},
);
