# trainer-portfolio

GitHub Pages로 호스팅되는 1페이지 트레이너 사이트 (조태현 트레이너).

## 콘텐츠 수정 방법
GitHub 웹에서 `data/` 폴더의 JSON 파일을 열고 연필 아이콘 → 수정 → Commit changes.

- `data/profile.json` — 이름, 소개, 자격증, 경력, 연락처
- `data/reviews.json` — 회원 후기 (`"hidden": true` 로 숨김 가능)
- `data/before-after.json` — 비포/애프터 사진
- `data/gallery.json` — 사진·영상 목록

이미지는 `assets/images/` 폴더 아래에 업로드하고, JSON에 적힌 경로(`assets/images/...`)와 파일명을 맞춰주면 사이트에 나옵니다.

## 사이트 주소
https://gus99688460-svg.github.io/trainer-portfolio/

## 배포 (최초 1회만)
Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save.
1~2분 뒤 위 주소에서 확인 가능.
