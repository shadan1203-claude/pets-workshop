Testing Skill
Purpose
Verify implementation quality and generate comprehensive test design artifacts before implementation begins.

Responsibilities
Create:

Test Design Artifacts
Positive Test Cases
Negative Test Cases
Edge Case Test Cases
Unit Test Scenarios
Integration Test Scenarios
End-to-End (E2E) Test Scenarios
Acceptance Criteria Mapping
Validation Artifacts
Unit Tests
Integration Tests
Negative Tests
Edge Case Tests
Input
Jira Story Requirements
Acceptance Criteria
Generated Source Code
Outputs
Test Design Document
Generate:

docs/<JIRA_ID>/test-cases.md

The document must contain:

Field	Description
Test ID	Unique identifier
Scenario	Test description
Expected Result	Expected outcome
Requirement Mapping	Jira AC mapping
Include:

Positive Test Cases
Negative Test Cases
Edge Cases
Unit Test Scenarios
Integration Test Scenarios
E2E Test Scenarios
Acceptance Criteria Mapping


Test Skeleton File
Generate:

tests/<JIRA_ID>/tasks.test.js

The file must contain:

describe blocks
positive tests
negative tests
edge case tests
TODO placeholders for implementation
Example Structure:

describe('EPMCDMETST-70332', () => {

  describe('Positive Cases', () => {

    test('should display favorite badge', () => {
      // TODO
    });

    test('should persist favorite marker after refresh', () => {
      // TODO
    });

  });

  describe('Negative Cases', () => {

    test('should ignore malformed localStorage', () => {
      // TODO
    });

    test('should ignore null values', () => {
      // TODO
    });

  });

  describe('Edge Cases', () => {

    test('should handle empty array', () => {
      // TODO
    });

    test('should handle 1000 favorites', () => {
      // TODO
    });

  });

  describe('Acceptance Criteria Mapping', () => {

    test('AC1', () => {
      // TODO
    });

    test('AC2', () => {
      // TODO
    });

  });

});