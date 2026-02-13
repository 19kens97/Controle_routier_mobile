// src/utils/authEvents.ts
type Listener = () => void;

const listeners = new Set<Listener>();

export function onAuthChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener); // ✅ ne retourne rien
  };
}

export function notifyAuthChanged() {
  for (const l of listeners) l();
}
