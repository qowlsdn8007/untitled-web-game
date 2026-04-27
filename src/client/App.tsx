import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { MultiplayerScene } from "./game/MultiplayerScene";
import { createGameSocket, type GameSocket } from "./network/gameSocket";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../shared/protocol";

const GAME_WIDTH = MAP_WIDTH * TILE_SIZE;
const GAME_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const socketRef = useRef<GameSocket | null>(null);
  const [nickname, setNickname] = useState("");
  const [submittedNickname, setSubmittedNickname] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [status, setStatus] = useState("닉네임을 입력하고 맵에 입장하세요.");

  useEffect(() => {
    if (!submittedNickname || !containerRef.current) {
      return;
    }

    const socket = createGameSocket();
    socketRef.current = socket;

    const scene = new MultiplayerScene({
      socket,
      nickname: submittedNickname,
      onConnectionChange: (connected) => {
        setIsConnected(connected);
        setStatus(connected ? "실시간 동기화 연결 완료" : "서버 연결이 끊어졌습니다.");
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
            같은 맵에 접속한 플레이어들의 위치를 실시간으로 공유하는 데모입니다. 방향키로
            이동하고, 다른 사용자의 움직임은 짧은 보간으로 부드럽게 표시됩니다.
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
