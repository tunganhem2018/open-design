#!/usr/bin/env python3
import argparse, csv, os, re
from collections import defaultdict

def to_float(v, default=0.0):
    try:
        return float(v)
    except Exception:
        return default

def norm_intent(intent: str) -> str:
    s = (intent or "").strip().lower()
    if s in {"informational","commercial","transactional","navigational"}:
        return s
    return "informational"

def topic_key(keyword: str) -> str:
    kw = keyword.lower().strip()
    kw = re.sub(r"[^a-z0-9\s]", " ", kw)
    tokens = [t for t in kw.split() if len(t) > 2]
    return " ".join(tokens[:2]) if tokens else keyword.lower().strip()

def score(row):
    vol = to_float(row.get("volume",0), 0)
    kd = to_float(row.get("kd",50), 50)
    cpc = to_float(row.get("cpc",0), 0)
    intent = norm_intent(row.get("intent","informational"))
    intent_bonus = {"transactional":20,"commercial":15,"informational":10,"navigational":5}[intent]
    return round((vol * 0.6) + (cpc * 8) + intent_bonus - (kd * 0.7), 2)

def read_rows(path):
    if path.endswith('.csv'):
        with open(path, newline='', encoding='utf-8') as f:
            return list(csv.DictReader(f))
    rows = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            kw = line.strip()
            if kw:
                rows.append({"keyword": kw, "volume": "", "kd": "", "cpc": "", "intent": "informational"})
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--topic", default="")
    args = ap.parse_args()

    rows = read_rows(args.input)
    for r in rows:
        r.setdefault("keyword","")
        r["intent"] = norm_intent(r.get("intent",""))
        r["cluster"] = topic_key(r.get("keyword",""))
        r["score"] = score(r)

    os.makedirs(args.outdir, exist_ok=True)

    clustered_path = os.path.join(args.outdir, "clustered_keywords.csv")
    with open(clustered_path, "w", newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=["keyword","cluster","intent","volume","kd","cpc","score"])
        w.writeheader()
        for r in sorted(rows, key=lambda x: (x["cluster"], -to_float(x["score"]))):
            w.writerow({k:r.get(k,"") for k in w.fieldnames})

    opportunities_path = os.path.join(args.outdir, "opportunities.csv")
    with open(opportunities_path, "w", newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=["keyword","intent","volume","kd","cpc","score","cluster"])
        w.writeheader()
        for r in sorted(rows, key=lambda x: -to_float(x["score"])):
            w.writerow({k:r.get(k,"") for k in w.fieldnames})

    clusters = defaultdict(list)
    for r in rows:
        clusters[r["cluster"]].append(r)

    brief_path = os.path.join(args.outdir, "content_brief.md")
    with open(brief_path, "w", encoding='utf-8') as f:
        f.write(f"# SEO Keyword Brief\n\n")
        if args.topic:
            f.write(f"**Topic:** {args.topic}\n\n")
        f.write("## Priority Clusters\n\n")
        ranked = sorted(clusters.items(), key=lambda kv: sum(to_float(x['score']) for x in kv[1]) / max(len(kv[1]),1), reverse=True)
        for i, (cluster, kws) in enumerate(ranked[:10], start=1):
            best = sorted(kws, key=lambda x: -to_float(x["score"]))[:5]
            avg_score = round(sum(to_float(x['score']) for x in kws) / max(len(kws),1), 2)
            f.write(f"### {i}. {cluster} (avg score {avg_score})\n")
            f.write("- Suggested page type: informational guide\n")
            f.write("- Target keywords:\n")
            for b in best:
                f.write(f"  - {b.get('keyword','')} (score {b.get('score')})\n")
            f.write("\n")

    print(f"Wrote: {clustered_path}\nWrote: {opportunities_path}\nWrote: {brief_path}")

if __name__ == "__main__":
    main()
