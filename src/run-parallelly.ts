import { cpus } from "node:os";
import { Worker } from "node:worker_threads";
import type { HtmlVariation } from "ngx-html-bridge";
import type { BridgeMLResultInfo } from "./types.js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

let threadPool: Worker[] | undefined;

export const runParallelly = (
	templatePath: string,
	variations: HtmlVariation[],
): Promise<BridgeMLResultInfo[]> => {
	const variationsLength = variations.length;

	if (!threadPool) {
		threadPool = createThreadPool();
	}

	const results: BridgeMLResultInfo[] = [];
	let count = 0;

	return new Promise<BridgeMLResultInfo[]>((resolve) => {
		threadPool?.forEach((worker) => {
			worker.on("message", (result) => {
				count++;
				results.push(result);
				if (count === variationsLength) {
					resolve(results);
					threadPool?.forEach((worker) => {
						worker.postMessage("close");
					});
				}

				const nextVariation = variations.pop();
				if (nextVariation) {
					worker.postMessage({
						variation: nextVariation,
						templatePath,
					});
				}
			});
			worker.on("error", (error) => {
				count++;
				console.error(error);
				if (count === variationsLength) {
					resolve(results);
				}

				const nextVariation = variations.pop();
				if (nextVariation) {
					worker.postMessage({
						variation: nextVariation,
						templatePath,
					});
				}
			});

			const variation = variations.pop();
			if (variation) {
				worker.postMessage({
					variation,
					templatePath,
				});
			}
		});
	});
};

const createThreadPool = (): Worker[] => {
	// Leave 2 CPUs. One for main thread, another for other application
	const availableCpus = cpus().length - 2;
	const threadPool = [];
	for (let i = 0; i < availableCpus; i++) {
		threadPool.push(
			new Worker(`${dirname(fileURLToPath(import.meta.url))}/worker.js`),
		);
	}
	return threadPool;
};
