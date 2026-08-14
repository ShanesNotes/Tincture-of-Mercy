interface CollisionPayload {
  readonly triangles: readonly (readonly number[])[];
  readonly vertices: readonly (readonly number[])[];
}

const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const sha256Hex = async (data: ArrayBuffer | Uint8Array): Promise<string> => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const buffer = new Uint8Array(bytes).buffer;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  return hex(new Uint8Array(digest));
};

const pythonFloat = (value: number): string => {
  if (!Number.isFinite(value)) {
    throw new Error("Collision coordinates must be finite.");
  }
  if (Object.is(value, -0)) return "-0.0";
  if (Number.isInteger(value)) return `${String(value)}.0`;
  return String(value);
};

/**
 * Exact browser equivalent of export_level.py collision_sha(): object keys are
 * sorted, separators are compact, triangle indices are ints and baked vertex
 * coordinates retain Python's float spelling (including 0.0). This is a
 * semantic hash, deliberately not the hash of the pretty-printed JSON file.
 */
export const canonicalCollisionJson = (payload: CollisionPayload): string => {
  const triangles = payload.triangles
    .map((triangle) => `[${triangle.map((value) => String(value)).join(",")}]`)
    .join(",");
  const vertices = payload.vertices
    .map((vertex) => `[${vertex.map(pythonFloat).join(",")}]`)
    .join(",");
  return `{"triangles":[${triangles}],"vertices":[${vertices}]}`;
};

export const collisionSemanticSha256 = async (payload: CollisionPayload): Promise<string> =>
  sha256Hex(new TextEncoder().encode(canonicalCollisionJson(payload)));

export const assertSha256 = async (
  data: ArrayBuffer | Uint8Array,
  expected: string,
  label: string,
): Promise<void> => {
  const actual = await sha256Hex(data);
  if (actual !== expected) {
    throw new Error(`${label} SHA-256 mismatch: expected ${expected}, received ${actual}.`);
  }
};
