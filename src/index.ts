import * as path from "node:path";
import type { MLResultInfo } from "markuplint";
import {
	type HtmlVariation,
	parseAngularTemplate,
	parseAngularTemplateFile,
} from "ngx-html-bridge";
import type { BridgeOption } from "ngx-html-bridge";
import { MLEngine } from "markuplint";

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
	option: BridgeOption,
): Promise<BridgeMLResultInfo[]> => {
	const variations = await parseAngularTemplate(template, templatePath, option);
	return run(templatePath, variations);
};

export const runMarkuplintAgainstTemplateFile = async (
	templatePath: string,
	option: BridgeOption,
): Promise<BridgeMLResultInfo[]> => {
	const variations = await parseAngularTemplateFile(templatePath, option);
	return run(templatePath, variations);
};

const run = async (
	templatePath: string,
	variations: HtmlVariation[],
): Promise<BridgeMLResultInfo[]> => {
	const results: BridgeMLResultInfo[] = [];

	for (const variation of variations) {
		const engine = await MLEngine.fromCode(variation.annotated, {
			name: path.basename(templatePath),
			dirname: path.dirname(templatePath),
		});
		const result = await engine.exec();

		if (result === null) {
			continue;
		}

		const violations = modifyViolations(result.violations, variation.annotated);
		if (violations.length === 0) {
			continue;
		}

		results.push({
			filePath: result.filePath,
			sourceCode: result.sourceCode,
			fixedCode: result.fixedCode,
			status: result.status,
			violations,
			variation,
		});
	}

	return filterDuplicateViolations(results);
};

const modifyViolations = (
	violations: readonly Violation[],
	html: string,
): BridgeMLViolation[] =>
	violations.map((violation) => {
		const offset = extractOffsetsFromHTMLRaw(violation.raw) ||
			extractOffsetsFromAttributeRaw(html, violation) || {
				startOffset: 0,
				endOffset: 0,
			};

		const { startOffset, endOffset } = offset;
		return {
			...violation,
			startOffset,
			endOffset,
		};
	});

const extractOffsetsFromHTMLRaw = (
	raw: string,
): { startOffset: number; endOffset: number } | null => {
	const regex =
		/data-ngx-html-bridge-start-offset="(\d+)"\s+data-ngx-html-bridge-end-offset="(\d+)"/;
	const match = raw.match(regex);

	if (match) {
		const startOffset = Number.parseInt(match[1], 10);
		const endOffset = Number.parseInt(match[2], 10);
		return { startOffset, endOffset };
	}

	return null;
};

const extractOffsetsFromAttributeRaw = (
	html: string,
	violation: Violation,
): { startOffset: number; endOffset: number } | null => {
	const { raw, col } = violation;
	const rawIndex = html.indexOf(raw);
	if (rawIndex === -1) {
		return null;
	}

	const htmlBeforeRaw = html.substring(0, col - 1);
	const attributeName = raw.split("=")[0].trim();
	const startOffsetAttr = `data-ngx-html-bridge-${attributeName}-start-offset`;
	const endOffsetAttr = `data-ngx-html-bridge-${attributeName}-end-offset`;

	const rawOffsetRegex = new RegExp(
		`.*${startOffsetAttr}="(\\d+)" ${endOffsetAttr}="(\\d+)"`,
	);
	const match = htmlBeforeRaw.match(rawOffsetRegex);

	const rawStartOffset = match ? Number.parseInt(match[1], 10) : 0;
	const rawEndOffset = match ? Number.parseInt(match[2], 10) : 0;

	return {
		startOffset: rawStartOffset,
		endOffset: rawEndOffset,
	};
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
