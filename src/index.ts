import type { MLResultInfo } from "markuplint";
import type { BridgeOption } from "ngx-html-bridge";
import {
	type HtmlVariation,
	parseAngularTemplate,
	parseAngularTemplateFile,
} from "ngx-html-bridge";
import { run } from "./run.js";
import { runParallelly } from "./run-parallelly.js";

interface Offset {
	startOffset: number;
	endOffset: number;
}
type Violation = MLResultInfo["violations"][0];
interface BridgeMLViolation extends Offset, Violation {}

export type BridgeMLResultInfo = Omit<MLResultInfo, "violations"> & {
	violations: BridgeMLViolation[];
} & { variation: HtmlVariation };

export { BridgeOption } from "ngx-html-bridge";

export const runMarkuplintAgainstTemplate = async (
	template: string,
	templatePath: string,
	option: BridgeOption = {
		includedAttributes: [],
		nonEmptyItems: [],
	},
): Promise<BridgeMLResultInfo[]> => {
	const variations = await parseAngularTemplate(template, templatePath, option);
	return runAll(templatePath, variations);
};

export const runMarkuplintAgainstTemplateFile = async (
	templatePath: string,
	option: BridgeOption = {
		includedAttributes: [],
		nonEmptyItems: [],
	},
): Promise<BridgeMLResultInfo[]> => {
	const variations = await parseAngularTemplateFile(templatePath, option);
	return runAll(templatePath, variations);
};

const runAll = async (
	templatePath: string,
	variations: HtmlVariation[],
): Promise<BridgeMLResultInfo[]> => {
	const results: BridgeMLResultInfo[] = [];

	// if the number of variations is small, overhead for launching workers will be more than the benefits of parallel execution
	if (variations.length < 128) {
		for (const variation of variations) {
			const result = await run(templatePath, variation);
			if (result) {
				results.push(result);
			}
		}
	} else {
		const resultsWithNull = await runParallelly(templatePath, variations);
		results.push(...resultsWithNull.filter((result) => !!result));
	}

	return filterDuplicateViolations(results);
};

const filterDuplicateViolations = (results: BridgeMLResultInfo[]) => {
	const uniqViolationKeys: string[] = [];
	const filteredResults: BridgeMLResultInfo[] = [];

	for (const result of results) {
		const uniqViolationsInResult: BridgeMLViolation[] = [];
		const violations = result.violations;
		for (const violation of violations) {
			const { startOffset, endOffset, message } = violation;
			const key = JSON.stringify({ startOffset, endOffset, message });
			if (!uniqViolationKeys.includes(key)) {
				uniqViolationKeys.push(key);
				uniqViolationsInResult.push(violation);
			}
		}
		if (uniqViolationsInResult.length > 0) {
			result.violations = uniqViolationsInResult;
			filteredResults.push(result);
		}
	}

	return filteredResults;
};
