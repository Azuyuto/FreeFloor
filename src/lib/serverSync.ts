export type AdminAction = "correct" | "wrong";

export type DuelSyncInfo = {
  attackerNickname: string;
  defenderNickname: string;
  category: string;
  status: string;
  currentTurnNickname: string;
  imageIndex: number;
  imageQueue: string[];
};

type ServerSyncState = {
  currentImage: string | null;
  nextImage: string | null;
  afterNextImage: string | null;
  syncGeneration: number;
  pendingAction: AdminAction | null;
  duelInfo: DuelSyncInfo | null;
  selectedAttackerId: string | null;
  selectedDefenderId: string | null;
  playersUpdatedAt: number;
  configUpdatedAt: number;
  gridSize: number;
  drawAttackerToken: number;
  startDuelToken: number;
  pendingStartDuel: { attackerId: string; defenderId: string } | null;
  cancelDuelToken: number;
  categoriesRevision: number;
  updatedAt: number;
};

const globalForSync = globalThis as typeof globalThis & {
  __freeFloorSync?: ServerSyncState;
};

function getState(): ServerSyncState {
  if (!globalForSync.__freeFloorSync) {
    globalForSync.__freeFloorSync = {
      currentImage: null,
      nextImage: null,
      afterNextImage: null,
      syncGeneration: 0,
      pendingAction: null,
      duelInfo: null,
      selectedAttackerId: null,
      selectedDefenderId: null,
      playersUpdatedAt: 0,
      configUpdatedAt: 0,
      gridSize: 4,
      drawAttackerToken: 0,
      startDuelToken: 0,
      pendingStartDuel: null,
      cancelDuelToken: 0,
      categoriesRevision: 0,
      updatedAt: Date.now(),
    };
  } else if (!("afterNextImage" in globalForSync.__freeFloorSync)) {
    (globalForSync.__freeFloorSync as ServerSyncState).afterNextImage = null;
  }
  return globalForSync.__freeFloorSync;
}

function bumpSync(state: ServerSyncState) {
  state.syncGeneration += 1;
  state.updatedAt = Date.now();
}

export function getSyncSnapshot() {
  const state = getState();
  return {
    currentImage: state.currentImage,
    nextImage: state.nextImage,
    afterNextImage: state.afterNextImage,
    syncGeneration: state.syncGeneration,
    pendingAction: state.pendingAction,
    duelInfo: state.duelInfo,
    selectedAttackerId: state.selectedAttackerId,
    selectedDefenderId: state.selectedDefenderId,
    playersUpdatedAt: state.playersUpdatedAt,
    configUpdatedAt: state.configUpdatedAt,
    gridSize: state.gridSize,
    drawAttackerToken: state.drawAttackerToken,
    startDuelToken: state.startDuelToken,
    pendingStartDuel: state.pendingStartDuel,
    cancelDuelToken: state.cancelDuelToken,
    categoriesRevision: state.categoriesRevision,
    updatedAt: state.updatedAt,
  };
}

/** Gra zawsze nadpisuje pełny stan — bez kolejkowania po revision z klienta. */
export function applyGameSync(payload: {
  currentImage: string | null;
  nextImage: string | null;
  afterNextImage: string | null;
  duelInfo: DuelSyncInfo | null;
}) {
  const state = getState();
  state.currentImage = payload.currentImage;
  state.nextImage = payload.nextImage;
  state.afterNextImage = payload.afterNextImage;
  state.duelInfo = payload.duelInfo;
  bumpSync(state);
}

export function setCurrentImage(image: string | null) {
  const state = getState();
  state.currentImage = image;
  bumpSync(state);
}

export function setNextImage(image: string | null) {
  const state = getState();
  state.nextImage = image;
  bumpSync(state);
}

export function setAfterNextImage(image: string | null) {
  const state = getState();
  state.afterNextImage = image;
  bumpSync(state);
}

export function setDuelInfo(info: DuelSyncInfo | null) {
  const state = getState();
  state.duelInfo = info;
  bumpSync(state);
}

export function queueAdminAction(action: AdminAction) {
  const state = getState();
  state.pendingAction = action;
  bumpSync(state);
}

export function setSelectedCombatants(attackerId: string | null, defenderId: string | null) {
  const state = getState();
  state.selectedAttackerId = attackerId;
  state.selectedDefenderId = defenderId;
  bumpSync(state);
}

export function requestDrawAttacker() {
  const state = getState();
  state.drawAttackerToken = Date.now();
  bumpSync(state);
  return state.drawAttackerToken;
}

export function requestStartDuel(attackerId: string, defenderId: string) {
  const state = getState();
  state.pendingStartDuel = { attackerId, defenderId };
  state.startDuelToken = Date.now();
  bumpSync(state);
  return state.startDuelToken;
}

/** Konsumuj żądanie startu — bez tego pending zostaje i może odpalić rundę ponownie. */
export function consumePendingStartDuel(): { attackerId: string; defenderId: string } | null {
  const state = getState();
  const pending = state.pendingStartDuel;
  state.pendingStartDuel = null;
  if (pending) {
    bumpSync(state);
  }
  return pending;
}

export function clearDuelSyncState() {
  const state = getState();
  state.duelInfo = null;
  state.currentImage = null;
  state.nextImage = null;
  state.afterNextImage = null;
  state.pendingAction = null;
  state.pendingStartDuel = null;
  bumpSync(state);
}

export function requestCancelDuel() {
  const state = getState();
  state.cancelDuelToken = Date.now();
  clearDuelSyncState();
  return state.cancelDuelToken;
}

export function touchPlayersUpdated() {
  const state = getState();
  state.playersUpdatedAt = Date.now();
  bumpSync(state);
}

export function setGridSize(size: number) {
  const state = getState();
  state.gridSize = size;
  bumpSync(state);
}

export function touchConfigUpdated() {
  const state = getState();
  state.configUpdatedAt = Date.now();
  bumpSync(state);
}

export function touchCategoriesUpdated() {
  const state = getState();
  state.categoriesRevision = Date.now();
  bumpSync(state);
}

export function consumePendingAction(): AdminAction | null {
  const state = getState();
  const action = state.pendingAction;
  state.pendingAction = null;
  if (action) {
    bumpSync(state);
  }
  return action;
}
