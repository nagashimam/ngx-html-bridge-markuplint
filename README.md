# ngx-html-bridge-markuplint

This library serves as a bridge between [Markuplint](https://markuplint.dev/) and Angular templates. It uses [ngx-html-bridge](https://github.com/nagashimam/ngx-html-bridge) to reverse-compile Angular templates into plain HTML, allowing Markuplint to analyze them effectively.

It's designed to be a core component for building tools like CLI linters or editor extensions for Angular projects. The library correctly maps Markuplint violation locations back to the original Angular template source code.

## Installation

```bash
npm install ngx-html-bridge-markuplint markuplint ngx-html-bridge
```

## Usage

This library provides two main functions to run Markuplint against Angular templates.

### `runMarkuplintAgainstTemplate(template, templatePath)`

Analyzes a string containing an Angular template. You must provide the template content and a file path for context.

```typescript
import { runMarkuplintAgainstTemplate } from "ngx-html-bridge-markuplint";

const template = `
  <div [id]="'user-profile'">
    <p>Hello, {{ userName }}!</p>
  </div>
`;

const templatePath = "/path/to/your/project/src/app/app.component.html";

runMarkuplintAgainstTemplate(template, templatePath).then((results) => {
  results.forEach((result) => {
    console.log(`File: ${result.filePath}`);
    result.violations.forEach((violation) => {
      console.log(
        `[${violation.severity}] ${violation.message} ` +
          `(line: ${violation.line}, col: ${violation.col}, ` +
          `startOffset: ${violation.startOffset}, endOffset: ${violation.endOffset})`,
      );
    });
  });
});
```

### `runMarkuplintAgainstTemplateFile(templatePath)`

Analyzes an Angular template file directly from the file system.

```typescript
import { runMarkuplintAgainstTemplateFile } from "ngx-html-bridge-markuplint";

const templatePath = "/path/to/your/project/src/app/app.component.html";

runMarkuplintAgainstTemplateFile(templatePath).then((results) => {
  // Process results as shown in the example above
  console.log(results);
});
```

## API

### `runMarkuplintAgainstTemplate(template: string, templatePath: string): Promise<BridgeMLResultInfo[]>`

- `template`: The Angular template content as a string.
- `templatePath`: The absolute path to the template file (used by Markuplint for context and configuration resolution).
- Returns: A promise that resolves to an array of `BridgeMLResultInfo` objects.

### `runMarkuplintAgainstTemplateFile(templatePath: string): Promise<BridgeMLResultInfo[]>`

- `templatePath`: The absolute path to the template file.
- Returns: A promise that resolves to an array of `BridgeMLResultInfo` objects.

### `BridgeMLResultInfo`

The result object extends the standard Markuplint `MLResultInfo` with an added `variation` property from `ngx-html-bridge` and modified `violations` that include `startOffset` and `endOffset` for precise location mapping in the original source file.

Note that `col` and `line` are the ones for reverse-compiled HTML, not original source file. If you want to know location in the original source file, use `startOffset` and `endOffset`.

```typescript
export type BridgeMLResultInfo = Omit<MLResultInfo, "violations"> & {
  violations: BridgeMLViolation[];
} & { variation: HtmlVariation };

interface BridgeMLViolation extends Violation {
  startOffset: number;
  endOffset: number;
}
```

## License

MIT
