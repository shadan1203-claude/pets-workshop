"""Core scope, extraction, validation, generation, and write primitives."""

from __future__ import annotations

import fnmatch
import json
import os
import re
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence


STATUS_VALUES = {"verified", "not_found", "contradictory"}
EVIDENCE_TYPES = {"source_code", "tests", "configuration", "not_found"}
SECRET_PATTERNS = (
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"(?i)(?:password|passwd|secret|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
)


class SyncError(Exception):
    """Base error for safe, user-facing synchronization failures."""


@dataclass(frozen=True)
class Manifest:
    root: Path
    generated_documentation: tuple[str, ...]
    source_roots: tuple[str, ...]
    excluded_paths: tuple[str, ...]
    required_fields: tuple[str, ...]
    status_values: tuple[str, ...]

    @classmethod
    def load(cls, path: Path) -> "Manifest":
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SyncError(f"MANIFEST_INVALID: {path}") from exc

        try:
            scope = data["scope"]
            policy = data["evidence_policy"]
            contract = data["documentation_contract"]
            generated = tuple(scope["generated_documentation"])
            source_roots = tuple(scope["source_roots"])
            excluded = tuple(scope["excluded_paths"])
            required = tuple(policy["required_fields"])
            statuses = tuple(policy["status_values"])
            schema = set(contract["section_schema"])
        except (KeyError, TypeError) as exc:
            raise SyncError("MANIFEST_INVALID: required scope or policy field missing") from exc

        if set(required) != {"status", "evidence", "notes", "source_files"}:
            raise SyncError("MANIFEST_INVALID: evidence fields do not match contract")
        if set(statuses) != STATUS_VALUES or schema != set(required):
            raise SyncError("MANIFEST_INVALID: evidence status or schema is invalid")
        if not generated or not source_roots:
            raise SyncError("MANIFEST_INVALID: source roots and targets are required")

        return cls(path.resolve().parent.parent, generated, source_roots, excluded, required, statuses)

    def _relative(self, path: Path) -> str:
        try:
            return path.resolve().relative_to(self.root.resolve()).as_posix()
        except ValueError as exc:
            raise SyncError(f"PATH_ESCAPE: {path}") from exc

    def is_excluded(self, path: Path) -> bool:
        relative = self._relative(path)
        return any(fnmatch.fnmatch(relative, pattern) for pattern in self.excluded_paths)

    def is_target(self, path: Path) -> bool:
        try:
            relative = self._relative(path)
        except SyncError:
            return False
        return relative in self.generated_documentation and not self.is_excluded(path)

    def authorize_target(self, path: Path) -> Path:
        resolved = path.resolve()
        if not self.is_target(resolved):
            raise SyncError(f"TARGET_NOT_APPROVED: {path}")
        if resolved.exists() and resolved.is_symlink():
            raise SyncError(f"TARGET_NOT_APPROVED: symlink target {path}")
        return resolved


@dataclass(frozen=True)
class EvidenceFact:
    key: str
    kind: str
    status: str
    evidence: str
    notes: str
    source_files: tuple[str, ...]
    evidence_type: str

    def as_dict(self) -> dict[str, object]:
        return {
            "key": self.key,
            "kind": self.kind,
            "status": self.status,
            "evidence": self.evidence,
            "notes": self.notes,
            "source_files": list(self.source_files),
            "evidence_type": self.evidence_type,
        }


@dataclass(frozen=True)
class ValidationFinding:
    code: str
    severity: str
    message: str
    target: str = ""
    section: str = ""
    source_files: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, object]:
        return {
            "code": self.code,
            "severity": self.severity,
            "message": self.message,
            "target": self.target,
            "section": self.section,
            "source_files": list(self.source_files),
        }


@dataclass(frozen=True)
class ValidationResult:
    findings: tuple[ValidationFinding, ...] = ()

    @property
    def valid(self) -> bool:
        return not any(finding.severity == "error" for finding in self.findings)


@dataclass(frozen=True)
class ScanResult:
    source_files: tuple[Path, ...]
    target_files: tuple[Path, ...]


class RepositoryScanner:
    """Discover only manifest-approved repository files and extract evidence."""

    def __init__(self, manifest: Manifest):
        self.manifest = manifest

    def discover(self) -> ScanResult:
        source_files: set[Path] = set()
        for root_name in self.manifest.source_roots:
            root = self.manifest.root / root_name
            if not root.is_dir():
                raise SyncError(f"SOURCE_MISSING: {root_name}")
            for path in root.rglob("*"):
                if path.is_file() and not self.manifest.is_excluded(path):
                    source_files.add(path.resolve())

        target_files = tuple(
            sorted(
                (self.manifest.root / target).resolve()
                for target in self.manifest.generated_documentation
                if (self.manifest.root / target).exists()
            )
        )
        return ScanResult(tuple(sorted(source_files)), target_files)

    def extract_facts(self, scan: ScanResult) -> tuple[EvidenceFact, ...]:
        facts: list[EvidenceFact] = []
        for path in scan.source_files:
            if path.suffix.lower() not in {".py", ".astro", ".ts", ".js", ".mjs", ".json", ".md"}:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                continue
            relative = path.relative_to(self.manifest.root).as_posix()
            facts.extend(self._extract_file_facts(relative, text))
        return tuple(sorted(facts, key=lambda fact: (fact.kind, fact.key, fact.source_files)))

    def _extract_file_facts(self, relative: str, text: str) -> list[EvidenceFact]:
        facts: list[EvidenceFact] = []
        route_pattern = re.compile(r"@app\.route\(\s*['\"]([^'\"]+)")
        for route in route_pattern.findall(text):
            methods_match = re.search(
                rf"@app\.route\(\s*['\"]{re.escape(route)}['\"][^)]*methods\s*=\s*\[([^]]+)",
                text,
            )
            methods = ", ".join(re.findall(r"['\"]([A-Z]+)['\"]", methods_match.group(1))) if methods_match else "GET"
            facts.append(EvidenceFact(
                key=f"route:{methods}:{route}",
                kind="route",
                status="verified",
                evidence=f"Flask route {methods} {route}",
                notes="Extracted from an application route decorator.",
                source_files=(relative,),
                evidence_type="source_code",
            ))

        for model in re.findall(r"^class\s+(\w+)\([^)]*(?:db\.Model|BaseModel)", text, re.MULTILINE):
            facts.append(EvidenceFact(
                key=f"model:{model}",
                kind="model",
                status="verified",
                evidence=f"SQLAlchemy model class {model}",
                notes="Extracted from a model declaration.",
                source_files=(relative,),
                evidence_type="source_code",
            ))

        for match in re.finditer(r"fetch\(\s*[`'\"]([^`'\"]+)", text):
            facts.append(EvidenceFact(
                key=f"fetch:{match.group(1)}:{relative}",
                kind="frontend_fetch",
                status="verified",
                evidence=f"Frontend fetches {match.group(1)}",
                notes="Extracted from a frontend data-fetch call.",
                source_files=(relative,),
                evidence_type="source_code",
            ))

        for test_name in re.findall(r"(?:test|it)\(['\"]([^'\"]+)", text):
            facts.append(EvidenceFact(
                key=f"test:{test_name}:{relative}",
                kind="test",
                status="verified",
                evidence=f"Test scenario: {test_name}",
                notes="Extracted from an executable test source.",
                source_files=(relative,),
                evidence_type="tests",
            ))
        return facts


def validate_facts(facts: Iterable[EvidenceFact], manifest: Manifest | None = None) -> ValidationResult:
    findings: list[ValidationFinding] = []
    for fact in facts:
        if fact.status not in STATUS_VALUES:
            findings.append(ValidationFinding("INVALID_STATUS", "error", f"Invalid status for {fact.key}."))
        if fact.evidence_type not in EVIDENCE_TYPES:
            findings.append(ValidationFinding("INVALID_EVIDENCE_TYPE", "error", f"Invalid evidence type for {fact.key}."))
        if not fact.source_files and fact.status != "not_found":
            findings.append(ValidationFinding("MISSING_PROVENANCE", "error", f"No provenance for {fact.key}."))
        if fact.status == "contradictory":
            findings.append(ValidationFinding("CONTRADICTORY_EVIDENCE", "error", f"Contradictory evidence for {fact.key}.", source_files=fact.source_files))
        if fact.status == "not_found" and "Not Found" not in (fact.evidence, fact.notes):
            findings.append(ValidationFinding("MISSING_NOT_FOUND", "error", f"Missing Not Found marker for {fact.key}."))
        if any(pattern.search(f"{fact.evidence}\n{fact.notes}") for pattern in SECRET_PATTERNS):
            findings.append(ValidationFinding("SECRET_DETECTED", "error", f"Sensitive value detected for {fact.key}."))
        if manifest and any(not (manifest.root / source).exists() for source in fact.source_files):
            findings.append(ValidationFinding("SOURCE_NOT_FOUND", "error", f"Provenance source missing for {fact.key}.", source_files=fact.source_files))
    return ValidationResult(tuple(findings))


def generate_markdown(facts: Sequence[EvidenceFact], title: str = "Generated Documentation Evidence") -> str:
    """Render stable Markdown from facts without making unsupported claims."""
    lines = [f"# {title}", "", "Generated from manifest-scoped repository evidence.", ""]
    for fact in sorted(facts, key=lambda item: (item.kind, item.key)):
        lines.extend([
            f"## {fact.kind}: {fact.key}",
            f"- Status: {fact.status}",
            f"- Evidence: {fact.evidence}",
            f"- Notes: {fact.notes}",
            f"- Source files: {', '.join(fact.source_files) if fact.source_files else 'Not Found'}",
            "",
        ])
    return "\n".join(lines)


class AtomicDocumentationWriter:
    """Apply one or more approved targets while restoring originals on failure."""

    def __init__(self, manifest: Manifest):
        self.manifest = manifest

    def write_all(self, outputs: dict[Path, str]) -> None:
        targets = {self.manifest.authorize_target(path): content for path, content in outputs.items()}
        temporary: dict[Path, Path] = {}
        backups: dict[Path, Path | None] = {}
        replaced: list[Path] = []
        try:
            for target, content in targets.items():
                target.parent.mkdir(parents=True, exist_ok=True)
                handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=target.parent, delete=False)
                try:
                    handle.write(content)
                finally:
                    handle.close()
                temporary[target] = Path(handle.name)

            for target in targets:
                backup = None
                if target.exists():
                    backup_handle = tempfile.NamedTemporaryFile("wb", dir=target.parent, delete=False)
                    backup_handle.close()
                    backup = Path(backup_handle.name)
                    backup.write_bytes(target.read_bytes())
                backups[target] = backup
                os.replace(temporary[target], target)
                replaced.append(target)
        except OSError as exc:
            for target in reversed(replaced):
                backup = backups.get(target)
                if backup and backup.exists():
                    os.replace(backup, target)
                elif target.exists():
                    target.unlink()
            raise SyncError("ATOMIC_WRITE_FAILED") from exc
        finally:
            for path in temporary.values():
                if path.exists():
                    path.unlink()
            for path in backups.values():
                if path and path.exists():
                    path.unlink()