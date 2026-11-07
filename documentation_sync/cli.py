"""Command-line entry point for documentation synchronization."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .core import (
    AtomicDocumentationWriter,
    Manifest,
    RepositoryScanner,
    SyncError,
    generate_markdown,
    validate_facts,
)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Evidence-based documentation synchronization")
    parser.add_argument("mode", choices=("analyze", "validate", "generate", "sync"))
    parser.add_argument("--repo-root", type=Path, default=None)
    parser.add_argument("--manifest", type=Path, default=None)
    parser.add_argument("--target", type=Path, default=None)
    parser.add_argument("--format", choices=("json", "text"), default="text")
    parser.add_argument("--dry-run", action="store_true")
    return parser


def _emit(report: dict[str, object], output_format: str, generated: str | None = None) -> None:
    if generated is not None and output_format == "text":
        print(generated, end="")
        return
    if output_format == "json":
        print(json.dumps(report, indent=2, sort_keys=True))
        return
    print(f"status: {report['status']}")
    print(f"mode: {report['mode']}")
    print(f"scanned files: {len(report.get('scanned_files', []))}")
    print(f"facts: {len(report.get('facts', []))}")
    for finding in report.get("findings", []):
        print(f"{finding['severity']}: {finding['code']}: {finding['message']}")


def run(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    manifest_path = args.manifest or ((args.repo_root or Path.cwd()) / ".github" / "documentation-sync-manifest.json")
    try:
        manifest = Manifest.load(manifest_path)
        scanner = RepositoryScanner(manifest)
        scan = scanner.discover()
        facts = scanner.extract_facts(scan)
        validation = validate_facts(facts, manifest)
        report: dict[str, object] = {
            "mode": args.mode,
            "status": "success" if validation.valid else "validation_failure",
            "changed_targets": [],
            "scanned_files": [path.relative_to(manifest.root).as_posix() for path in scan.source_files],
            "facts": [fact.as_dict() for fact in facts],
            "findings": [finding.as_dict() for finding in validation.findings],
            "writes": [],
            "errors": [],
        }
        if not validation.valid:
            _emit(report, args.format)
            return 2

        generated = generate_markdown(facts)
        if args.mode == "generate":
            _emit(report, args.format, generated)
            return 0
        if args.mode == "sync" and not args.dry_run:
            if args.target is None:
                report["status"] = "operational_failure"
                report["errors"] = [{"code": "TARGET_REQUIRED", "message": "sync requires --target"}]
                _emit(report, args.format)
                return 3
            target = args.target if args.target.is_absolute() else manifest.root / args.target
            AtomicDocumentationWriter(manifest).write_all({target: generated})
            report["changed_targets"] = [target.relative_to(manifest.root).as_posix()]
            report["writes"] = [{"target": target.relative_to(manifest.root).as_posix(), "status": "replaced"}]
            report["status"] = "success_changed"
        _emit(report, args.format)
        return 0
    except SyncError as exc:
        report = {
            "mode": args.mode,
            "status": "operational_failure",
            "changed_targets": [],
            "scanned_files": [],
            "facts": [],
            "findings": [],
            "writes": [],
            "errors": [{"code": str(exc).split(":", 1)[0], "message": str(exc)}],
        }
        _emit(report, args.format)
        return 3


if __name__ == "__main__":
    sys.exit(run())