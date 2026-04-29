import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { MultiplayerScene } from "./game/MultiplayerScene";
import { createGameSocket, type GameSocket } from "./network/gameSocket";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type JoinMode, type MatchState, type PlayerState } from "../shared/protocol";

const GAME_WIDTH = MAP_WIDTH * TILE_SIZE;
const GAME_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const socketRef = useRef<GameSocket | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("public-1");
  const [submittedNickname, setSubmittedNickname] = useState("");
  const [submittedRoomCode, setSubmittedRoomCode] = useState("");
  const [submittedJoinMode, setSubmittedJoinMode] = useState<JoinMode>("room");
  const [isConnected, setIsConnected] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [status, setStatus] = useState("닉네임을 입력하고 맵에 입장하세요.");
  const [match, setMatch] = useState<MatchState | null>(null);
  const [selfPlayer, setSelfPlayer] = useState<PlayerState | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!submittedNickname || !submittedRoomCode) {
      return;
    }

    setStatus(describeStatus(isConnected, match));
  }, [isConnected, match, submittedNickname, submittedRoomCode]);

  useEffect(() => {
    if (!submittedNickname || !submittedRoomCode || !containerRef.current) {
      return;
    }

    const socket = createGameSocket();
    socketRef.current = socket;

    socket.on("world:init", (payload) => {
      selfIdRef.current = payload.selfId;
      setCurrentRoomId(payload.roomId);
      setMatch(payload.match);
      setPlayerCount(payload.players.length);
      setReadyCount(payload.players.filter((player) => player.ready).length);
      const nextSelfPlayer = payload.players.find((player) => player.id === payload.selfId) ?? null;
      setSelfPlayer(nextSelfPlayer);
    });

    socket.on("match:state", ({ match: nextMatch, playerCount: nextPlayerCount, readyCount: nextReadyCount }) => {
      setMatch(nextMatch);
      setPlayerCount(nextPlayerCount);
      setReadyCount(nextReadyCount);
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
      roomId: submittedRoomCode,
      joinMode: submittedJoinMode,
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
      setCurrentRoomId(null);
      setReadyCount(0);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [submittedJoinMode, submittedNickname, submittedRoomCode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = nickname.trim();
    if (!trimmed) {
      setStatus("닉네임은 비워둘 수 없습니다.");
      return;
    }

    setSubmittedNickname(trimmed);
    setSubmittedRoomCode(normalizeRoomCode(roomCode));
    setSubmittedJoinMode("room");
    setStatus("서버에 연결 중입니다...");
  };

  const handleQuickMatch = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setStatus("닉네임은 비워둘 수 없습니다.");
      return;
    }

    setSubmittedNickname(trimmed);
    setSubmittedRoomCode("quick");
    setSubmittedJoinMode("quick");
    setStatus("빠른 매치를 찾는 중입니다...");
  };

  const handleReadyToggle = () => {
    if (!selfPlayer || !canToggleReady(match)) {
      return;
    }

    socketRef.current?.emit("player:ready", { ready: !selfPlayer.ready });
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
          <label htmlFor="room-code">방 코드</label>
          <input
            id="room-code"
            maxLength={24}
            placeholder="예: public-1"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value)}
            disabled={Boolean(submittedNickname)}
          />
          <div className="join-actions">
            <button type="submit" disabled={Boolean(submittedNickname)}>
              {submittedNickname ? "입장 완료" : "방 입장"}
            </button>
            <button className="secondary" type="button" onClick={handleQuickMatch} disabled={Boolean(submittedNickname)}>
              빠른 매치
            </button>
          </div>
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
            <dt>준비</dt>
            <dd>
              {readyCount} / {playerCount}
            </dd>
          </div>
          <div>
            <dt>방 코드</dt>
            <dd>{currentRoomId ?? "-"}</dd>
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
            <dd>{selfPlayer ? (selfPlayer.alive ? "alive" : "ko") : "-"}</dd>
          </div>
          <div>
            <dt>폭탄</dt>
            <dd>{selfPlayer ? `${selfPlayer.activeBombs} / ${selfPlayer.maxBombs}` : "-"}</dd>
          </div>
          <div>
            <dt>화염 범위</dt>
            <dd>{selfPlayer ? `${selfPlayer.flameRange} tiles` : "-"}</dd>
          </div>
          <div>
            <dt>이동 속도</dt>
            <dd>{selfPlayer ? `${selfPlayer.moveSpeed}` : "-"}</dd>
          </div>
          <div>
            <dt>결과</dt>
            <dd>{formatRoundResult(match, selfIdRef.current)}</dd>
          </div>
        </dl>

        {submittedNickname ? (
          <button className="ready-action" type="button" onClick={handleReadyToggle} disabled={!isConnected || !canToggleReady(match)}>
            {selfPlayer?.ready ? "준비 취소" : "Ready"}
          </button>
        ) : null}
      </section>

      <section className="game-panel">
        <div className="canvas-frame">
          <div ref={containerRef} className="game-canvas" />
          {submittedNickname ? (
            <div className="controls-banner">
              <span>Move: Arrow Keys</span>
              <span>Bomb: Space</span>
              <span>Power-Ups: B / F / S</span>
            </div>
          ) : null}
          {!submittedNickname ? (
            <div className="canvas-overlay">닉네임을 입력하면 이곳에 멀티플레이 맵이 열립니다.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function normalizeRoomCode(value: string) {
  const trimmed = value.trim().toLowerCase().slice(0, 24);
  return trimmed.length > 0 ? trimmed : "public-1";
}

function canToggleReady(match: MatchState | null) {
  return !match || match.status === "waiting" || match.status === "starting";
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
