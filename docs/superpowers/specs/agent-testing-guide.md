# Agent System — Testing Guide

Cara test tiap endpoint + expected output. Jalanin di local atau setelah deploy.

## 1. Task CRUD (Fase 1)

```bash
# Create task
curl -s -X POST http://localhost:3000/api/agents/tasks \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"coo","title":"test task","description":"testing"}'
```
**Success:** `{"id":"uuid-here","agent_id":"coo","title":"test task","status":"pending",...}` (HTTP 201)
**Fail:** `{"error":"agent_id and title are required"}` (HTTP 400)

```bash
# List tasks
curl -s http://localhost:3000/api/agents/tasks | python3 -m json.tool | head -5
```
**Success:** `[{ "id": "uuid", "agent_id": "coo", ... }]` — array of tasks

```bash
# Update task status
curl -s -X PATCH http://localhost:3000/api/agents/tasks/<TASK_ID> \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```
**Success:** `{"success":true}`
**Fail:** `{"error":"Task not found"}` (HTTP 404 — kalo ID salah)

## 2. Memory (Fase 1)

```bash
# Set memory
curl -s -X POST http://localhost:3000/api/agents/memory \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"coo","key":"test","value":"hello"}'
```
**Success:** `{"success":true}` (HTTP 201)

```bash
# Get memory
curl -s "http://localhost:3000/api/agents/memory?agent_id=coo&key=test"
```
**Success:** `{"key":"test","value":"hello"}`
**Fail:** `{"error":"agent_id and key are required"}` (HTTP 400 — kalo params kosong)

## 3. COO Standup (Fase 2)

```bash
curl -s -X POST http://localhost:3000/api/agents/coo/standup
```
**Success:** `{"summary":"Priorities for today: 1. ... 2. ..."}` (HTTP 200, summary dari Groq)
**Notes:** Butuh `GROQ_API_KEY` di env. Kalo ga ada → HTTP 500.

## 4. COO Status (Fase 2)

```bash
curl -s http://localhost:3000/api/agents/coo/status | python3 -m json.tool
```
**Success:**
```json
{
  "today": [ { "action": "daily_cycle_started", ... } ],
  "pendingTasks": [],
  "inProgressTasks": []
}
```

## 5. COO Ask (Fase 2)

```bash
curl -s -X POST http://localhost:3000/api/agents/coo/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"apa yg terjadi hari ini?"}'
```
**Success:** `{"answer":"Hari ini Hacker lagi ngerjain task X, tidak ada pending task..."}`
**Fail:** `{"error":"query is required"}` (kalo body kosong)

## 6. COO Report (Fase 2)

```bash
curl -s http://localhost:3000/api/agents/coo/report
```
**Success:** `{"report":"..."}` — ringkasan harian dari Groq

## 7. Scheduler (Fase 3)

```bash
# Trigger daily cycle manual
curl -s -X POST http://localhost:3000/api/agents/scheduler
```
**Success:** `{"summary":"Priorities for today:..."}` + cek agent_logs ada entry "daily_cycle_started"
**Disabled:** `{"error":"Agents disabled"}` (HTTP 503 — kalo `AGENTS_DISABLED=true`)

## 8. Hacker Execute (Fase 4)

```bash
# Hacker fix something
curl -s -X POST http://localhost:3000/api/agents/hacker/execute \
  -H "Content-Type: application/json" \
  -d '{"title":"fix typo in readme","description":"fix a typo di README.md"}'
```
**Success:** `{"task_id":"uuid","result":"DONE: ..."}` atau `"BUILD FAILED: ..."` atau `"BLOCKED: ..."`
**Fail:** `{"error":"task_id or title is required"}` (kalo body kosong)

```bash
# Hacker status (git + PM2)
curl -s http://localhost:3000/api/agents/hacker/status | python3 -m json.tool
```
**Success:**
```json
{
  "git": { "branch": "main", "hasChanges": false, "files": [] },
  "pm2": { "online": true, ... }
}
```

## 9. Hipster Execute (Fase 5)

```bash
curl -s -X POST http://localhost:3000/api/agents/hipster/execute \
  -H "Content-Type: application/json" \
  -d '{"title":"update button color","description":"ganti primary button jadi blue-600"}'
```
**Success:** `{"task_id":"uuid","result":"DONE: updated button color..."}`
**Blocked:** `{"task_id":"uuid","result":"BLOCKED: need design approval..."}`

## 10. Hustler Execute (Fase 6)

```bash
curl -s -X POST http://localhost:3000/api/agents/hustler/execute \
  -H "Content-Type: application/json" \
  -d '{"title":"cek revenue bulan ini"}'
```
**Success:** `{"task_id":"uuid","result":"DONE: Revenue Rp X, subscribers Y..."}`

## 11. Sub-Agent (Fase 7)

```bash
# Create sub-agent
curl -s -X POST http://localhost:3000/api/agents/sub-agents \
  -H "Content-Type: application/json" \
  -d '{"parent_agent_id":"hacker","type":"role","name":"cache-specialist","description":"handle all cache issues"}'
```
**Success:** `{"id":"sub-123456789-abc123"}` (HTTP 201)

```bash
# List sub-agents
curl -s http://localhost:3000/api/agents/sub-agents
```
**Success:** `[{ "id": "sub-...", "config": { ... }, "status": "active", ... }]`

```bash
# Suspend sub-agent
curl -s -X PATCH http://localhost:3000/api/agents/sub-agents/<SUB_ID> \
  -H "Content-Type: application/json" \
  -d '{"action":"suspend"}'
```
**Success:** `{"success":true}`

## 12. Debate (Fase 8)

```bash
# Initiate debate
curl -s -X POST http://localhost:3000/api/agents/debate \
  -H "Content-Type: application/json" \
  -d '{"topic":"should we raise prices?","participants":["hustler","hacker","hipster","coo"],"initiated_by":"hustler"}'
```
**Success:** `{"id":"debate-123456789"}` (HTTP 201)

```bash
# Submit argument
curl -s -X POST http://localhost:3000/api/agents/debate/<DEBATE_ID> \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"hustler","position":"for","reasoning":"revenue needs to grow 20%"}'
```
**Success:** `{ "id": "debate-...", "arguments": [...], "status": "active", ... }`

## 13. Approvals (Fase 8)

```bash
# List pending approvals
curl -s http://localhost:3000/api/agents/approvals
```
**Success:** `[{ "id": "approval-...", "taskId": "...", "score": 72, "status": "pending", ... }]`
**Empty:** `[]`

```bash
# Approve
curl -s -X POST http://localhost:3000/api/agents/approvals \
  -H "Content-Type: application/json" \
  -d '{"id":"<APPROVAL_ID>","action":"approve"}'
```
**Success:** `{"success":true}`

```bash
# Reject
curl -s -X POST http://localhost:3000/api/agents/approvals \
  -H "Content-Type: application/json" \
  -d '{"id":"<APPROVAL_ID>","action":"reject"}`
**Success:** `{"success":true}`
