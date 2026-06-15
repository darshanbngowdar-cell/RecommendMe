const DEFAULT_AUTH_RETURN_TO = "/";

export interface AuthNavigationState {
  returnTo?: string;
  prefillIdentifier?: string;
}

export function getAuthReturnTo(state: unknown, fallback: string = DEFAULT_AUTH_RETURN_TO): string {
  if (state && typeof state === "object") {
    const typedState = state as AuthNavigationState;
    if (typeof typedState.returnTo === "string" && typedState.returnTo.trim()) {
      return typedState.returnTo;
    }
  }

  return fallback;
}

export function buildAuthNavigationState(returnTo: string, prefillIdentifier?: string): AuthNavigationState {
  const state: AuthNavigationState = { returnTo };

  if (prefillIdentifier) {
    state.prefillIdentifier = prefillIdentifier;
  }

  return state;
}