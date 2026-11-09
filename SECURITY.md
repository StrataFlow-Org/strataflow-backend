# Security Policy

## 🔒 Reporting Security Vulnerabilities

The StrataFlow team takes API security, server-side infrastructure integrity, and SEP-10 authentication protection seriously. If you discover a vulnerability or potential exploit in the backend:

**Please DO NOT open a public issue.**

Instead, report it responsibly to:
- **Email**: `security@strataflow.io`
- **Subject**: `[Security Vulnerability]: StrataFlow Backend`

### Please Include in Your Report:
1. **Description**: Concise summary of the vulnerability and attack vector.
2. **Proof of Concept**: Minimal HTTP request, script, or test case to reproduce.
3. **Impact**: Evaluation of potential harm (e.g. SSRF to internal network, JWT forgery, unauthorized webhook modification, denial of service).
4. **Remediation**: Suggested patch or architectural defense if available.

### Response SLA
- **Initial Acknowledgment**: Within 24-48 hours.
- **Triage & Remediation Timeline**: Within 5-7 business days for high or critical severity issues.
- **Public Disclosure**: Coordinated following patch deployment.

---

## 🛡️ Built-in Security Controls

1. **SSRF Filtering**: Webhook registrations are filtered through strict IP and hostname blacklists before storage and before dispatch.
2. **Cryptographic Signatures**: All outbound webhooks are signed using HMAC-SHA256 with timestamp tolerance windows.
3. **Strict SEP-10 Auth**: Challenge transactions are cryptographically signed by the server's Ed25519 keypair and time-bounded.
4. **Credential Redaction**: High-entropy seeds (`S...`) and authorization headers are recursively stripped from server logs.
