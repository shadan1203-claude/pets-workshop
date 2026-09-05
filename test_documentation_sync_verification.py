import json
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / ".github" / "documentation-sync-manifest.json"
SKILL_PATH = ROOT / ".github" / "skills" / "documentation-sync" / "SKILL.md"
PROMPT_PATH = ROOT / ".github" / "prompts" / "automated-documentation-sync.prompt.md"


class TestDocumentationSyncVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with MANIFEST_PATH.open("r", encoding="utf-8") as manifest_file:
            cls.manifest = json.load(manifest_file)
        cls.skill = SKILL_PATH.read_text(encoding="utf-8")
        cls.prompt = PROMPT_PATH.read_text(encoding="utf-8")

    def test_approved_documentation_targets_exist(self):
        targets = self.manifest["scope"]["generated_documentation"]

        for target in targets:
            self.assertTrue((ROOT / target).is_file(), target)

    def test_configured_source_roots_exist(self):
        source_roots = self.manifest["scope"]["source_roots"]

        for source_root in source_roots:
            self.assertTrue((ROOT / source_root).is_dir(), source_root)

    def test_excluded_paths_are_not_documentation_targets(self):
        targets = set(self.manifest["scope"]["generated_documentation"])

        for excluded_path in self.manifest["scope"]["excluded_paths"]:
            self.assertNotIn(excluded_path, targets)

        self.assertNotIn("app/server/app.py", targets)
        self.assertNotIn("app/client/src", targets)

    def test_manifest_contract_requires_provenance_and_not_found(self):
        rules = self.manifest["rules"]
        policy = self.manifest["evidence_policy"]
        contract = self.manifest["documentation_contract"]

        self.assertTrue(rules["require_provenance"])
        self.assertTrue(rules["not_found_output_required"])
        self.assertTrue(rules["atomic_write_required"])
        self.assertFalse(rules["allow_write_to_source_code"])
        self.assertTrue(policy["provenance_required"])
        self.assertEqual(policy["missing_evidence_value"], "Not Found")
        self.assertEqual(policy["contradictory_evidence_mode"], "fail_validation")
        self.assertEqual(
            contract["validation_mode"],
            "fail_on_missing_provenance_or_contradiction",
        )

    def test_evidence_contract_contains_required_fields_and_statuses(self):
        policy = self.manifest["evidence_policy"]
        contract_fields = set(self.manifest["documentation_contract"]["section_schema"])

        self.assertEqual(
            set(policy["required_fields"]),
            {"status", "evidence", "notes", "source_files"},
        )
        self.assertEqual(contract_fields, {"status", "evidence", "notes", "source_files"})
        self.assertEqual(
            set(policy["status_values"]),
            {"verified", "not_found", "contradictory"},
        )
        self.assertIn("not_found", policy["accepted_evidence_types"])

    def test_reusable_workflow_assets_state_required_safety_rules(self):
        workflow_text = f"{self.skill}\n{self.prompt}"

        required_phrases = (
            "Do not modify application source code",
            "Not Found",
            "Never expose secrets",
            "Validate generated documentation",
            "approved documentation subset",
        )

        for phrase in required_phrases:
            self.assertIn(phrase, workflow_text)

    def test_approved_documentation_has_no_common_secret_patterns(self):
        secret_patterns = (
            r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
            r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b",
            r"\bAKIA[0-9A-Z]{16}\b",
            r"(?i)(?:password|passwd|secret|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]",
        )
        target_text = "\n".join(
            (ROOT / target).read_text(encoding="utf-8")
            for target in self.manifest["scope"]["generated_documentation"]
        )

        for pattern in secret_patterns:
            self.assertIsNone(re.search(pattern, target_text), pattern)


if __name__ == "__main__":
    unittest.main()