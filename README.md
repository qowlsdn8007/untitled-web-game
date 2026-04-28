# Multiplayer 2D Map Prototype

브라우저에서 여러 사용자가 같은 2D 맵에 접속해 실시간으로 이동 상태를 공유하는 프로토타입입니다.  
클라이언트는 `React + Phaser`, 서버는 `Node.js + Express + Socket.IO`, 공용 타입은 `TypeScript`로 구성되어 있습니다.

## 주요 기능

- 닉네임 입력 후 멀티플레이 맵 입장
- 방향키 기반 실시간 이동
- 같은 맵에 접속한 다른 사용자 표시
- 접속/이동/퇴장 이벤트 실시간 반영
- 원격 플레이어 위치 보간
- 클라이언트와 서버가 함께 사용하는 공용 프로토콜 타입
- 간단한 벽 충돌 타일 지원

## 기술 스택

- Client: `React`, `Vite`, `Phaser`, `socket.io-client`
- Server: `Node.js`, `Express`, `Socket.IO`
- Language: `TypeScript`

## 프로젝트 구조

```text
src/
  client/
    App.tsx                  # React 진입 화면과 게임 마운트
    game/
      MultiplayerScene.ts    # Phaser 씬, 입력 처리, 렌더링, 동기화
      map.ts                 # 맵 드로잉
    network/
      gameSocket.ts          # Socket.IO 클라이언트 연결
    styles/
      global.css             # UI 스타일
  server/
    index.ts                 # Express + Socket.IO 서버
  shared/
    protocol.ts              # 공용 이벤트/타입/맵 상수
    map.ts                   # 공용 충돌 타일 규칙
```

## AI Harness

이 레포는 설치된 skills를 기준으로 동작하는 프로젝트 harness를 포함합니다.

- 메인 harness: [AGENTS.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/AGENTS.md)
- frontend 지침: [frontend.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/frontend.md)
- multiplayer 지침: [multiplayer.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/multiplayer.md)
- architecture 지침: [architecture.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/architecture.md)
- deployment 지침: [deployment.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/deployment.md)
- documentation 지침: [documentation.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/documentation.md)

핵심 원칙:

- `solid`는 모든 코드 작업의 기본 품질 레이어로 사용합니다.
- 작업 유형에 따라 React, TypeScript, WebSocket, deployment, documentation 관련 skill을 선택적으로 활성화합니다.
- 구조 변경이나 복잡한 백엔드 아키텍처는 필요할 때만 `feature-sliced-design`, `clean-ddd-hexagonal`을 적용합니다.

## 요구 사항

- Node.js `20+`
- npm `10+` 이상 권장

## 설치

```bash
npm install
```

## 개발 실행

클라이언트와 서버를 함께 실행합니다.

```bash
npm run dev
```

기본 포트:

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`

브라우저를 2개 이상 열거나 시크릿 창을 함께 열면 멀티플레이 동작을 확인할 수 있습니다.

## 빌드

```bash
npm run build
```

출력:

- 클라이언트 빌드: `dist/`
- 서버 빌드: `dist-server/`

## 미리보기

클라이언트 빌드 결과만 확인할 때:

```bash
npm run preview
```

서버 빌드 결과를 직접 실행할 때:

```bash
node dist-server/server/index.js
```

## 배포

이 프로젝트는 아래 조합으로 배포하는 것을 기준으로 준비되어 있습니다.

- 클라이언트: `Vercel`
- Socket 서버: `Render Web Service`

### 1. Render에 Socket 서버 배포

레포 루트에 [render.yaml](/Users/bjw/Documents/Codex/2026-04-27-new-chat/render.yaml)이 포함되어 있어 Render Blueprint 또는 일반 Web Service 생성에 그대로 사용할 수 있습니다.

권장 설정:

- Runtime: `Node`
- Plan: `Free`
- Build Command: `npm install && npm run build:server`
- Start Command: `npm run start:server`
- Health Check Path: `/health`

Render에서 반드시 설정할 환경 변수:

- `CLIENT_ORIGIN=https://your-vercel-project.vercel.app`

참고:

- Render는 웹 서비스가 `0.0.0.0`과 지정 포트에 바인딩되어야 합니다.
- 이 서버는 `PORT` 환경 변수를 지원하며, Render 기본 포트 `10000`에서 동작하도록 준비되어 있습니다.
- 무료 인스턴스는 유휴 시간이 길면 잠들 수 있어 첫 연결이 느릴 수 있습니다.

배포 후 확인할 주소:

```text
https://your-render-service.onrender.com/health
```

정상 응답 예시:

```json
{"ok":true,"players":0,"mapId":"starter-plaza"}
```

### 2. Vercel에 클라이언트 배포

이 프로젝트는 Vite 기반이라 Vercel에서 바로 import 가능합니다.

Vercel 프로젝트 설정:

- Framework Preset: `Vite`
- Root Directory: `/`
- Build Command: `npm run build:client`
- Output Directory: `dist`

Vercel 환경 변수:

- `VITE_SERVER_URL=https://your-render-service.onrender.com`

배포가 끝나면 `CLIENT_ORIGIN` 값을 Vercel 배포 주소로 다시 맞춰 Render에 저장하세요.

예:

```text
CLIENT_ORIGIN=https://untitled-web-game.vercel.app
```

### 3. 배포 순서 권장

1. Render에 서버를 먼저 배포한다.
2. Render 서비스 URL을 확인한다.
3. Vercel에 `VITE_SERVER_URL`을 넣고 클라이언트를 배포한다.
4. Vercel 배포 URL을 확인한 뒤 Render의 `CLIENT_ORIGIN`을 그 주소로 업데이트한다.
5. 브라우저 2개 이상으로 접속해 멀티플레이를 확인한다.

### 4. 환경 변수 예시 파일

로컬 확인용 예시는 [.env.example](/Users/bjw/Documents/Codex/2026-04-27-new-chat/.env.example)에 들어 있습니다.

## 환경 변수

현재 구현은 선택적으로 아래 환경 변수를 지원합니다.

- `PORT`: 서버 포트. 기본값 `3001`
- `CLIENT_ORIGIN`: CORS 허용 클라이언트 주소. 기본값 `http://localhost:5173`
- `VITE_SERVER_URL`: 클라이언트가 접속할 Socket.IO 서버 주소. 기본값 `http://localhost:3001`

예시:

```bash
PORT=4000 CLIENT_ORIGIN=http://localhost:5173 npm run dev:server
```

```bash
VITE_SERVER_URL=http://localhost:4000 npm run dev:client
```

## 게임 동작 방식

### 맵

- 단일 고정 맵 `starter-plaza`를 사용합니다.
- 맵 크기는 `20 x 14` 타일입니다.
- 타일 크기는 `48px`입니다.
- 플레이어 스폰 위치는 고정되어 있습니다.

### 이동

- 방향키로 이동합니다.
- 플레이어 위치는 픽셀 좌표 기준으로 관리합니다.
- 로컬 플레이어는 즉시 이동하고, 서버가 좌표를 다시 검증합니다.
- 서버와 클라이언트 모두 같은 충돌 규칙을 사용합니다.
- 원격 플레이어는 목표 좌표로 짧게 보간되어 자연스럽게 보입니다.

### 멀티플레이

- 서버는 메모리 기반으로 현재 접속자 상태를 유지합니다.
- 새 사용자가 접속하면 현재 플레이어 목록을 `world:init`으로 받습니다.
- 다른 사용자의 이동은 `player:moved` 이벤트로 동기화됩니다.
- 사용자가 나가면 `player:left` 이벤트로 제거됩니다.

## 실시간 이벤트 프로토콜

### Client -> Server

- `player:join`

```ts
{ nickname: string }
```

- `player:move`

```ts
{
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  moving: boolean;
  seq: number;
}
```

### Server -> Client

- `world:init`

```ts
{
  selfId: string;
  mapId: string;
  players: PlayerState[];
}
```

- `player:joined`

```ts
PlayerState
```

- `player:moved`

```ts
{
  id: string;
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
}
```

- `player:left`

```ts
{
  id: string;
}
```

### Shared Types

```ts
type Direction = "up" | "down" | "left" | "right";

type PlayerState = {
  id: string;
  nickname: string;
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
};
```

## 테스트 체크리스트

- 브라우저 1개에서 접속 후 닉네임 입장과 이동이 정상 동작하는지 확인
- 브라우저 2개 이상에서 서로의 위치가 실시간으로 보이는지 확인
- 한 브라우저를 닫았을 때 다른 화면에서 아바타가 사라지는지 확인
- 벽 타일에 부딪힐 때 통과하지 않는지 확인
- 페이지 새로고침 후 다시 입장 가능한지 확인
- `http://localhost:3001/health` 응답이 정상인지 확인

## 현재 범위와 제한

- 단일 맵만 지원합니다.
- 로그인/인증이 없습니다.
- 데이터베이스를 사용하지 않습니다.
- 서버 재시작 시 플레이어 상태는 유지되지 않습니다.
- 채팅, 아이템, NPC, 포탈, 오브젝트 상호작용은 아직 없습니다.
- Phaser 포함으로 인해 프로덕션 빌드 시 번들 크기 경고가 발생할 수 있습니다.

## 다음 확장 아이디어

- 채팅 기능 추가
- 맵 데이터 외부 JSON/Tiled 포맷으로 분리
- 스프라이트 애니메이션 적용
- 여러 룸 또는 여러 맵 지원
- 로그인과 사용자 세션 도입
- 서버 authoritative movement를 더 엄격하게 강화
