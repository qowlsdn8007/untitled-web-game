import Phaser from "phaser";
import {
  MAP_HEIGHT,
  MAP_ID,
  MAP_WIDTH,
  PLAYER_SPEED,
  SPAWN_POINT,
  TILE_SIZE,
  type Direction,
  type MovePayload,
  type PlayerUpdatedPayload,
  type PlayerState,
  type WorldInitPayload
} from "../../shared/protocol";
import { isBlockedAt } from "../../shared/map";
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
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private mapGraphics?: Phaser.GameObjects.Graphics;
  private selfId: string | null = null;
  private localAvatar?: Avatar;
  private lastDirection: Direction = "down";
  private lastSent = 0;
  private sequence = 0;
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
    this.updateRemotePlayers(delta);
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

  private updateLocalPlayer(delta: number) {
    if (!this.localAvatar || !this.cursors) {
      return;
    }

    const previousX = this.localAvatar.state.pixelX;
    const previousY = this.localAvatar.state.pixelY;
    const previousMoving = this.localAvatar.state.moving;
    const input = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown) {
      input.x -= 1;
      this.lastDirection = "left";
    } else if (this.cursors.right.isDown) {
      input.x += 1;
      this.lastDirection = "right";
    }

    if (this.cursors.up.isDown) {
      input.y -= 1;
      this.lastDirection = "up";
    } else if (this.cursors.down.isDown) {
      input.y += 1;
      this.lastDirection = "down";
    }

    const isMoving = input.lengthSq() > 0;
    if (isMoving) {
      input.normalize();
    }

    const distance = (PLAYER_SPEED * delta) / 1000;
    const nextX = this.localAvatar.root.x + input.x * distance;
    const nextY = this.localAvatar.root.y + input.y * distance;

    const resolved = this.resolveCollision(nextX, nextY, this.localAvatar.root.x, this.localAvatar.root.y);
    this.localAvatar.root.setPosition(resolved.x, resolved.y);
    this.localAvatar.state.pixelX = resolved.x;
    this.localAvatar.state.pixelY = resolved.y;
    this.localAvatar.state.tileX = Math.floor(resolved.x / TILE_SIZE);
    this.localAvatar.state.tileY = Math.floor(resolved.y / TILE_SIZE);
    this.localAvatar.state.direction = this.lastDirection;
    this.localAvatar.state.moving = isMoving;

    this.localAvatar.sprite.setFillStyle(isMoving ? 0xfb923c : 0xf59e0b, 1);
    this.localAvatar.label.setText(`${this.nickname}${isMoving ? " · move" : ""}`);

    const now = this.time.now;
    const changedEnough =
      Math.abs(previousX - resolved.x) > 1 ||
      Math.abs(previousY - resolved.y) > 1 ||
      previousMoving !== isMoving;

    if (!changedEnough && now - this.lastSent < 100) {
      return;
    }

    this.localAvatar.targetX = resolved.x;
    this.localAvatar.targetY = resolved.y;
    this.lastSent = now;
    this.sequence += 1;

    const payload: MovePayload = {
      x: resolved.x,
      y: resolved.y,
      direction: this.lastDirection,
      moving: isMoving,
      seq: this.sequence
    };

    this.socket.emit("player:move", payload);
  }

  private updateRemotePlayers(delta: number) {
    const easing = Math.min(1, (delta / 1000) * 10);

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

  private resolveCollision(nextX: number, nextY: number, currentX: number, currentY: number) {
    const half = PLAYER_SIZE / 2;
    const candidateX = this.canOccupy(nextX, currentY, half) ? nextX : currentX;
    const candidateY = this.canOccupy(candidateX, nextY, half) ? nextY : currentY;

    return {
      x: Phaser.Math.Clamp(candidateX, half, MAP_WIDTH * TILE_SIZE - half),
      y: Phaser.Math.Clamp(candidateY, half, MAP_HEIGHT * TILE_SIZE - half)
    };
  }

  private canOccupy(x: number, y: number, half: number): boolean {
    return !(
      isBlockedAt(x - half, y - half) ||
      isBlockedAt(x + half, y - half) ||
      isBlockedAt(x - half, y + half) ||
      isBlockedAt(x + half, y + half)
    );
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
    this.lastSent = this.time.now;
    this.sequence += 1;

    const payload: MovePayload = {
      x: this.localAvatar.state.pixelX,
      y: this.localAvatar.state.pixelY,
      direction: this.lastDirection,
      moving: false,
      seq: this.sequence
    };

    this.socket.emit("player:move", payload);
  }

  private cleanupScene() {
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }
}
