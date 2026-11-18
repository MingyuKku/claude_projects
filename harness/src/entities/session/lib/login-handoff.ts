interface LoginCredential {
  id: string;
  password: string;
}

// Router state would be written to history and session-restore files on disk and
// survive reloads. Module memory lives only in this tab; if it is lost, `/expired`
// already sends the user back to the login page.
let pending: LoginCredential | null = null;

export function stashLoginCredential(credential: LoginCredential): void {
  pending = credential;
}

export function readLoginCredential(): LoginCredential | null {
  return pending;
}

export function clearLoginCredential(): void {
  pending = null;
}
