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
  mediaRevision: number;
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
      mediaRevision: 0,
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
  }
  return globalForSync.__freeFloorSync;
}

export function getSyncSnapshot() {
  const state = getState();
  return {
    currentImage: state.currentImage,
    nextImage: state.nextImage,
    mediaRevision: state.mediaRevision,
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

export function setCurrentImage(image: string | null) {
  const state = getState();
  state.currentImage = image;
  state.updatedAt = Date.now();
}

export function setNextImage(image: string | null) {
  const state = getState();
  state.nextImage = image;
  state.updatedAt = Date.now();
}

export function setDuelInfo(info: DuelSyncInfo | null) {
  const state = getState();
  state.duelInfo = info;
  state.updatedAt = Date.now();
}

export function updateDuelMedia(payload: {
  mediaRevision: number;
  currentImage: string | null;
  nextImage: string | null;
  duelInfo?: DuelSyncInfo | null;
}): boolean {
  const state = getState();
  const clearingDuel = payload.duelInfo === null;
  if (payload.mediaRevision <= state.mediaRevision && !clearingDuel) {
    return false;
  }
  state.currentImage = payload.currentImage;
  state.nextImage = payload.nextImage;
  if (payload.duelInfo !== undefined) {
    state.duelInfo = payload.duelInfo;
  }
  state.mediaRevision = Math.max(state.mediaRevision + (clearingDuel ? 1 : 0), payload.mediaRevision);
  state.updatedAt = Date.now();
  return true;
}

export function queueAdminAction(action: AdminAction) {
  const state = getState();
  state.pendingAction = action;
  state.updatedAt = Date.now();
}

export function setSelectedCombatants(attackerId: string | null, defenderId: string | null) {
  const state = getState();
  state.selectedAttackerId = attackerId;
  state.selectedDefenderId = defenderId;
  state.updatedAt = Date.now();
}

export function requestDrawAttacker() {
  const state = getState();
  state.drawAttackerToken = Date.now();
  state.updatedAt = Date.now();
  return state.drawAttackerToken;
}

export function requestStartDuel(attackerId: string, defenderId: string) {
  const state = getState();
  state.pendingStartDuel = { attackerId, defenderId };
  state.startDuelToken = Date.now();
  state.updatedAt = Date.now();
  return state.startDuelToken;
}

export function clearDuelSyncState() {
  const state = getState();
  state.duelInfo = null;
  state.currentImage = null;
  state.nextImage = null;
  state.pendingAction = null;
  state.pendingStartDuel = null;
  state.mediaRevision += 1;
  state.updatedAt = Date.now();
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
  state.updatedAt = Date.now();
}

export function setGridSize(size: number) {
  const state = getState();
  state.gridSize = size;
  state.updatedAt = Date.now();
}

export function touchConfigUpdated() {
  const state = getState();
  state.configUpdatedAt = Date.now();
  state.updatedAt = Date.now();
}

export function touchCategoriesUpdated() {
  const state = getState();
  state.categoriesRevision = Date.now();
  state.updatedAt = Date.now();
}

export function consumePendingAction(): AdminAction | null {
  const state = getState();
  const action = state.pendingAction;
  state.pendingAction = null;
  if (action) {
    state.updatedAt = Date.now();
  }
  return action;
}
