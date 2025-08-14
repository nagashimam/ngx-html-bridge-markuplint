# GEMINI.md: Project ngx-html-bridge-markuplint

This document provides context for the Gemini AI assistant to effectively contribute to this project.

## 1. Project Overview & Goal

- **Project Name:** ngx-html-bridge-markuplint
- **Type:** HTML linter
- **Core Purpose:** This is a wrapper for [Markuplint](https://github.com/markuplint/markuplint) that uses [ngx-html-bridge](https://github.com/nagashimam/ngx-html-bridge). Markuplint can be used from the CLI and as a VSCode extension. In either case, when used in an Angular project, it's easier for Markuplint to process Angular templates when they are reverse-compiled to plain HTML. `ngx-html-bridge` can be used for that. This project extracts the common processing of Angular templates needed when using Markuplint with `ngx-html-bridge` via the CLI or the VSCode extension.

- **Key Features:**
  - Receives a template and its file path, and returns Markuplint results.
    - This includes identifying where in the template each rule violation occurs.

## 2. Tech Stack

- **Language:** TypeScript
- **Testing:** Node.js Test Runner
- **Linting/Formatting:** Biome
- **Package Manager:** npm

## 3. Project Structure

```
/
├── src/
│   ├── index.ts
│   └── ... (other source files)
├── tests/
│   ├── index.test.ts
│   └── ... (other test files)
├── dist/
│   └── ... (compiled files)
├── node_modules/
│   └── ... (dependencies)
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── biome.json
└── GEMINI.md
```

## 4. Key Commands

These commands should be run from the project root.

- **Install dependencies:** `npm install`
- **Build the tool:** `npm run build`
- **Run tests:** `npm test`
- **Lint the code:** `npm run lint`
- **Run example:** `npm run example`

## 5. Coding Conventions & Style Guide

- **Style:** Follow standard TypeScript best practices. Among others, follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).
- **Commit Messages:** Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. (e.g., `feat(core): add new feature`, `fix(parser): resolve bug in html parsing`)
- **Testing:** All new features or bug fixes must be accompanied by unit tests with a high level of code coverage.
- **Documentation:** Public APIs must have TSDoc comments.

## 6. Contribution Workflow

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feat/my-new-feature`).
3.  Make your changes.
4.  Ensure all tests and lint checks pass (`npm test` & `npm run lint`).
5.  Submit a pull request with a clear description of the changes.
