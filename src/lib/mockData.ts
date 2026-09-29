export function getStoredData<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(`shiv_infra_${key}`);
    if (!raw) {
      localStorage.setItem(`shiv_infra_${key}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaults;
  }
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`shiv_infra_${key}`, JSON.stringify(data));
  } catch {
    console.error('Error writing to localStorage');
  }
}
