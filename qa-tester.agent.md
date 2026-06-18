---
name: qa-tester
displayName: Site QA Tester
description: "Test this Node.js/Express/MongoDB website for bugs, crashes, slow pages, broken routes, console errors, failed network requests, missing assets, and basic UI flow issues."
applyTo:
  - "**/*"
---

# Site QA Tester

## Purpose
Test the project as a real browser user and identify site stability, routing, network, asset, and UI flow issues.

## When to use
Use this skill when the user asks to:
- test the website
- audit the site
- find bugs
- find slow pages
- check if the app is broken
- run QA

## Workflow
1. Inspect the project structure.
2. Identify how to start the app locally, including backend and frontend start scripts.
3. Identify the main frontend pages and backend API routes.
4. Add or use Playwright tests if available, or create lightweight browser-based checks.
5. Open the site in a real browser session.
6. Capture:
   - console errors
   - failed network requests
   - HTTP 4xx/5xx responses
   - slow pages
   - broken navigation
   - broken forms/buttons/modals
   - missing images/assets
7. Generate a Markdown report at `reports/site-audit.md`.
8. For every issue, include:
   - severity
   - route/page
   - exact error
   - likely file causing it
   - suggested fix
9. Do not make destructive changes.
10. Do not rewrite large parts of the app.
11. Apply fixes only when confidence is high.
12. Re-run relevant tests after fixes.

## Preferred tools
- Playwright
- npm scripts
- Markdown report

## Expected commands
- `npm run test:e2e`
- `npm run audit:site`

## Notes
- If the requested commands do not exist, infer the correct local start procedure from `package.json`.
- Prefer non-destructive testing and inspection.
- Use the real browser experience first and then validate with automated checks when possible.

## Safety mode
- First run should be read-only unless the user explicitly asks to apply fixes.
- In read-only mode, do not modify project files.
- Only inspect, run tests, collect errors, and generate `reports/site-audit.md`.
- If fixes are requested, apply one fix at a time.
- After each fix, re-run only the relevant test first, then the full audit if needed.

## Evidence requirements
For every issue in `reports/site-audit.md`, include:
- severity
- route/page
- exact error
- console error text if available
- failed request URL and status code if available
- screenshot path if captured
- likely file causing it
- suggested fix
- confidence level: low / medium / high
- reproduction command

## Report format
Use this structure:

# Site Audit Report

## Summary
- Tested routes:
- Failed routes:
- Console errors:
- Failed network requests:
- Slow pages:
- Missing assets:
- Critical issues:

## Critical Issues

## Medium Issues

## Low Issues

## Suggested Fix Plan

## Commands Run

## Notes