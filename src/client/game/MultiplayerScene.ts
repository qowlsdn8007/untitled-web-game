import Phaser from "phaser";
import {
  MAP_HEIGHT,
  MAP_ID,
  MAP_WIDTH,
  PLAYER_SPEED,
  SPAWN_POINT,
  TILE_SIZE,
  type BombPlacedPayload,
  type BombState,
  type Direction,
  type PlayerInputPayload,
  type PlayerUpdatedPayload,
  type PlayerState,
  type WorldInitPayload
} from "../../shared/protocol";
import { drawMap } from "./map";
import type { GameSocket } from "../network/gameSocket";

type SceneOptions = {
  socket: GameSocket;
  nickname: string;
  onConnectionChange: (connected: boolean) => void;
  onPlayerCountChange: (count: number) => void;
};

type Avatar = {
  root: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  state: PlayerState;
  targetX: number;
  targetY: number;
};

type BombView = {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  fuse: Phaser.GameObjects.Rectangle;
  state: BombState;
};

const PLAYER_SIZE = 28;
const SELF_RECONCILE_IGNORE_DISTANCE = 12;
const SELF_RECONCILE_SNAP_DISTANCE = 96;
const SELF_RECONCILE_LERP_FACTOR = 0.35;

export class MultiplayerScene extends Phaser.Scene {
  private readonly socket: GameSocket;
  private readonly nickname: string;
  private readonly onConnectionChange: SceneOptions["onConnectionChange"];
  private readonly onPlayerCountChange: SceneOptions["onPlayerCountChange"];
  private readonly remotePlayers = new Map<string, Avatar>();
  private readonly bombs = new Map<string, BombView>();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private placeBombKey?: Phaser.Input.Keyboard.Key;
  private mapGraphics?: Phaser.GameObjects.Graphics;
  private selfId: string | null = null;
  private localAvatar?: Avatar;
  private lastDirection: Direction = "down";
  private sequence = 0;
  private lastInputState: PlayerInputPayload = {
    direction: "down",
    moving: false,
    seq: 0
  };
  private readonly handleWindowBlur = () => {
    this.resetInputState();
  };
  private readonly handleVisibilityChange = () => {
    if (document.hidden) {
      this.resetInputState();
    }
  };

  constructor(options: SceneOptions) {
    super("MultiplayerScene");
    this.socket = options.socket;
    this.nickname = options.nickname;
    this.onConnectionChange = options.onConnectionChange;
    this.onPlayerCountChange = options.onPlayerCountChange;
  }

  preload() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.placeBombKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  create() {
    this.mapGraphics = this.add.graphics();
    drawMap(this.mapGraphics);

    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    this.bindSocketEvents();
    window.addEventListener("blur", this.handleWindowBlur);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupScene, this);
  }

  update(_: number, delta: number) {
    this.updateLocalPlayer(delta);
    this.updateAllPlayers(delta);
  }

  private bindSocketEvents() {
    this.socket.on("connect", () => {
      this.onConnectionChange(true);
      this.socket.emit("player:join", { nickname: this.nickname });
    });

    this.socket.on("disconnect", () => {
      this.onConnectionChange(false);
    });

    this.socket.on("world:init", (payload) => {
      this.handleWorldInit(payload);
    });

    this.socket.on("player:joined", (payload) => {
      if (payload.id === this.selfId) {
        return;
      }

      if (!this.remotePlayers.has(payload.id)) {
        const avatar = this.createAvatar(payload, false);
        this.remotePlayers.set(payload.id, avatar);
        this.syncPlayerCount();
      }
    });

    this.socket.on("player:updated", (payload) => {
      this.handleRemoteMove(payload);
    });

    this.socket.on("bomb:placed", (payload) => {
      this.handleBombPlaced(payload);
    });

    this.socket.on("player:left", ({ id }) => {
      const avatar = this.remotePlayers.get(id);
      if (!avatar) {
        return;
      }

      avatar.root.destroy(true);
      this.remotePlayers.delete(id);
      this.syncPlayerCount();
    });
  }

  private handleWorldInit(payload: WorldInitPayload) {
    this.selfId = payload.selfId;

    if (payload.mapId !== MAP_ID) {
      return;
    }

    this.remotePlayers.forEach((avatar) => avatar.root.destroy(true));
    this.remotePlayers.clear();
    this.clearBombs();
    this.localAvatar?.root.destroy(true);
    this.localAvatar = undefined;

    payload.players.forEach((player) => {
      if (player.id === payload.selfId) {
        this.localAvatar = this.createAvatar(player, true);
        this.lastDirection = player.direction;
        this.cameras.main.startFollow(this.localAvatar.root, true, 0.15, 0.15);
        return;
      }

      this.remotePlayers.set(player.id, this.createAvatar(player, false));
    });

    payload.bombs.forEach((bomb) => {
      this.bombs.set(bomb.id, this.createBombView(bomb));
    });

    if (!this.localAvatar) {
      const fallbackState: PlayerState = {
        id: payload.selfId,
        nickname: this.nickname,
        tileX: 1,
        tileY: 1,
        pixelX: SPAWN_POINT.x,
        pixelY: SPAWN_POINT.y,
        direction: "down",
        moving: false,
        alive: true,
        maxBombs: 1,
        activeBombs: 0,
        flameRange: 1,
        moveSpeed: PLAYER_SPEED
      };
      this.localAvatar = this.createAvatar(fallbackState, true);
      this.cameras.main.startFollow(this.localAvatar.root, true, 0.15, 0.15);
    }

    this.syncPlayerCount();
  }

  private createAvatar(player: PlayerState, isLocal: boolean): Avatar {
    const sprite = this.add.rectangle(0, 0, PLAYER_SIZE, PLAYER_SIZE, isLocal ? 0xf59e0b : 0x38bdf8, 1);
    sprite.setStrokeStyle(3, isLocal ? 0xfef3c7 : 0xe0f2fe, 1);

    const label = this.add.text(0, -28, player.nickname, {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 4
    });
    label.setOrigin(0.5, 0.5);

    const root = this.add.container(player.pixelX, player.pixelY, [sprite, label]);
    root.setSize(PLAYER_SIZE, PLAYER_SIZE);

    return {
      root,
      sprite,
      label,
      state: { ...player },
      targetX: player.pixelX,
      targetY: player.pixelY
    };
  }

  private updateLocalPlayer(_: number) {
    if (!this.localAvatar || !this.cursors) {
      return;
    }

    if (this.placeBombKey && Phaser.Input.Keyboard.JustDown(this.placeBombKey)) {
      this.socket.emit("bomb:place");
    }

    let moving = false;
    let direction = this.lastDirection;

    if (this.cursors.left.isDown) {
      direction = "left";
      moving = true;
    } else if (this.cursors.right.isDown) {
      direction = "right";
      moving = true;
    }

    if (this.cursors.up.isDown) {
      direction = "up";
      moving = true;
    } else if (this.cursors.down.isDown) {
      direction = "down";
      moving = true;
    }

    this.lastDirection = direction;
    this.localAvatar.state.direction = direction;
    this.localAvatar.sprite.setFillStyle(moving ? 0xfb923c : 0xf59e0b, 1);
    this.localAvatar.label.setText(`${this.nickname}${moving ? " · move" : ""}`);

    if (this.lastInputState.direction === direction && this.lastInputState.moving === moving) {
      return;
    }

    this.sequence += 1;
    const payload: PlayerInputPayload = {
      direction,
      moving,
      seq: this.sequence
    };
    this.lastInputState = payload;
    this.socket.emit("player:input", payload);
  }

  private updateAllPlayers(delta: number) {
    const easing = Math.min(1, (delta / 1000) * 10);

    if (this.localAvatar) {
      const localX = Phaser.Math.Linear(this.localAvatar.root.x, this.localAvatar.targetX, easing);
      const localY = Phaser.Math.Linear(this.localAvatar.root.y, this.localAvatar.targetY, easing);
      this.localAvatar.root.setPosition(localX, localY);
    }

    this.remotePlayers.forEach((avatar) => {
      const x = Phaser.Math.Linear(avatar.root.x, avatar.targetX, easing);
      const y = Phaser.Math.Linear(avatar.root.y, avatar.targetY, easing);
      avatar.root.setPosition(x, y);
      avatar.sprite.setFillStyle(avatar.state.moving ? 0x7dd3fc : 0x38bdf8, 1);
      avatar.label.setText(`${avatar.state.nickname}${avatar.state.moving ? " · move" : ""}`);
    });
  }

  private handleRemoteMove(payload: PlayerUpdatedPayload) {
    if (payload.id === this.selfId) {
      this.reconcileLocalAvatar(payload);
      return;
    }

    const avatar = this.remotePlayers.get(payload.id);
    if (!avatar) {
      return;
    }

    avatar.targetX = payload.pixelX;
    avatar.targetY = payload.pixelY;
    avatar.state = {
      ...avatar.state,
      ...payload
    };
  }

  private handleBombPlaced(payload: BombPlacedPayload) {
    const existingView = this.bombs.get(payload.bomb.id);
    if (existingView) {
      existingView.state = payload.bomb;
    } else {
      this.bombs.set(payload.bomb.id, this.createBombView(payload.bomb));
    }

    if (payload.playerId === this.selfId && this.localAvatar) {
      this.localAvatar.state.activeBombs = payload.activeBombs;
    }

    const ownerAvatar = payload.playerId === this.selfId ? this.localAvatar : this.remotePlayers.get(payload.playerId);
    if (ownerAvatar) {
      ownerAvatar.state.activeBombs = payload.activeBombs;
    }
  }

  private reconcileLocalAvatar(payload: PlayerUpdatedPayload) {
    if (!this.localAvatar) {
      return;
    }

    const deltaX = payload.pixelX - this.localAvatar.root.x;
    const deltaY = payload.pixelY - this.localAvatar.root.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance >= SELF_RECONCILE_SNAP_DISTANCE) {
      this.localAvatar.root.setPosition(payload.pixelX, payload.pixelY);
    } else if (distance >= SELF_RECONCILE_IGNORE_DISTANCE) {
      const nextX = Phaser.Math.Linear(this.localAvatar.root.x, payload.pixelX, SELF_RECONCILE_LERP_FACTOR);
      const nextY = Phaser.Math.Linear(this.localAvatar.root.y, payload.pixelY, SELF_RECONCILE_LERP_FACTOR);
      this.localAvatar.root.setPosition(nextX, nextY);
    }

    this.localAvatar.targetX = this.localAvatar.root.x;
    this.localAvatar.targetY = this.localAvatar.root.y;
    this.localAvatar.state = {
      ...this.localAvatar.state,
      ...payload,
      pixelX: this.localAvatar.root.x,
      pixelY: this.localAvatar.root.y,
      tileX: Math.floor(this.localAvatar.root.x / TILE_SIZE),
      tileY: Math.floor(this.localAvatar.root.y / TILE_SIZE)
    };
  }

  private syncPlayerCount() {
    const localCount = this.localAvatar ? 1 : 0;
    this.onPlayerCountChange(localCount + this.remotePlayers.size);
  }

  private resetInputState() {
    this.input.keyboard?.resetKeys();
    this.stopLocalMovement();
  }

  private stopLocalMovement() {
    if (!this.localAvatar) {
      return;
    }

    if (!this.localAvatar.state.moving) {
      return;
    }

    this.localAvatar.state.moving = false;
    this.localAvatar.sprite.setFillStyle(0xf59e0b, 1);
    this.localAvatar.label.setText(this.nickname);
    this.sequence += 1;

    const payload: PlayerInputPayload = {
      direction: this.lastDirection,
      moving: false,
      seq: this.sequence
    };

    this.lastInputState = payload;
    this.socket.emit("player:input", payload);
  }

  private cleanupScene() {
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.clearBombs();
  }

  private createBombView(bomb: BombState): BombView {
    const body = this.add.circle(0, 4, 14, 0x111827, 1);
    body.setStrokeStyle(3, 0x94a3b8, 1);

    const fuse = this.add.rectangle(0, -10, 6, 10, 0xf59e0b, 1);
    fuse.setStrokeStyle(2, 0xfef3c7, 1);

    const root = this.add.container(bomb.tileX * TILE_SIZE + TILE_SIZE / 2, bomb.tileY * TILE_SIZE + TILE_SIZE / 2, [body, fuse]);
    root.setDepth(10);

    return {
      root,
      body,
      fuse,
      state: { ...bomb }
    };
  }

  private clearBombs() {
    this.bombs.forEach((bomb) => bomb.root.destroy(true));
    this.bombs.clear();
  }
}
