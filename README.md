# SNUAIIMPACT Frontend

Next.js 기반 프론트엔드입니다. 프롬프트랩에서 AI 문항을 생성하고, 문제은행에서 주관식/객관식 문항을 검색·검토할 수 있습니다.

## 주요 기능

- 프롬프트랩
  - 주관식/객관식 문항 유형 선택
  - 유형별 기본 시스템 프롬프트 로드
  - 참고자료 업로드, 총합 최대 200MB
  - AI 생성 결과 미리보기
  - 품질 상태 및 코멘트 저장
- 문제은행
  - 주관식/객관식 통합 목록 조회
  - 문제 유형, 모델, 품질, 기간 필터
  - 문항 상세 확인
  - 참고자료 파일 열람

## 실행 환경

- Node.js 20+
- npm
- 백엔드 API 서버: 기본 `http://localhost:8000`

## 설치

```bash
cd frontend
npm install
```

## 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 설정합니다.

```bash
cp .env.example .env.local
```

주요 환경변수:

- `NEXT_PUBLIC_API_URL`: 백엔드 API 주소. 예: `http://localhost:8000`

## 개발 서버 실행

```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 빌드 및 실행

```bash
npm run build
npm run start
```

## 검증

```bash
npm run lint
npm run build
```

## 주요 경로

- `/`: 대시보드
- `/prompt-lab`: AI 문항 생성
- `/question-bank`: 생성 문항 목록 및 검토

## 프로젝트 구조

```text
src/
  app/                  Next.js App Router 페이지
  components/           화면/공통 UI 컴포넌트
  components/prompt-lab 프롬프트랩 UI
  components/question   문항 상세 공통 UI
  components/question-bank 문제은행 UI
  lib/                  API 클라이언트, 타입, 변환 유틸
```

## 참고

- 문제 생성에는 참고자료가 1개 이상 필요합니다.
- 참고자료 열람 URL은 백엔드의 question-bank reference endpoint를 통해 열립니다.
