# 릴리스 운영 가이드

migration 원격 적용 확인과 릴리스·Production 검증 절차를 정리한 문서입니다.
브랜치·PR·버전 규칙은 [AGENTS.md](../AGENTS.md)를 따르고, 이 문서는 **실제 운영 반영을 확인하는 방법**을 다룹니다.

v1.6.0 릴리스에서 migration 적용 상태를 확인하지 못한 채 배포가 진행된 적이 있어, 확인 시점과 방법을 문서로 고정합니다.

## 1. migration 적용 상태 확인

### 확인 시점

- 릴리스 PR을 **병합하기 전**
- 새 migration 파일이 포함된 이슈 PR을 develop에 병합한 직후
- Production 배포 후 기능이 500 오류를 내거나 컬럼 관련 오류가 보일 때

### 확인 방법

```bash
npx supabase login
npx supabase link --project-ref <project-ref>

# 로컬 migration과 원격(linked) 프로젝트의 적용 이력을 비교한다.
npx supabase migration list --linked
```

`migration list`는 로컬 파일과 원격에 적용된 버전을 나란히 보여줍니다.
로컬에만 있는 항목이 **미적용 migration**입니다.

원격 스키마와 로컬 정의가 어긋났는지 확인하려면 다음도 함께 봅니다.

```bash
# 원격 스키마와 로컬 migration의 차이를 출력 (파일 생성 없이 확인만)
npx supabase db diff --linked
```

### 미적용 migration이 있을 때

1. 릴리스 PR 본문과 릴리스 이슈에 미적용 목록과 적용 순서를 적는다.
2. 적용 시점과 담당자를 정한다. **사용자 승인 없이 운영 DB를 변경하지 않는다.**
3. 적용한다.

```bash
npx supabase db push
```

4. 적용 후 `npx supabase migration list --linked`로 다시 확인한다.
5. 릴리스 노트의 `데이터베이스 및 운영 반영`에 **파일 생성 여부와 실제 적용 여부를 구분해** 기록한다.

### 주의

- 이미 원격에 적용된 migration 파일은 수정하지 않는다. 보정이 필요하면 더 늦은 타임스탬프의 새 파일을 추가한다.
- `create table if not exists`만으로 기존 테이블의 누락 컬럼이 보정되지 않는다. `add column if not exists`를 함께 작성한다.
- `pg_cron` 같은 확장은 프로젝트 설정에서 활성화돼 있는지 별도로 확인한다.
- 적용하지 않았다면 적용했다고 보고하지 않는다.

## 2. 릴리스 전 확인

- [ ] 마일스톤 대상 이슈가 모두 develop에 병합됐다
- [ ] 각 이슈 PR의 GitHub Actions `CI / verify`와 Vercel Preview가 통과했다
- [ ] `npm run lint` / `npm run type-check` / `npm test` / `npm run build` 통과
- [ ] migration 적용 상태를 1번 절차로 확인했다
- [ ] 환경 변수 변경이 있으면 Vercel 프로젝트 설정에 반영했다
- [ ] `package.json`과 `package-lock.json` 버전을 올렸다
- [ ] 릴리스 PR 본문에 완료된 이슈별 `Closes #번호`를 적었다 (릴리스 관리 이슈는 `Related to`)

## 3. Production 검증

`master` 병합과 Vercel Production 배포가 끝난 뒤 확인합니다.
**태그와 GitHub Release는 이 검증을 마친 뒤에 만듭니다.**

### 공통 흐름

- [ ] Vercel Production 배포가 성공했다
- [ ] 홈 화면이 정상적으로 열린다 (비로그인 상태 포함)
- [ ] 로그인·로그아웃이 동작한다
- [ ] 피드 목록과 무한 스크롤, 관심 분야 필터가 동작한다
- [ ] 원문 열기 후 읽기 기록과 홈 체크리스트가 갱신된다
- [ ] 하루 읽기 목표 설정과 진행률, 연속 학습일이 표시된다
- [ ] 오늘의 퀴즈 제출과 결과 표시가 동작한다
- [ ] 글쓰기 저장(공개·비공개)과 게시글 상세, 북마크가 동작한다
- [ ] 프로필의 저장한 콘텐츠·읽은 글·내가 쓴 글·학습 통계 탭이 열린다
- [ ] 320px 모바일에서 레이아웃이 깨지지 않는다
- [ ] 브라우저 콘솔에 새로운 오류가 없다

### 이번 릴리스에서 바꾼 부분

- [ ] 릴리스 노트의 `주요 변경 사항`에 적은 항목을 하나씩 확인했다
- [ ] 수정한 버그의 재현 절차가 더 이상 재현되지 않는다

### 검증 결과 기록

- 확인한 흐름과 확인하지 못한 항목을 릴리스 노트의 `검증`에 그대로 적는다.
- 확인하지 않은 항목을 완료로 표시하지 않는다.

## 4. 태그와 Release

```bash
# 검증된 master 병합 커밋에 태그 생성
git tag -a vMAJOR.MINOR.PATCH <검증한 커밋> -m "release: vMAJOR.MINOR.PATCH"
git push origin vMAJOR.MINOR.PATCH

# 릴리스 노트 파일을 준비한 뒤 게시
gh release create vMAJOR.MINOR.PATCH --title "TodayPick vMAJOR.MINOR.PATCH" --notes-file <노트 파일> --latest
```

- 릴리스 노트 템플릿은 [AGENTS.md](../AGENTS.md)의 `릴리스 노트 템플릿`을 사용한다.
- **릴리스 노트에 적은 기능이 실제 코드에 있는지 대조한다.** 마일스톤에 있었지만 구현하지 않고 종료한 이슈를 완료된 기능으로 적지 않는다.
- 잘못된 커밋에 태그를 만들었다면 임의로 덮어쓰지 말고 수정 방식을 먼저 정한다.

## 5. 마무리

- [ ] 릴리스 관리 이슈의 체크리스트를 갱신하고 수동으로 종료했다
- [ ] 마일스톤을 종료했다
- [ ] 병합이 끝난 작업 브랜치를 로컬과 원격에서 정리했다
- [ ] 다음 버전으로 미룬 이슈의 마일스톤을 옮기고 릴리스 노트의 `알려진 제한 사항`에 남겼다

## 참고: GitHub CLI 계정 확인

여러 GitHub 계정을 사용하는 환경에서는 활성 계정이 바뀌어 태그·Release·PR 생성이 실패할 수 있습니다.
`must be a collaborator`나 권한 관련 오류가 나면 먼저 활성 계정을 확인합니다.

```bash
gh api user -q .login                    # 현재 활성 계정
gh api repos/<owner>/<repo> -q .permissions
gh auth switch --user <계정>
```
