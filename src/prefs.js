// localStorage can be missing or throw (private mode, blocked cookies), so never trust it
export function getPref(storage, key, fallback) {
  try {
    return storage?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function setPref(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // not worth breaking the page over
  }
}
