# Report inbox

- `testcases/*.json`: simulator-compatible cases with timestamps. Each file
  holds one testcase in a JSON array.

Generated files are ignored by Git. Promote useful reviewed cases into the
repository's curated `testcases/` folder.

From the simulator repository root:

```sh
npx tsx scripts/run_testcases.ts \
  --testcase-root report_inbox/bcp/testcases \
  --output-dir /private/tmp/chat-report-simulator-results
```

The newer Mk2 runner accepts a single exported file:

```sh
npx tsx research/mk2/runner.ts \
  --input report_inbox/bcp/testcases/<report>.json \
  --samples 1 --output /private/tmp/chat-report-mk2-result.json
```
