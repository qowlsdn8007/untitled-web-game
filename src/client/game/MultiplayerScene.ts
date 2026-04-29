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
  type FlameState,
  type JoinMode,
  type PlayerInputPayload,
  type PlayerUpdatedPayload,
  type PlayerState,
  type PowerUpState,
  type TileType,
  type WorldUpdatedPayload,
  type WorldInitPayload
} from "../../shared/protocol";
import { drawMap } from "./map";
import type { GameSocket } from "../network/gameSocket";

type SceneOptions = {
  socket: GameSocket;
  nickname: string;
  roomId: string;
  joinMode: JoinMode;
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

type FlameView = {
  root: Phaser.GameObjects.Rectangle;
  state: FlameState;
};

type PowerUpView = {
  root: Phaser.GameObjects.Container;
  marker: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  state: PowerUpState;
};

const PLAYER_SIZE = 28;
const SELF_RECONCILE_IGNORE_DISTANCE = 12;
const SELF_RECONCILE_SNAP_DISTANCE = 96;
const SELF_RECONCILE_LERP_FACTOR = 0.35;

export class MultiplayerScene extends Phaser.Scene {
  private readonly socket: GameSocket;
  private readonly nickname: string;
  private readonly roomId: string;
  private readonly joinMode: JoinMode;
  private readonly onConnectionChange: SceneOptions["onConnectionChange"];
  private readonly onPlayerCountChange: SceneOptions["onPlayerCountChange"];
  private readonly remotePlayers = new Map<string, Avatar>();
  private readonly bombs = new Map<string, BombView>();
  private readonly flames = new Map<string, FlameView>();
  private readonly powerUps = new Map<string, PowerUpView>();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private placeBombKey?: Phaser.Input.Keyboard.Key;
  private mapGraphics?: Phaser.GameObjects.Graphics;
  private currentGrid: TileType[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => "empty" as TileType)
  );
  private selfId: string | null = null;
  private localAvatar?: Avatar;
  private spectatorFollowId: string | null = null;
  private lastExplosionFeedbackAt = 0;
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
    this.roomId = options.roomId;
    this.joinMode = options.joinMode;
    this.onConnectionChange = options.onConnectionChange;
    this.onPlayerCountChange = options.onPlayerCountChange;
  }

  preload() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.placeBombKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  create() {
    this.mapGraphics = this.add.graphics();
    drawMap(this.mapGraphics, this.currentGrid);

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
      this.socket.emit("player:join", {
        nickname: this.nickname,
        roomId: this.roomId,
        joinMode: this.joinMode
      });
    });

    this.socket.on("disconnect", () => {
      this.onConnectionChange(false);
    });

    this.socket.on("world:init", (payload) => {
      this.handleWorldInit(payload);
    });

    this.socket.on("world:updated", (payload) => {
      this.handleWorldUpdated(payload);
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

    this.currentGrid = payload.grid.map((row) => [...row]);
    if (this.mapGraphics) {
      drawMap(this.mapGraphics, this.currentGrid);
    }

    this.remotePlayers.forEach((avatar) => avatar.root.destroy(true));
    this.remotePlayers.clear();
    this.clearBombs();
    this.clearFlames();
    this.clearPowerUps();
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

    payload.flames.forEach((flame) => {
      this.flames.set(this.toTileKey(flame.tileX, flame.tileY), this.createFlameView(flame));
    });

    payload.powerUps.forEach((powerUp) => {
      this.powerUps.set(powerUp.id, this.createPowerUpView(powerUp));
    });

    if (!this.localAvatar) {
      const fallbackState: PlayerState = {
        id: payload.selfId,
        nickname: this.nickname,
        ready: false,
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

    if (!this.localAvatar.state.alive) {
      this.stopLocalMovement();
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
      this.localAvatar.sprite.setFillStyle(this.localAvatar.state.alive ? 0xf59e0b : 0x7f1d1d, 1);
      this.localAvatar.label.setText(this.formatAvatarLabel(this.localAvatar.state, true));
    }

    this.remotePlayers.forEach((avatar) => {
      const x = Phaser.Math.Linear(avatar.root.x, avatar.targetX, easing);
      const y = Phaser.Math.Linear(avatar.root.y, avatar.targetY, easing);
      avatar.root.setPosition(x, y);
      avatar.sprite.setFillStyle(avatar.state.alive ? (avatar.state.moving ? 0x7dd3fc : 0x38bdf8) : 0x334155, 1);
      avatar.label.setText(this.formatAvatarLabel(avatar.state, false));
    });

    this.updateCameraTarget();
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

    const wasAlive = avatar.state.alive;
    avatar.targetX = payload.pixelX;
    avatar.targetY = payload.pixelY;
    avatar.state = {
      ...avatar.state,
      ...payload
    };

    if (wasAlive && !avatar.state.alive) {
      this.showKoEffect(avatar);
    }
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

  private handleWorldUpdated(payload: WorldUpdatedPayload) {
    this.currentGrid = payload.grid.map((row) => [...row]);
    if (this.mapGraphics) {
      drawMap(this.mapGraphics, this.currentGrid);
    }

    this.syncBombViews(payload.bombs);
    this.syncFlameViews(payload.flames);
    this.syncPowerUpViews(payload.powerUps);

    payload.playerBombs.forEach((playerBomb) => {
      if (playerBomb.id === this.selfId && this.localAvatar) {
        this.localAvatar.state.activeBombs = playerBomb.activeBombs;
        return;
      }

      const avatar = this.remotePlayers.get(playerBomb.id);
      if (avatar) {
        avatar.state.activeBombs = playerBomb.activeBombs;
      }
    });
  }

  private reconcileLocalAvatar(payload: PlayerUpdatedPayload) {
    if (!this.localAvatar) {
      return;
    }

    const wasAlive = this.localAvatar.state.alive;
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

    if (wasAlive && !this.localAvatar.state.alive) {
      this.showKoEffect(this.localAvatar);
    }
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

  private formatAvatarLabel(player: PlayerState, isLocal: boolean) {
    if (!player.alive) {
      return `${player.nickname} · KO`;
    }

    if (isLocal && player.moving) {
      return `${player.nickname} · move`;
    }

    if (!isLocal && player.moving) {
      return `${player.nickname} · move`;
    }

    return player.nickname;
  }

  private cleanupScene() {
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.clearBombs();
    this.clearFlames();
    this.clearPowerUps();
  }

  private updateCameraTarget() {
    if (!this.localAvatar) {
      return;
    }

    if (this.localAvatar.state.alive) {
      if (this.spectatorFollowId !== this.selfId) {
        this.cameras.main.startFollow(this.localAvatar.root, true, 0.15, 0.15);
        this.spectatorFollowId = this.selfId;
      }
      return;
    }

    const aliveRemoteAvatar = [...this.remotePlayers.values()].find((avatar) => avatar.state.alive);
    if (!aliveRemoteAvatar) {
      return;
    }

    if (this.spectatorFollowId === aliveRemoteAvatar.state.id) {
      return;
    }

    this.cameras.main.startFollow(aliveRemoteAvatar.root, true, 0.12, 0.12);
    this.spectatorFollowId = aliveRemoteAvatar.state.id;
  }

  private createBombView(bomb: BombState): BombView {
    const body = this.add.circle(0, 4, 14, 0x111827, 1);
    body.setStrokeStyle(3, 0x94a3b8, 1);

    const fuse = this.add.rectangle(0, -10, 6, 10, 0xf59e0b, 1);
    fuse.setStrokeStyle(2, 0xfef3c7, 1);

    const root = this.add.container(bomb.tileX * TILE_SIZE + TILE_SIZE / 2, bomb.tileY * TILE_SIZE + TILE_SIZE / 2, [body, fuse]);
    root.setDepth(10);
    root.setScale(0.82);

    this.tweens.add({
      targets: root,
      scale: 1,
      duration: 130,
      ease: "Back.easeOut"
    });

    this.tweens.add({
      targets: root,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

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

  private createFlameView(flame: FlameState): FlameView {
    const root = this.add.rectangle(
      flame.tileX * TILE_SIZE + TILE_SIZE / 2,
      flame.tileY * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE - 10,
      TILE_SIZE - 10,
      0xf97316,
      0.8
    );
    root.setStrokeStyle(3, 0xfef08a, 1);
    root.setDepth(9);
    root.setScale(0.4);

    this.playExplosionFeedback();
    this.tweens.add({
      targets: root,
      scale: 1,
      duration: 120,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: root,
      alpha: 0.45,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    return {
      root,
      state: { ...flame }
    };
  }

  private clearFlames() {
    this.flames.forEach((flame) => flame.root.destroy(true));
    this.flames.clear();
  }

  private createPowerUpView(powerUp: PowerUpState): PowerUpView {
    const { fillColor, text } = getPowerUpVisual(powerUp.type);
    const marker = this.add.rectangle(0, 0, 22, 22, fillColor, 1);
    marker.setStrokeStyle(2, 0xf8fafc, 0.8);
    const label = this.add.text(0, 0, text, {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 3
    });
    label.setOrigin(0.5, 0.5);

    const root = this.add.container(powerUp.tileX * TILE_SIZE + TILE_SIZE / 2, powerUp.tileY * TILE_SIZE + TILE_SIZE / 2, [marker, label]);
    root.setDepth(8);

    return {
      root,
      marker,
      label,
      state: { ...powerUp }
    };
  }

  private clearPowerUps() {
    this.powerUps.forEach((powerUp) => powerUp.root.destroy(true));
    this.powerUps.clear();
  }

  private syncBombViews(bombs: BombState[]) {
    const nextBombIds = new Set(bombs.map((bomb) => bomb.id));

    this.bombs.forEach((bomb, bombId) => {
      if (!nextBombIds.has(bombId)) {
        bomb.root.destroy(true);
        this.bombs.delete(bombId);
      }
    });

    bombs.forEach((bomb) => {
      const existing = this.bombs.get(bomb.id);
      if (existing) {
        existing.state = { ...bomb };
        return;
      }

      this.bombs.set(bomb.id, this.createBombView(bomb));
    });
  }

  private syncFlameViews(flames: FlameState[]) {
    const nextFlameKeys = new Set(flames.map((flame) => this.toTileKey(flame.tileX, flame.tileY)));

    this.flames.forEach((flame, flameKey) => {
      if (!nextFlameKeys.has(flameKey)) {
        flame.root.destroy(true);
        this.flames.delete(flameKey);
      }
    });

    flames.forEach((flame) => {
      const flameKey = this.toTileKey(flame.tileX, flame.tileY);
      const existing = this.flames.get(flameKey);
      if (existing) {
        existing.state = { ...flame };
        return;
      }

      this.flames.set(flameKey, this.createFlameView(flame));
    });
  }

  private syncPowerUpViews(powerUps: PowerUpState[]) {
    const nextPowerUpIds = new Set(powerUps.map((powerUp) => powerUp.id));

    this.powerUps.forEach((powerUp, powerUpId) => {
      if (!nextPowerUpIds.has(powerUpId)) {
        this.showPowerUpPickupEffect(powerUp);
        powerUp.root.destroy(true);
        this.powerUps.delete(powerUpId);
      }
    });

    powerUps.forEach((powerUp) => {
      const existing = this.powerUps.get(powerUp.id);
      if (existing) {
        existing.state = { ...powerUp };
        return;
      }

      this.powerUps.set(powerUp.id, this.createPowerUpView(powerUp));
    });
  }

  private toTileKey(tileX: number, tileY: number) {
    return `${tileX},${tileY}`;
  }

  private showPowerUpPickupEffect(powerUp: PowerUpView) {
    const popup = this.add.text(powerUp.root.x, powerUp.root.y - 18, `+${getPowerUpVisual(powerUp.state.type).text}`, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 4
    });
    popup.setOrigin(0.5, 0.5);
    popup.setDepth(12);

    this.tweens.add({
      targets: popup,
      y: popup.y - 18,
      alpha: 0,
      duration: 450,
      ease: "Quad.easeOut",
      onComplete: () => {
        popup.destroy();
      }
    });
  }

  private showKoEffect(avatar: Avatar) {
    const ring = this.add.circle(avatar.root.x, avatar.root.y, 16, 0xf87171, 0.24);
    ring.setStrokeStyle(4, 0xfca5a5, 0.95);
    ring.setDepth(13);

    const text = this.add.text(avatar.root.x, avatar.root.y - 34, "KO", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#fecaca",
      stroke: "#450a0a",
      strokeThickness: 5
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(14);

    this.tweens.add({
      targets: ring,
      radius: 34,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => {
        ring.destroy();
      }
    });

    this.tweens.add({
      targets: text,
      y: text.y - 22,
      alpha: 0,
      duration: 620,
      ease: "Quad.easeOut",
      onComplete: () => {
        text.destroy();
      }
    });
  }

  private playExplosionFeedback() {
    const now = this.time.now;
    if (now - this.lastExplosionFeedbackAt < 140) {
      return;
    }

    this.lastExplosionFeedbackAt = now;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.cameras.main.flash(90, 249, 115, 22, true);
      return;
    }

    this.cameras.main.shake(130, 0.006);
    this.cameras.main.flash(110, 249, 115, 22, true);
  }
}

function getPowerUpVisual(type: PowerUpState["type"]) {
  switch (type) {
    case "bomb_up":
      return { fillColor: 0x2563eb, text: "B" };
    case "flame_up":
      return { fillColor: 0xea580c, text: "F" };
    case "speed_up":
      return { fillColor: 0x16a34a, text: "S" };
  }
}
