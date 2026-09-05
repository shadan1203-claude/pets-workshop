import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / ".github" / "documentation-sync-manifest.json"


class TestDocumentationSyncManifest(unittest.TestCase):
    def read_manifest(self):
        with MANIFEST_PATH.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def test_manifest_exists_and_is_valid_json(self):
        manifest = self.read_manifest()
        self.assertEqual(
            manifest["scope"]["description"],
            "Approved technical documentation targets for Automated Documentation Sync",
        )

    def test_manifest_only_allows_approved_targets(self):
        manifest = self.read_manifest()
        approved = set(manifest["scope"]["generated_documentation"])

        self.assertIn("README.md", approved)
        self.assertIn("architecture.md", approved)
        self.assertNotIn("content/README.md", approved)
        self.assertNotIn("app/server/app.py", approved)

    def test_manifest_enforces_safety_rules(self):
        manifest = self.read_manifest()
        rules = manifest["rules"]

        self.assertTrue(rules["require_provenance"])
        self.assertFalse(rules["allow_write_to_source_code"])
        self.assertTrue(rules["not_found_output_required"])
        self.assertTrue(rules["atomic_write_required"])

    def test_manifest_defines_evidence_policy(self):
        manifest = self.read_manifest()
        policy = manifest["evidence_policy"]

        self.assertTrue(policy["provenance_required"])
        self.assertEqual(policy["missing_evidence_value"], "Not Found")
        self.assertEqual(policy["contradictory_evidence_mode"], "fail_validation")
        self.assertIn("status", policy["required_fields"])
        self.assertIn("evidence", policy["required_fields"])
        self.assertIn("source_files", policy["required_fields"])
        self.assertIn("source_code", policy["accepted_evidence_types"])

    def test_manifest_defines_documentation_contract(self):
        manifest = self.read_manifest()
        contract = manifest["documentation_contract"]

        self.assertEqual(
            contract["validation_mode"],
            "fail_on_missing_provenance_or_contradiction",
        )
        self.assertIn("status", contract["section_schema"])
        self.assertIn("evidence", contract["section_schema"])
        self.assertIn("source_files", contract["section_schema"])


if __name__ == "__main__":
    unittest.main()
