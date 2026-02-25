# Assumption Register (Gate A) - 2026-02-25

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Every planning run can be uniquely traced | missing traceId | SSE + persisted log audit | Engineering |
| 2 | Tool failures are observable | no failed tool event | simulate tool error path | Engineering |
| 3 | Retry should happen only for transient issues | retries on permanent failures | unit test retry classifier | Engineering |
| 4 | JSON repair can recover malformed model output | second parse still fails | unit + manual malformed response check | Engineering |
| 5 | Research output can be low-confidence | empty options arrays | unit test low-confidence detector | Engineering |
| 6 | User timeline should hide sensitive payloads | prompt/args shown by default | UI inspection in non-debug mode | Engineering |
| 7 | Debug payloads are still needed for diagnosis | no deep details available | UI inspection in debug mode | Engineering |
| 8 | Confirmation conflicts must be blocked | invalid option accepted | API validation test | Engineering |
| 9 | Final decision needs explicit reject path | no reject action in UI | UI flow test | Engineering |
| 10 | Replay by traceId must work post-run | trace endpoint returns empty | call `/api/traces/:traceId` after run | Engineering |
