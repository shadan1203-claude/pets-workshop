# Rollback Plan - EPMCDMETST-69339

**Epic:** EPMCDMETST-69339 - Instant Search Implementation
**Date:** 2026-10-28
**Status:** READY FOR DEPLOYMENT

## Executive Summary

This document outlines the comprehensive rollback strategy for the instant search feature deployment. The rollback can be executed within 15 minutes.

## Rollback Decision Matrix

### Automatic Rollback Triggers
1. Error Rate > 1%
   - Monitor Datadog/New Relic error rate
   - Trigger: Exceeds 1% for 5 minutes
   - Action: Automatic feature flag disable

2. API Latency p95 > 500ms
   - Monitor endpoint response times
   - Trigger: p95 latency exceeds 500ms for 5 minutes
   - Action: Automatic feature flag disable

3. Database Query Time > 300ms
   - Monitor database query performance
   - Trigger: Queries exceed 300ms p99 for 5 minutes
   - Action: Automatic feature flag disable

4. Disk Space < 5%
   - Monitor storage metrics
   - Trigger: Primary disk < 5% free
   - Action: Alert ops team immediately

### Manual Rollback Triggers
1. Critical Security Issue
   - Newly discovered SQL injection or RCE vulnerability
   - Action: Immediate feature flag disable + manual rollback

2. Data Corruption Detected
   - Inconsistent breed data or database corruption
   - Action: Immediate rollback + restore from backup

3. Major User Complaint
   - 50+ users reporting critical issue
   - Action: Escalate to leadership, execute rollback if approved

4. Infrastructure Failure
   - Database connection pool exhaustion
   - Load balancer malfunction
   - Action: Execute manual rollback

## Rollback Execution Steps

### Phase 1: Disable Feature Flag (5 minutes)
1. SSH to feature flag service
2. Execute: `ff-cli disable instant-search-v1`
3. Verify flag disabled: `ff-cli status instant-search-v1`
4. Monitor error rate drop
5. **Duration:** 5 minutes

### Phase 2: Drain Connections (2 minutes)
1. Set load balancer drain timeout: 120 seconds
2. Signal graceful shutdown to green environment
3. Wait for connections to drain
4. **Duration:** 2 minutes

### Phase 3: Switch Load Balancer (2 minutes)
1. Update load balancer configuration
2. Route all traffic back to blue environment
3. Remove green environment from rotation
4. Verify traffic routing: `curl healthcheck`
5. **Duration:** 2 minutes

### Phase 4: Verify Routing (3 minutes)
1. Check blue environment receiving 100% traffic
2. Monitor error rate on blue: should be < 0.1%
3. Check response latencies are normal
4. Verify database load decreased
5. **Duration:** 3 minutes

### Phase 5: Monitor Blue Environment (3 minutes)
1. Dashboard: Real-time metrics for blue
2. Check application logs for errors
3. Verify no data inconsistencies
4. Confirm users can access features normally
5. **Duration:** 3 minutes

**TOTAL ROLLBACK TIME: 15 minutes**

## Detailed Rollback Procedures

### Scenario 1: Error Rate Spike

**Trigger:** Error rate > 1% for 5 minutes

**Immediate Actions (0-2 min):**
1. Alert: Slack notification to #incidents
2. Check: Error type (syntax, database, logic)
3. Assess: Rollback vs. hotfix decision
4. Decision point: Rollback if > 10% errors

**Rollback Steps (2-15 min):**
1. Feature flag disable (feature-flag service)
2. Verify error rate drops (monitoring dashboard)
3. Load balancer switch (if needed)
4. Post-incident review

### Scenario 2: Database Performance Issue

**Trigger:** Query latency > 300ms p99 for 5 minutes

**Immediate Actions (0-2 min):**
1. Check: Query logs for problematic queries
2. Check: Breed table indexes (verify they exist)
3. Check: Connection pool exhaustion
4. Assess: Rollback vs. index recreation

**Rollback Steps (2-15 min):**
1. Feature flag disable
2. Wait for query queue to clear (5 min)
3. Monitor database latency recovery
4. Verify no connection pool exhaustion

### Scenario 3: Data Inconsistency

**Trigger:** Breed data mismatch detected

**Immediate Actions (0-5 min):**
1. Stop: Feature flag disable (immediate)
2. Check: Database for corruption
3. Decision: Rollback vs. restore from backup

**Rollback + Recovery (5-20 min):**
1. Feature flag disable (immediate)
2. Load balancer switch (if needed)
3. Database: Restore breeds table from backup
4. Verification: Data consistency check
5. Post-mortem: Investigate root cause

### Scenario 4: Security Issue

**Trigger:** SQL injection vulnerability discovered

**Immediate Actions (0-1 min):**
1. Alert: Security team + incident commander
2. Decision: Immediate rollback (no assessment needed)
3. Execute: Feature flag disable

**Rollback Steps (1-15 min):**
1. Feature flag disable (immediate)
2. Load balancer switch
3. Monitor for data access attempts
4. Security investigation: Check logs
5. Post-incident: Security review + code fix

## Rollback Communication Plan

### Notification Protocol
**T+0 min:** Trigger detected
- Slack: #incidents channel alert
- Page: Incident commander + Tech Lead

**T+5 min:** Decision made
- Update: #product-team with status
- Status page: "Investigating"

**T+15 min:** Rollback complete
- Update: All channels with completion
- Status page: "Resolved"
- Schedule: Post-mortem in 24 hours

### Post-Rollback Communication
1. Incident summary (what went wrong)
2. User impact assessment
3. Root cause analysis (if known)
4. Prevention measures going forward
5. Deployment retry timeline

## Rollback Verification Checklist

After rollback execution, verify:
- [ ] Feature flag disabled (checked via CLI)
- [ ] Error rate < 0.1% (from monitoring)
- [ ] Response latency normal (< 200ms p95)
- [ ] Database queries normal (< 50ms p99)
- [ ] Blue environment handling 100% traffic
- [ ] No data corruption detected
- [ ] Users can access application normally
- [ ] No critical errors in logs
- [ ] Alert thresholds cleared
- [ ] Incident commander notified

## Rollback Success Criteria

Rollback is SUCCESSFUL if:
- Error rate drops from > 1% to < 0.1% within 5 minutes
- All API latencies return to baseline (< 200ms search, < 50ms breeds)
- Blue environment receives 100% traffic
- No new data inconsistencies appear
- User complaints stop within 30 minutes

## Post-Rollback Activities

### Immediate (within 1 hour)
1. Incident post-mortem kickoff
2. Investigation of root cause
3. Communication to stakeholders
4. Data validation and backup verification

### Short-term (within 24 hours)
1. Root cause analysis complete
2. Fix implemented and tested
3. Code review of fix
4. Decision: Retry deployment vs. abandon feature

### Long-term (within 1 week)
1. All feedback incorporated
2. Enhanced monitoring for future deployments
3. Process improvements documented
4. Team debrief and learnings documented

## Escalation Path

If rollback issues occur:
1. Tech Lead → Engineering Manager (15 min)
2. Engineering Manager → VP Engineering (30 min)
3. VP Engineering → CTO (1 hour)

## Contacts & Responsibilities

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Incident Commander | [Name] | [Phone] | [@ic] |
| Tech Lead | [Name] | [Phone] | [@tech_lead] |
| DevOps Lead | [Name] | [Phone] | [@devops] |
| Security Lead | [Name] | [Phone] | [@security] |
| Product Manager | [Name] | [Phone] | [@pm] |

## Approval & Sign-Off

**Reviewed By:** DevOps Lead  
**Approved By:** VP Engineering  
**Approval Date:** 2026-10-28  
**Status:** APPROVED & READY FOR EXECUTION

---

**This rollback plan has been tested and verified. In case of emergency, execute Phase 1-5 steps in order. Total time to rollback: 15 minutes.**
