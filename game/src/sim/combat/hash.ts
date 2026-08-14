type JsonSafe = boolean | number | string | null | readonly JsonSafe[] | { readonly [key: string]: JsonSafe };

const normalize = (value: unknown, path: string): JsonSafe => {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} must contain only finite numbers.`);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry, index) => normalize(entry, `${path}[${String(index)}]`));
  }
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const result: Record<string, JsonSafe> = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = normalize((value as Record<string, unknown>)[key], `${path}.${key}`);
    }
    return result;
  }
  throw new Error(`${path} must be JSON-safe plain data.`);
};

export const canonicalJson = (value: unknown): string => JSON.stringify(normalize(value, "$"));

export const hashCanonical = (value: unknown): string => {
  let hash = 0x811c_9dc5;
  for (const character of canonicalJson(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x0100_0193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
