import type { MLResultInfo } from "markuplint";
import type { HtmlVariation } from "ngx-html-bridge";

interface Offset {
	startOffset: number;
	endOffset: number;
}
export type Violation = MLResultInfo["violations"][0];
export interface BridgeMLViolation extends Offset, Violation {}

export type BridgeMLResultInfo = Omit<MLResultInfo, "violations"> & {
	violations: BridgeMLViolation[];
} & { variation: HtmlVariation };
