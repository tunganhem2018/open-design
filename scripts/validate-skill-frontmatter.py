#!/usr/bin/env python3
"""
Structural validation harness for SKILL.md files.
Checks: valid YAML frontmatter, required fields, parse errors.

Usage:
  python3 scripts/validate-skill-frontmatter.py skills/           # check all skills
  python3 scripts/validate-skill-frontmatter.py skills/bmad-*     # check specific skills
  python3 scripts/validate-skill-frontmatter.py --ci skills/       # CI mode (exit code 1 on errors)

Exit codes: 0 = clean, 1 = issues found
"""

import sys
import os
import argparse
import json
from pathlib import Path

try:
    import frontmatter
except ImportError:
    print("ERROR: python-frontmatter not installed. Run: pip install python-frontmatter")
    sys.exit(2)

# Fields that every SKILL.md MUST have
REQUIRED_FIELDS = ["name", "description"]

# Fields that are recommended (warn if missing)
RECOMMENDED_FIELDS = ["license"]


def find_skill_files(paths: list[str]) -> list[Path]:
    """Find all SKILL.md files under given paths."""
    skill_files = []
    for p in paths:
        root = Path(p)
        if not root.exists():
            print(f"WARNING: Path does not exist: {root}")
            continue
        if root.is_file() and root.name == "SKILL.md":
            skill_files.append(root)
        elif root.is_dir():
            for skill_md in root.rglob("SKILL.md"):
                skill_files.append(skill_md)
    return sorted(skill_files)


def validate_skill(filepath: Path) -> dict:
    """Validate a single SKILL.md file. Returns dict with findings."""
    result = {
        "file": str(filepath),
        "valid": True,
        "errors": [],
        "warnings": [],
    }
    skill_name = filepath.parent.name if filepath.parent.name != "skills" else "unknown"

    try:
        with open(filepath) as f:
            post = frontmatter.load(f)
    except Exception as e:
        result["valid"] = False
        result["errors"].append(f"PARSE ERROR: {e}")
        return result

    # Check required fields
    metadata = post.metadata
    for field in REQUIRED_FIELDS:
        if field not in metadata or not metadata[field]:
            result["valid"] = False
            result["errors"].append(f"MISSING required field: '{field}'")

    # Check recommended fields
    for field in RECOMMENDED_FIELDS:
        if field not in metadata or not metadata[field]:
            result["warnings"].append(f"Missing recommended field: '{field}'")

    # Check that body is not empty (whitespace-only body = effectively empty)
    body_text = post.content.strip() if post.content else ""
    if not body_text:
        result["valid"] = False
        result["errors"].append("EMPTY body: SKILL.md has no content after frontmatter")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Validate SKILL.md frontmatter across skill directories"
    )
    parser.add_argument(
        "paths", nargs="*", default=["skills/"],
        help="Paths to scan for SKILL.md files (default: skills/)"
    )
    parser.add_argument(
        "--ci", action="store_true",
        help="CI mode: exit 1 on any error, output JSON"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Output results as JSON"
    )
    args = parser.parse_args()

    # Handle CI mode where changed files might be passed via stdin
    if args.ci and not sys.stdin.isatty():
        changed = [line.strip() for line in sys.stdin if line.strip()]
        if changed:
            skill_dirs = set()
            for f in changed:
                parts = Path(f).parts
                if len(parts) >= 2 and parts[0] == "skills":
                    skill_dir = Path("skills") / parts[1]
                    if skill_dir.is_dir():
                        skill_dirs.add(str(skill_dir))
            if skill_dirs:
                args.paths = sorted(skill_dirs) + args.paths

    files = find_skill_files(args.paths)

    if not files:
        print("No SKILL.md files found to validate.")
        sys.exit(0)

    results = [validate_skill(f) for f in files]
    invalid = [r for r in results if not r["valid"]]
    with_warnings = [r for r in results if r["warnings"]]

    if args.json or args.ci:
        print(json.dumps({
            "total": len(results),
            "valid": len(results) - len(invalid),
            "invalid": len(invalid),
            "warnings": len(with_warnings),
            "results": results,
        }, indent=2))

    if args.ci:
        if invalid:
            print(f"\n❌ {len(invalid)} skill(s) have errors:", file=sys.stderr)
            for r in invalid:
                print(f"  {r['file']}:", file=sys.stderr)
                for e in r["errors"]:
                    print(f"    - {e}", file=sys.stderr)
            sys.exit(1)
        if with_warnings:
            print(f"\n⚠️  {len(with_warnings)} skill(s) have warnings (non-blocking)")
    else:
        # Human-readable output
        print(f"\n{'='*60}")
        print(f"SKILL.md Validation Report")
        print(f"{'='*60}")
        print(f"Total skills: {len(results)}")
        print(f"✅ Valid:     {len(results) - len(invalid)}")
        print(f"❌ Invalid:   {len(invalid)}")
        print(f"⚠️  Warnings:  {len(with_warnings)}")

        if with_warnings:
            print(f"\n--- Warnings ---")
            for r in with_warnings:
                for w in r["warnings"]:
                    print(f"  {r['file']}: {w}")

        if invalid:
            print(f"\n--- Errors ---")
            for r in invalid:
                print(f"  {r['file']}:")
                for e in r["errors"]:
                    print(f"    ❌ {e}")
            print(f"\n❌ {len(invalid)} skill(s) failed validation.")
            sys.exit(1)
        else:
            print(f"\n✅ All skills pass validation.")


if __name__ == "__main__":
    main()
