import json
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / ".github" / "documentation-sync-manifest.json"
BACKEND_PATH = ROOT / "app" / "server" / "app.py"


class TestDocumentationQuality(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with MANIFEST_PATH.open("r", encoding="utf-8") as manifest_file:
            cls.manifest = json.load(manifest_file)

        cls.documentation = {
            path: (ROOT / path).read_text(encoding="utf-8")
            for path in cls.manifest["scope"]["generated_documentation"]
        }
        cls.architecture = cls.documentation["architecture.md"]
        cls.backend = BACKEND_PATH.read_text(encoding="utf-8")

    def test_architecture_contains_required_sections(self):
        required_sections = (
            "## Context",
            "## Goals",
            "## Existing System",
            "## Proposed Architecture",
            "## Components",
            "## Data Flow",
            "## Error Handling",
            "## Security",
            "## Testing Strategy",
            "## Deployment/CI Considerations",
        )

        for section in required_sections:
            self.assertIn(section, self.architecture)

    def test_documentation_claims_match_current_repository_structure(self):
        combined = "\n".join(self.documentation.values())
        expected_claims = {
            "Flask": "app/server/app.py",
            "SQLAlchemy": "app/server/models",
            "Astro": "app/client/src",
            "Playwright": "app/client/e2e-tests",
        }

        for claim, source_path in expected_claims.items():
            self.assertIn(claim, combined)
            self.assertTrue((ROOT / source_path).exists(), source_path)

    def test_documentation_endpoint_references_match_current_routes(self):
        route_pattern = re.compile(r"@app\.route\(\s*['\"]([^'\"]+)")
        documented_endpoint_pattern = re.compile(r"(?<![A-Za-z0-9_])(/(?:api/[^\s`)'\"]+|health))")

        current_routes = set(route_pattern.findall(self.backend))
        documented_endpoints = set(
            documented_endpoint_pattern.findall("\n".join(self.documentation.values()))
        )

        self.assertTrue(current_routes)
        self.assertTrue(current_routes.issuperset(documented_endpoints))

    def test_unavailable_information_uses_not_found_policy(self):
        policy_text = self.architecture + "\n" + self.documentation["impl-plan.md"]

        self.assertIn("Status: Not Found", policy_text)
        self.assertIn("Evidence: Not Found", policy_text)
        self.assertIn("Missing evidence", policy_text)

    def test_documentation_contract_requires_provenance_and_required_fields(self):
        policy = self.manifest["evidence_policy"]
        schema = self.manifest["documentation_contract"]["section_schema"]
        required_fields = {"status", "evidence", "notes", "source_files"}

        self.assertTrue(policy["provenance_required"])
        self.assertEqual(set(policy["required_fields"]), required_fields)
        self.assertEqual(set(schema), required_fields)

    def test_documentation_contains_no_common_secret_patterns(self):
        secret_patterns = (
            r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
            r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b",
            r"\bAKIA[0-9A-Z]{16}\b",
            r"(?i)(?:password|passwd|secret|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]",
        )
        combined = "\n".join(self.documentation.values())

        for pattern in secret_patterns:
            self.assertIsNone(re.search(pattern, combined), pattern)


if __name__ == "__main__":
    unittest.main()