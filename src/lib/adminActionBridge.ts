type AdminActionHandlers = {
  onCorrect: (() => void) | null;
  onWrong: (() => void) | null;
};

export const adminActionHandlers: AdminActionHandlers = {
  onCorrect: null,
  onWrong: null,
};

export function registerAdminActionHandlers(handlers: Partial<AdminActionHandlers>) {
  if ("onCorrect" in handlers) adminActionHandlers.onCorrect = handlers.onCorrect ?? null;
  if ("onWrong" in handlers) adminActionHandlers.onWrong = handlers.onWrong ?? null;
}

export function clearAdminActionHandlers() {
  adminActionHandlers.onCorrect = null;
  adminActionHandlers.onWrong = null;
}
