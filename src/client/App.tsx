import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { MultiplayerScene } from "./game/MultiplayerScene";
import { createGameSocket, type GameSocket } from "./network/gameSocket";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type MatchState, type PlayerState } from "../shared/protocol";

const GAME_WIDTH = MAP_WIDTH * TILE_SIZE;
const GAME_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const socketRef = useRef<GameSocket | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [submittedNickname, setSubmittedNickname] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [status, setStatus] = useState("닉네임을 입력하고 맵에 입장하세요.");
  const [match, setMatch] = useState<MatchState | null>(null);
  const [selfPlayer, setSelfPlayer] = useState<PlayerState | null>(null);

  useEffect(() => {
    if (!submittedNickname) {
      return;
    }

    setStatus(describeStatus(isConnected, match));
  }, [isConnected, match, submittedNickname]);

  useEffect(() => {
    if (!submittedNickname || !containerRef.current) {
      return;
    }

    const socket = createGameSocket();
    socketRef.current = socket;

    socket.on("world:init", (payload) => {
      selfIdRef.current = payload.selfId;
      setMatch(payload.match);
      setPlayerCount(payload.players.length);
      const nextSelfPlayer = payload.players.find((player) => player.id === payload.selfId) ?? null;
      setSelfPlayer(nextSelfPlayer);
    });

    socket.on("match:state", ({ match: nextMatch, playerCount: nextPlayerCount }) => {
      setMatch(nextMatch);
      setPlayerCount(nextPlayerCount);
    });

    socket.on("player:updated", (payload) => {
      if (payload.id !== selfIdRef.current) {
        return;
      }

      setSelfPlayer((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          ...payload
        };
      });
    });

    socket.on("world:updated", (payload) => {
      const selfId = selfIdRef.current;
      if (!selfId) {
        return;
      }

      const selfInventory = payload.playerBombs.find((playerBomb) => playerBomb.id === selfId);
      if (!selfInventory) {
        return;
      }

      setSelfPlayer((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          activeBombs: selfInventory.activeBombs
        };
      });
    });

    const scene = new MultiplayerScene({
      socket,
      nickname: submittedNickname,
      onConnectionChange: (connected) => {
        setIsConnected(connected);
      },
      onPlayerCountChange: (count) => {
        setPlayerCount(count);
      }
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: "#0f172a",
      physics: {
        default: "arcade",
        arcade: {
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene
    });

    gameRef.current = game;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      selfIdRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
  }, [submittedNickname]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = nickname.trim();
    if (!trimmed) {
      setStatus("닉네임은 비워둘 수 없습니다.");
      return;
    }

    setSubmittedNickname(trimmed);
    setStatus("서버에 연결 중입니다...");
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Realtime Browser Playground</p>
          <h1>멀티 유저 2D 맵 프로토타입</h1>
          <p className="description">
            같은 맵에 접속해 이동하고, 스페이스바로 폭탄을 설치하는 브라우저 봄버맨 프로토타입입니다.
            서버가 폭발과 벽 파괴, 라운드 진행을 authoritative 하게 관리합니다.
          </p>
        </div>

        <form className="join-form" onSubmit={handleSubmit}>
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            maxLength={16}
            placeholder="예: codex-player"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            disabled={Boolean(submittedNickname)}
          />
          <button type="submit" disabled={Boolean(submittedNickname)}>
            {submittedNickname ? "입장 완료" : "맵 입장"}
          </button>
        </form>

        <dl className="status-panel">
          <div>
            <dt>상태</dt>
            <dd>{status}</dd>
          </div>
          <div>
            <dt>연결</dt>
            <dd>{isConnected ? "online" : "offline"}</dd>
          </div>
          <div>
            <dt>접속 인원</dt>
            <dd>{playerCount}</dd>
          </div>
          <div>
            <dt>라운드</dt>
            <dd>{match?.round ?? "-"}</dd>
          </div>
          <div>
            <dt>매치</dt>
            <dd>{formatMatchStatus(match?.status)}</dd>
          </div>
          <div>
            <dt>생존 상태</dt>
            <dd>{selfPlayer ? (selfPlayer.alive ? "alive" : "dead") : "-"}</dd>
          </div>
          <div>
            <dt>폭탄</dt>
            <dd>{selfPlayer ? `${selfPlayer.activeBombs} / ${selfPlayer.maxBombs}` : "-"}</dd>
          </div>
          <div>
            <dt>화염 범위</dt>
            <dd>{selfPlayer?.flameRange ?? "-"}</dd>
          </div>
          <div>
            <dt>이동 속도</dt>
            <dd>{selfPlayer?.moveSpeed ?? "-"}</dd>
          </div>
          <div>
            <dt>결과</dt>
            <dd>{formatRoundResult(match, selfIdRef.current)}</dd>
          </div>
        </dl>
      </section>

      <section className="game-panel">
        <div className="canvas-frame">
          <div ref={containerRef} className="game-canvas" />
          {!submittedNickname ? (
            <div className="canvas-overlay">닉네임을 입력하면 이곳에 멀티플레이 맵이 열립니다.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function formatMatchStatus(status: MatchState["status"] | undefined) {
  switch (status) {
    case "waiting":
      return "waiting";
    case "starting":
      return "starting";
    case "running":
      return "running";
    case "finished":
      return "finished";
    default:
      return "-";
  }
}

function formatRoundResult(match: MatchState | null, selfId: string | null) {
  if (!match || match.status !== "finished") {
    return "-";
  }

  if (!match.winnerId) {
    return "draw";
  }

  return match.winnerId === selfId ? "you win" : "you lose";
}

function describeStatus(connected: boolean, match: MatchState | null) {
  if (!connected) {
    return "서버 연결이 끊어졌습니다.";
  }

  switch (match?.status) {
    case "waiting":
      return "다른 플레이어를 기다리는 중입니다.";
    case "starting":
      return "새 라운드를 준비 중입니다.";
    case "running":
      return "방향키로 이동하고 스페이스바로 폭탄을 설치하세요.";
    case "finished":
      return match.winnerId ? "라운드 종료, 곧 다음 판이 시작됩니다." : "무승부, 곧 다음 판이 시작됩니다.";
    default:
      return "실시간 동기화 연결 완료";
  }
}
