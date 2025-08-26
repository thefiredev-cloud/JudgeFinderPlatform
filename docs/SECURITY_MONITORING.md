# 🔒 Security Monitoring Setup Guide

## Overview
Comprehensive security monitoring setup for the JudgeFinder platform to detect and prevent unauthorized access after key rotation.

## 📊 Monitoring Dashboard Links

### Service-Specific Monitoring
| Service | Dashboard URL | What to Monitor |
|---------|--------------|-----------------|
| **Stripe** | https://dashboard.stripe.com/logs/events | Payment attempts, API calls, webhook events |
| **OpenAI** | https://platform.openai.com/usage | Token usage, API calls, spending |
| **Supabase** | https://app.supabase.com/project/[id]/logs | Database queries, auth attempts, API calls |
| **Clerk** | https://dashboard.clerk.com/apps/[id]/logs | Login attempts, user sessions, API usage |
| **SendGrid** | https://app.sendgrid.com/statistics | Email sends, bounces, blocks |
| **Netlify** | https://app.netlify.com/sites/[site]/functions | Function invocations, errors, logs |
| **Upstash** | https://console.upstash.com/redis/[id]/metrics | Rate limit hits, cache usage |
| **Sentry** | https://sentry.io/organizations/[org]/issues/ | Application errors, performance |

## 🚨 Alert Configuration

### 1. Stripe Alerts
```javascript
// Webhook endpoint for monitoring
app.post('/webhooks/stripe-monitor', (req, res) => {
  const event = req.body;
  
  // Alert on suspicious events
  if (event.type === 'charge.failed' || 
      event.type === 'payment_intent.payment_failed') {
    sendAlert('Stripe payment failure detected', event);
  }
  
  // Monitor for unexpected charges
  if (event.type === 'charge.succeeded' && 
      event.data.object.amount > EXPECTED_MAX_CHARGE) {
    sendAlert('Unexpected large charge detected', event);
  }
});
```

**Setup in Stripe Dashboard:**
1. Go to Developers → Webhooks
2. Add endpoint: `https://judgefinder.com/webhooks/stripe-monitor`
3. Select events:
   - `charge.succeeded`
   - `charge.failed`
   - `customer.created`
   - `payment_intent.succeeded`

### 2. OpenAI Usage Monitoring
```javascript
// Monitor API usage
const monitorOpenAIUsage = async () => {
  const usage = await getOpenAIUsage();
  
  if (usage.total_tokens > DAILY_TOKEN_LIMIT) {
    sendAlert('OpenAI token limit exceeded', {
      used: usage.total_tokens,
      limit: DAILY_TOKEN_LIMIT
    });
  }
  
  if (usage.total_cost > DAILY_COST_LIMIT) {
    sendAlert('OpenAI cost limit exceeded', {
      cost: usage.total_cost,
      limit: DAILY_COST_LIMIT
    });
  }
};

// Run every hour
setInterval(monitorOpenAIUsage, 3600000);
```

### 3. Database Access Monitoring (Supabase)
```sql
-- Create audit table
CREATE TABLE security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_time TIMESTAMP DEFAULT NOW(),
  user_id TEXT,
  action TEXT,
  table_name TEXT,
  query TEXT,
  ip_address INET,
  suspicious BOOLEAN DEFAULT FALSE
);

-- Trigger for suspicious activity
CREATE OR REPLACE FUNCTION log_suspicious_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    -- Bulk deletes
    (TG_OP = 'DELETE' AND TG_NROWS > 100) OR
    -- After hours access
    (EXTRACT(HOUR FROM NOW()) NOT BETWEEN 6 AND 22) OR
    -- Sensitive table access
    (TG_TABLE_NAME IN ('users', 'payments', 'api_keys'))
  ) THEN
    INSERT INTO security_audit_log (
      user_id, action, table_name, suspicious
    ) VALUES (
      current_user, TG_OP, TG_TABLE_NAME, TRUE
    );
    
    -- Send alert
    PERFORM pg_notify('security_alert', 
      format('Suspicious activity: %s on %s', TG_OP, TG_TABLE_NAME)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Authentication Monitoring (Clerk)
```javascript
// Monitor failed login attempts
const monitorAuthAttempts = async () => {
  const recentAttempts = await clerk.sessions.list({
    status: 'failed',
    createdAfter: Date.now() - 3600000 // Last hour
  });
  
  // Group by IP
  const byIP = {};
  recentAttempts.forEach(attempt => {
    const ip = attempt.client_ip;
    byIP[ip] = (byIP[ip] || 0) + 1;
  });
  
  // Alert on suspicious IPs
  Object.entries(byIP).forEach(([ip, count]) => {
    if (count > 5) {
      sendAlert('Multiple failed login attempts', {
        ip,
        attempts: count,
        action: 'Consider blocking IP'
      });
    }
  });
};
```

## 📈 Key Performance Indicators (KPIs)

### Security Metrics to Track
```javascript
const securityKPIs = {
  // Authentication
  failedLogins: 0,
  suspiciousIPs: [],
  newUserRegistrations: 0,
  
  // API Usage
  apiCallsPerMinute: 0,
  unauthorizedAPICalls: 0,
  rateLimitHits: 0,
  
  // Database
  suspiciousQueries: 0,
  bulkOperations: 0,
  afterHoursAccess: 0,
  
  // Payments
  failedCharges: 0,
  chargebacks: 0,
  unusualAmounts: 0,
  
  // Errors
  error500Count: 0,
  error401Count: 0,
  criticalErrors: []
};

// Update dashboard every 5 minutes
setInterval(updateSecurityDashboard, 300000);
```

## 🔔 Alert Channels Setup

### 1. Email Alerts (SendGrid)
```javascript
const sendEmailAlert = async (subject, body) => {
  const msg = {
    to: 'security@judgefinder.com',
    from: 'alerts@judgefinder.com',
    subject: `[SECURITY] ${subject}`,
    html: body
  };
  
  await sgMail.send(msg);
};
```

### 2. Slack Integration
```javascript
const sendSlackAlert = async (message, level = 'warning') => {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  const color = {
    info: '#36a64f',
    warning: '#ff9900',
    danger: '#ff0000'
  }[level];
  
  await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify({
      attachments: [{
        color,
        title: 'Security Alert',
        text: message,
        footer: 'JudgeFinder Security',
        ts: Date.now() / 1000
      }]
    })
  });
};
```

### 3. SMS Alerts (Twilio)
```javascript
const sendSMSAlert = async (message) => {
  if (message.priority === 'critical') {
    await twilioClient.messages.create({
      body: `URGENT: ${message}`,
      from: process.env.TWILIO_PHONE,
      to: process.env.SECURITY_PHONE
    });
  }
};
```

## 🛡️ Automated Response Actions

### 1. Rate Limiting Implementation
```javascript
// lib/security/rateLimiter.js
const rateLimit = {
  api: new Map(),
  
  check: function(ip, limit = 100) {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!this.api.has(ip)) {
      this.api.set(ip, []);
    }
    
    const requests = this.api.get(ip)
      .filter(time => time > windowStart);
    
    if (requests.length >= limit) {
      // Auto-block IP
      blockIP(ip, 'Rate limit exceeded');
      return false;
    }
    
    requests.push(now);
    this.api.set(ip, requests);
    return true;
  }
};
```

### 2. Automatic Key Rotation
```javascript
// Rotate keys if compromise detected
const autoRotateKeys = async (service) => {
  console.log(`Auto-rotating keys for ${service}`);
  
  // Generate new key
  const newKey = generateSecureKey();
  
  // Update in Netlify
  await updateNetlifyEnvVar(service + '_KEY', newKey);
  
  // Invalidate old key
  await invalidateOldKey(service);
  
  // Send notification
  sendAlert('Keys auto-rotated', {
    service,
    reason: 'Suspicious activity detected',
    action: 'Please verify new key is working'
  });
};
```

### 3. IP Blocking
```javascript
// Netlify edge function for IP blocking
export default async (request, context) => {
  const ip = context.ip;
  const blockedIPs = await getBlockedIPs();
  
  if (blockedIPs.includes(ip)) {
    return new Response('Access Denied', { status: 403 });
  }
  
  return context.next();
};
```

## 📊 Security Dashboard Code
```javascript
// app/admin/security/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    // Fetch security metrics
    const fetchMetrics = async () => {
      const res = await fetch('/api/admin/security/metrics');
      const data = await res.json();
      setMetrics(data);
    };
    
    // Fetch recent alerts
    const fetchAlerts = async () => {
      const res = await fetch('/api/admin/security/alerts');
      const data = await res.json();
      setAlerts(data);
    };
    
    fetchMetrics();
    fetchAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics();
      fetchAlerts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="security-dashboard">
      <h1>Security Monitoring</h1>
      
      <div className="metrics-grid">
        <MetricCard
          title="Failed Logins (24h)"
          value={metrics.failedLogins}
          threshold={10}
        />
        <MetricCard
          title="API Errors"
          value={metrics.apiErrors}
          threshold={50}
        />
        <MetricCard
          title="Suspicious IPs"
          value={metrics.suspiciousIPs?.length}
          threshold={5}
        />
        <MetricCard
          title="Rate Limit Hits"
          value={metrics.rateLimitHits}
          threshold={100}
        />
      </div>
      
      <div className="alerts-list">
        <h2>Recent Alerts</h2>
        {alerts.map(alert => (
          <Alert key={alert.id} {...alert} />
        ))}
      </div>
    </div>
  );
}
```

## 🔍 Log Analysis Queries

### Netlify Function Logs
```bash
# Check for errors
netlify functions:log judge-finder-platform --level error

# Monitor specific function
netlify functions:log judge-finder-platform --function api-judges-list

# Export logs for analysis
netlify functions:log judge-finder-platform --json > logs.json
```

### Supabase SQL Queries
```sql
-- Find suspicious queries
SELECT * FROM security_audit_log 
WHERE suspicious = TRUE 
ORDER BY event_time DESC 
LIMIT 100;

-- Check for bulk operations
SELECT user_id, COUNT(*) as operations
FROM security_audit_log
WHERE event_time > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100;

-- Find after-hours access
SELECT * FROM security_audit_log
WHERE EXTRACT(HOUR FROM event_time) NOT BETWEEN 6 AND 22
ORDER BY event_time DESC;
```

## ✅ Security Monitoring Checklist

### Daily Tasks
- [ ] Review security dashboard
- [ ] Check for failed login attempts
- [ ] Monitor API usage limits
- [ ] Review error logs
- [ ] Check payment anomalies

### Weekly Tasks
- [ ] Analyze usage patterns
- [ ] Review blocked IPs
- [ ] Audit user permissions
- [ ] Check for unusual database queries
- [ ] Review third-party service usage

### Monthly Tasks
- [ ] Full security audit
- [ ] Review and update alerts
- [ ] Test incident response
- [ ] Update security documentation
- [ ] Rotate non-critical keys

## 🚨 Incident Response Plan

### Level 1: Suspicious Activity
1. Log the event
2. Send email notification
3. Monitor for escalation

### Level 2: Potential Breach
1. Send immediate alerts (Email + Slack)
2. Temporarily increase monitoring
3. Review recent logs
4. Consider rate limiting

### Level 3: Confirmed Breach
1. **Immediate Actions:**
   - Send critical alerts (Email + Slack + SMS)
   - Rotate affected keys
   - Block suspicious IPs
   - Enable maintenance mode if needed

2. **Investigation:**
   - Export all logs
   - Identify attack vector
   - Assess damage
   - Document timeline

3. **Recovery:**
   - Patch vulnerabilities
   - Restore from backups if needed
   - Update security measures
   - Notify affected users (if required)

4. **Post-Incident:**
   - Complete incident report
   - Update security procedures
   - Implement additional monitoring
   - Schedule security review

## 📞 Emergency Contacts

| Role | Contact | When to Contact |
|------|---------|----------------|
| Security Lead | security@judgefinder.com | All security incidents |
| DevOps | devops@judgefinder.com | Infrastructure issues |
| Legal | legal@judgefinder.com | Data breach concerns |
| Stripe Support | https://support.stripe.com | Payment issues |
| Netlify Support | https://www.netlify.com/support | Hosting issues |

---

**Remember:** Early detection and rapid response are key to minimizing security incidents. Monitor actively and respond quickly!