import * as path from "node:path";
import type { MLResultInfo } from "markuplint";
import {
	type HtmlVariation,
	parseAngularTemplate,
	parseAngularTemplateFile,
} from "ngx-html-bridge";

interface Offset {
	startOffset: number;
	endOffset: number;
}
type Violation = MLResultInfo["violations"][0];
interface BridgeMLViolation extends Offset, Violation {}

export type BridgeMLResultInfo = Omit<MLResultInfo, "violations"> & {
	violations: BridgeMLViolation[];
} & { variation: HtmlVariation };

export const runMarkuplintAgainstTemplate = (
	template: string,
	templatePath: string,
): Promise<BridgeMLResultInfo[]> => {
	const variations = parseAngularTemplate(template, templatePath);
	return run(templatePath, variations);
};

export const runMarkuplintAgainstTemplateFile = (
	templatePath: string,
): Promise<BridgeMLResultInfo[]> => {
	const variations = parseAngularTemplateFile(templatePath);
	return run(templatePath, variations);
};

const run = async (
	templatePath: string,
	variations: HtmlVariation[],
): Promise<BridgeMLResultInfo[]> => {
	const results: BridgeMLResultInfo[] = [];
	const { MLEngine } = await import("markuplint");

	for (const variation of variations) {
		const engine = await MLEngine.fromCode(variation.annotated, {
			name: path.basename(templatePath),
			dirname: path.dirname(templatePath),
		});
		const result = await engine.exec();

		if (result === null) {
			continue;
		}

		results.push({
			filePath: result.filePath,
			sourceCode: result.sourceCode,
			fixedCode: result.fixedCode,
			status: result.status,
			violations: modifyViolations(result.violations, variation.annotated),
			variation,
		});
	}

	return results;
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
