---
name: seo-keyword-research-tool
description: Research SEO keywords from seed terms, cluster intent, score opportunities, and generate publish-ready keyword briefs. Use when users ask for keyword research, low-competition opportunities, topical maps, SERP intent clustering, or content briefs for SEO pages.
---

# SEO Keyword Research Tool

Use this skill to turn seed terms into actionable keyword plans.

## Workflow
1. Collect seed terms and optional business context (audience, geography, funnel stage).
2. Save input keywords as CSV (`keyword,volume,kd,cpc,intent`) or plain text list.
3. Run `scripts/keyword_plan.py` to normalize, cluster, and score opportunities.
4. Review generated markdown brief and CSV outputs.
5. Prioritize clusters by score and business relevance.

## Run the planner

```bash
python3 scripts/keyword_plan.py \
  --input references/sample-keywords.csv \
  --outdir ./out \
  --topic "seo automation"
```

## Output
- `clustered_keywords.csv` — keywords grouped by intent/topic
- `opportunities.csv` — sortable opportunities with score
- `content_brief.md` — page ideas and suggested angles

## Notes
- Keep numeric columns optional; missing values are handled.
- Use this tool for fast planning; validate final priorities with live SERP checks.
