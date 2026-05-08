# Branching & Release Strategy

> Universal. 3 strategies chính + recommendation theo team size.
> Solo+AI default: GitHub Flow (đơn giản, ít overhead).

---

## 1. Strategy comparison

| Strategy | Team size | Release cadence | Branches |
|---|---|---|---|
| **Trunk-based** | Bất kỳ | Daily / continuous | main + short-lived feature branch (<1 day) |
| **GitHub Flow** | Small-medium | Multiple per day - per week | main + feature branches |
| **Git Flow** | Medium-large | Scheduled releases | main + develop + feature + release + hotfix |

### Recommendation theo size
- Solo / 1-3 dev: **GitHub Flow** (default)
- 5-15 dev với CI mạnh: **Trunk-based** (đòi hỏi feature flag + CI tốt)
- 10+ dev với release schedule cố định: **Git Flow** (overhead nhưng predictable)

---

## 2. GitHub Flow (recommended cho solo+AI)

### Workflow
```
1. Branch từ main: feature/xxx
2. Commit nhỏ + thường xuyên
3. Push branch + open PR
4. CI pass + (self-)review
5. Merge to main
6. Deploy main → production
```

### Branch naming
```
feature/web-push-notification
fix/splash-treo-iphone
chore/upgrade-prisma-6
docs/test-protocol
refactor/post-card-component
hotfix/payment-double-charge
```

### PR rules
- Tựa đề Conventional Commits: `feat: ...`, `fix: ...`, `docs: ...`
- Description: WHY + WHAT changed + test evidence
- Size: < 400 LOC ideally (review > 60 phút = quá lớn, split)
- 1 PR = 1 logical change

### Merge strategy
- **Squash and merge** (default cho feature) — main lịch sử sạch
- **Rebase and merge** — preserve commit nhỏ nếu có ý nghĩa
- **Merge commit** — KHÔNG dùng cho main (clutter)

---

## 3. Trunk-based (cho team có CI mạnh)

### Workflow
```
1. Branch ngắn từ main: feature/xxx (< 1 ngày)
2. Merge to main nhanh (multiple times/day)
3. Feature flag để hide unfinished
4. Continuous deploy main → prod
```

### Yêu cầu
- CI < 10 phút (build + test)
- Feature flag system (LaunchDarkly, Unleash, GrowthBook)
- Test coverage cao (> 70%)
- Auto-rollback nếu deploy fail

### Pros / Cons
- ✅ Fast feedback, minimal merge conflict
- ✅ Force quality (không thể "đợi merge")
- ❌ Đòi hỏi CI/feature flag mạnh
- ❌ Junior dev có thể break main thường xuyên

---

## 4. Git Flow (legacy, ít dùng cho startup)

### Branches
```
main         ← production (tags: v1.0.0, v1.1.0)
  ↑
release/*    ← chuẩn bị release, bug fix
  ↑
develop      ← integration branch
  ↑
feature/*    ← feature đang dev
  ↑
hotfix/*     ← fix khẩn lên main
```

### Workflow
- Feature: từ develop → PR về develop
- Release: develop → release/x.y → bug fix → main + tag
- Hotfix: main → hotfix/x.y → main + develop

### Khi nào dùng
- Release schedule cứng (mobile app store với review time)
- Multiple version đang maintain (v1, v2 song song)
- Compliance audit yêu cầu release branch tách biệt

→ Solo+AI **KHÔNG nên dùng** — overhead lớn.

---

## 5. Versioning — Semantic Versioning (semver)

```
MAJOR.MINOR.PATCH

1.4.2
│ │ └── Patch: bug fix, no API change
│ └──── Minor: new feature, backward compat
└────── Major: BREAKING change
```

### Pre-release
```
1.0.0-alpha.1
1.0.0-beta.3
1.0.0-rc.1
```

### Build metadata
```
1.0.0+build.20260508
```

### Tag git
```bash
git tag -a v1.4.2 -m "Release 1.4.2"
git push origin v1.4.2
```

### Mobile app version
- Android: versionCode (incrementing int) + versionName (semver)
- iOS: CFBundleShortVersionString (semver) + CFBundleVersion (build number)

---

## 6. Release process

### 6.1 Pre-release checklist
```
[ ] All PR for release merged to main
[ ] CHANGELOG.md updated
[ ] Version bump (package.json, pubspec.yaml, etc.)
[ ] CI pass on main
[ ] Migration tested on staging
[ ] DR plan reviewed
[ ] Status page ready (incident comm)
[ ] Rollback procedure documented
```

### 6.2 Release
```bash
# Tag
git tag -a v1.4.0 -m "Release v1.4.0: <highlights>"
git push origin v1.4.0

# Deploy (auto qua CI on tag, hoặc manual)
./scripts/deploy.sh production v1.4.0
```

### 6.3 Post-release
```
[ ] Smoke test production (TEST_PROTOCOL §4)
[ ] Monitor dashboard 30 phút
[ ] Notify user (release note, email, in-app)
[ ] Update docs nếu có change user-visible
```

---

## 7. Hotfix process

### Khi nào hotfix
- SEV-1/2 production bug
- Security vulnerability Critical
- Compliance breach

### Process (GitHub Flow + tag)
```
1. Branch hotfix/v1.4.1 từ tag v1.4.0 (hoặc main nếu chưa có change)
2. Fix + test
3. PR → main
4. Tag v1.4.1
5. Deploy
6. Cherry-pick (or merge) về develop nếu có
```

### Time target
- SEV-1: hotfix trong 1h
- SEV-2: hotfix trong 4h
- SEV-3: trong sprint hiện tại

---

## 8. Branch protection (GitHub)

### main branch settings
```
[x] Require pull request before merging
    [x] Require approvals (1 cho team, skip cho solo)
    [x] Dismiss stale approvals on new commit
[x] Require status checks before merging
    [x] standards-check (4 jobs)
    [x] Lighthouse CI (nếu có)
[x] Require branches to be up to date
[x] Require linear history (no merge commit từ main)
[x] Require signed commits (optional)
[x] Include administrators (force solo+AI tự discipline)
[x] Restrict push (chỉ qua PR)
[ ] Allow force push (NEVER for main)
[ ] Allow deletions (NEVER for main)
```

### Solo+AI specific
- Không cần "Require approvals" (chỉ có 1 dev)
- BẮT BUỘC "Require status checks" (CI bảo vệ chính)
- BẮT BUỘC "Include administrators" (thần không bypass được)

---

## 9. Commit message convention

### Conventional Commits
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
| Type | Use |
|---|---|
| `feat` | Feature mới |
| `fix` | Bug fix |
| `chore` | Maintenance (deps, config) |
| `docs` | Doc only |
| `refactor` | Code change không đổi behavior |
| `test` | Test only |
| `perf` | Performance |
| `style` | Format, không đổi logic |
| `ci` | CI config |
| `build` | Build config / deps |
| `revert` | Revert commit |

### Scope (optional)
- Module name: `feat(auth): ...`
- Component: `fix(post-card): ...`

### Footer
```
Edge cases:
- ...

Test level: E2E thực

Co-Authored-By: ...
```

---

## 10. Anti-patterns

| Anti-pattern | Đúng |
|---|---|
| Long-lived feature branch (> 1 tuần) | Split nhỏ + merge sớm + feature flag |
| Merge commit vào main | Squash hoặc rebase |
| Force push main | NEVER |
| Skip CI vì "PR nhỏ" | CI phải pass mọi PR |
| Tag không follow semver | `v1.4.2` strict |
| Hotfix trên main không tag | Always tag để rollback được |
| Commit message free-form | Conventional Commits |
| `WIP` commit pushed lên main | Squash trước khi merge |
| Multiple "fix typo" commit | Squash trước merge |

---

## 11. Setup checklist

```
[ ] .github/CODEOWNERS (nếu có team)
[ ] .github/PULL_REQUEST_TEMPLATE.md
[ ] Branch protection rule on main
[ ] Conventional Commits hook (commitlint)
[ ] Auto-tag on merge (action: semantic-release)
[ ] CHANGELOG auto-generation
[ ] Release notes draft (GitHub Releases)
```
