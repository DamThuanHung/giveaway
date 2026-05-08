# API Design Guidelines

> Universal. Microsoft REST API Guidelines + Stripe API patterns + GraphQL
> best practices. Mỗi API public/internal cần consistency.

---

## 1. Resource modeling

### 1.1 Naming
- **Plural noun** cho collection: `/users`, `/posts`, `/orders`
- **Singular** cho identity: `/me`, `/current-user`
- Lowercase, dash-separated: `/order-items`, không `/orderItems`
- KHÔNG verb trong path: ❌ `/getUsers` → ✅ `GET /users`

### 1.2 Hierarchy
```
GET    /users                    # List
POST   /users                    # Create
GET    /users/{id}               # Read
PUT    /users/{id}               # Replace
PATCH  /users/{id}               # Partial update
DELETE /users/{id}               # Delete

GET    /users/{id}/orders        # Sub-resource list
POST   /users/{id}/orders        # Create under parent
```

Tránh nest > 2 level: `/users/{id}/orders/{oid}/items/{iid}` → quá sâu, dùng `/order-items/{iid}`.

### 1.3 Action endpoint (khi không fit RESTful)
```
POST /users/{id}/actions/lock
POST /orders/{id}/actions/cancel
POST /payments/{id}/actions/refund
```

Hoặc dùng `/<resource>:<action>` style (Google API):
```
POST /users/{id}:lock
POST /orders/{id}:cancel
```

---

## 2. HTTP semantics

### 2.1 Method semantics
| Method | Idempotent | Safe | Body | Use |
|---|---|---|---|---|
| GET | ✅ | ✅ | ❌ | Read |
| HEAD | ✅ | ✅ | ❌ | Metadata |
| POST | ❌ | ❌ | ✅ | Create / action |
| PUT | ✅ | ❌ | ✅ | Replace full |
| PATCH | ✅ (nên là) | ❌ | ✅ | Partial update |
| DELETE | ✅ | ❌ | optional | Delete |

### 2.2 Status code
| Code | Khi |
|---|---|
| 200 OK | Success với body |
| 201 Created | POST tạo resource thành công, return body + Location header |
| 202 Accepted | Async accepted, chưa hoàn thành |
| 204 No Content | Success không body (DELETE thường) |
| 301/302 | Redirect (cẩn thận với POST) |
| 400 Bad Request | Client lỗi format/validation |
| 401 Unauthorized | Thiếu/sai auth |
| 403 Forbidden | Có auth nhưng không đủ quyền |
| 404 Not Found | Resource không tồn tại |
| 409 Conflict | State conflict (concurrent update) |
| 410 Gone | Resource đã xóa vĩnh viễn |
| 422 Unprocessable | Format đúng nhưng business rule fail |
| 429 Too Many Requests | Rate limit |
| 500 Internal Server Error | Server bug |
| 502/503/504 | Upstream/availability/timeout |

### 2.3 Idempotency keys (POST)
```
POST /payments
Idempotency-Key: <unique-uuid>
```

Server lưu key 24h, request lặp với cùng key → return response cũ. Tránh charge double khi retry.

---

## 3. Response format

### 3.1 Success
```json
{
  "id": "u_123",
  "email": "x@y.com",
  "createdAt": "2026-05-08T10:00:00Z"
}
```

KHÔNG wrap trong `{"data": {...}}` trừ khi có metadata bắt buộc.

### 3.2 List + pagination
```json
{
  "data": [...],
  "meta": {
    "total": 1234,
    "page": 1,
    "limit": 20,
    "hasMore": true,
    "nextCursor": "opaque-cursor-string"
  }
}
```

### 3.3 Error — RFC 7807 Problem Details
```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email format invalid",
  "instance": "/users",
  "errors": [
    { "field": "email", "code": "format", "message": "must be valid email" }
  ]
}
```

---

## 4. Pagination strategies

### Offset-based (đơn giản, không scale)
```
GET /posts?page=1&limit=20
```
- Vấn đề: OFFSET 100000 → DB scan 100k row
- OK cho < 10k record total

### Cursor-based (scale)
```
GET /posts?cursor=abc123&limit=20
```
- Cursor opaque (encode timestamp + id)
- Stable khi data thay đổi
- Bắt buộc cho realtime feed, infinite scroll

### Keyset
```
GET /posts?after_id=abc&limit=20
```
- Subset của cursor, đơn giản hơn
- Đòi hỏi sort theo indexed column

→ Dùng cursor cho mọi list > 1000 record.

---

## 5. Versioning

### URL path (recommended)
```
/v1/users
/v2/users
```
- Pro: rõ ràng, cache friendly
- Con: phải maintain song song

### Header
```
Accept: application/vnd.example.v2+json
```
- Pro: clean URL
- Con: invisible trong browser, debug khó

### Query string
```
/users?version=2
```
- Avoid — không cache friendly

### Policy
- Major bump (v1 → v2) khi BREAKING change
- Non-breaking → cùng version (add field optional, deprecate field)
- Giữ version cũ ít nhất 6 tháng sau khi v mới release
- Sunset header announcement: `Sunset: Sat, 31 Dec 2026 23:59:59 GMT`

---

## 6. Filtering / sorting / search

### Filter
```
GET /posts?category=fashion&status=available&min_price=100
```

### Sort
```
GET /posts?sort=-created_at,price
```
(`-` prefix = desc)

### Search
```
GET /posts?q=keyword
```
- Full-text search server-side (Postgres `tsvector`, Elasticsearch, Meilisearch)
- Trim, normalize, ignore diacritics tùy ngôn ngữ

### Sparse fieldsets (giảm payload)
```
GET /users/123?fields=id,email,name
```

---

## 7. Rate limiting

### Standard headers (RFC draft 9)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1620000000
Retry-After: 60        ← khi 429
```

### Tier
| Endpoint | Limit |
|---|---|
| Public unauth | 100/h/IP |
| Auth user | 1000/h/user |
| Admin | unlimited |
| Login attempt | 5/min/IP, 10/min/account |
| OTP | 3/min/account, 1h cooldown sau 10 fail |

---

## 8. Authentication

### Bearer token
```
Authorization: Bearer eyJ...
```

### API key (B2B)
```
X-API-Key: sk_live_xxx
```

### CSRF (cookie-based)
- SameSite=Lax cho session cookie
- CSRF token trong header X-CSRF-Token

### CORS
- Origin allowlist cụ thể, KHÔNG `*` cho endpoint có cookie
- `Access-Control-Allow-Credentials: true` chỉ khi cần
- Methods/Headers allowlist cụ thể

---

## 9. Async patterns

### 9.1 Long-running task — Async accepted
```
POST /reports
→ 202 Accepted
{
  "taskId": "t_123",
  "statusUrl": "/tasks/t_123",
  "estimatedSeconds": 60
}

GET /tasks/t_123
→ 200 OK
{
  "status": "running" | "done" | "failed",
  "progress": 0.5,
  "resultUrl": "/reports/r_456" (when done)
}
```

### 9.2 Webhook
- POST với HMAC signature trong header
- Idempotent (retry với cùng event ID)
- Document event types + payload schema
- Verify signature trước khi process

### 9.3 Server-Sent Events (SSE) cho push 1-chiều
```
GET /events
Content-Type: text/event-stream

event: post.new
data: {"id": "p_123"}

event: post.updated
data: {"id": "p_456"}
```

### 9.4 WebSocket cho 2-chiều (chat, collab)
- Auth qua first message hoặc query param token
- Heartbeat ping/pong
- Reconnect với last event ID

---

## 10. GraphQL specific

### Schema design
- Field naming camelCase
- Type naming PascalCase
- Mutation naming `verb + Noun`: `createPost`, `updateUser`
- Input type tách biệt: `CreatePostInput`
- Avoid mutation chain — đặt 1 mutation atomic

### Pagination
```graphql
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}
type PageInfo {
  endCursor: String
  hasNextPage: Boolean!
}
```

### N+1 prevention
- DataLoader (Facebook) cho mọi resolver có nested relation
- Batch + cache per request

### Field deprecation
```graphql
type User {
  fullName: String! @deprecated(reason: "Use firstName + lastName")
}
```

### Errors
- Throw GraphQLError với extensions.code: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`
- KHÔNG return null + error trong nested field, return error proper

---

## 11. Schema as source of truth

### REST → OpenAPI 3.x
- File: `openapi.yaml` checked in repo
- Auto-generate từ code (Nest decorator, FastAPI) hoặc viết tay
- CI gate: lint OpenAPI (Spectral), break on backward incompat
- Generate client SDK từ schema

### GraphQL → schema.graphql
- File checked in
- CI gate: graphql-codegen client + schema diff alert breaking change

---

## 12. Error code consistency

Mỗi error code unique + documented:

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Field validation fail |
| `INVALID_TOKEN` | 401 | Token expired/invalid |
| `INSUFFICIENT_PERMISSION` | 403 | Forbidden by RBAC |
| `RESOURCE_NOT_FOUND` | 404 | ID không tồn tại |
| `DUPLICATE_RESOURCE` | 409 | Unique constraint violated |
| `RATE_LIMITED` | 429 | Throttled |
| `INTERNAL_ERROR` | 500 | Generic 5xx |

Document trong OpenAPI hoặc API.md riêng.

---

## 13. Anti-patterns

| Anti-pattern | Đúng |
|---|---|
| `GET /getUsers` | `GET /users` |
| 200 OK với `{"error": "..."}` body | Status code đúng (4xx/5xx) |
| Thay đổi field type không bump version | Bump major version |
| Trả nested object 5 level deep mặc định | Hỗ trợ `?fields=` để client chọn |
| Pagination offset cho > 10k record | Cursor-based |
| API key trong query string `?key=` | Header `Authorization` |
| Trả message lỗi tiếng Việt cho API | Tách: error code + i18n message client side |
| Endpoint mỗi action là 1 path mới | Resource-action pattern |
