import type { WorldActorKind } from "../../sim/world/types";
import type { Group, Object3D, Scene } from "three";

import type { AudioSourceEvent } from "../../app/audio";
import type { CollisionQueries } from "../../sim/motion";
import type { SidecarData } from "../../sim/combat";
import type { CollisionWorld } from "../collision";

export type Point3 = Readonly<{ x: number; y: number; z: number }>;

export interface LevelZoneManifest {
  readonly collision: string;
  readonly sha256: string;
  readonly triCount: number;
  readonly visualGlb: string;
  readonly visualSha256: string;
}

export interface LevelManifest {
  readonly schema: "tincture.level.v0";
  readonly nav: string;
  readonly placements: string;
  readonly zones: Readonly<Record<string, LevelZoneManifest>>;
}

export interface Placement {
  readonly id: string;
  readonly kind: string;
  readonly position: readonly [number, number, number];
  readonly lookAt?: readonly [number, number, number];
  readonly key?: string;
  readonly pack?: string;
  readonly role?: string;
  readonly zone?: string;
  readonly [key: string]: unknown;
}

export interface PlacementCatalog {
  readonly schema: string;
  readonly all: readonly Placement[];
  readonly spawns: readonly Placement[];
  readonly cameras: readonly Placement[];
  readonly hearths: readonly Placement[];
  readonly [key: string]: unknown;
}

export interface NavGraphDocument {
  readonly nodes: readonly unknown[];
  readonly edges: readonly unknown[];
  readonly offMeshLinks: readonly unknown[];
  readonly [key: string]: unknown;
}

export interface SidecarCapsule {
  readonly name: string;
  readonly a: readonly [number, number, number];
  readonly b: readonly [number, number, number];
  readonly r: number;
}

export interface SidecarFrame {
  readonly tick: number;
  readonly capsules: readonly SidecarCapsule[];
}

export type ClipSidecar = SidecarData;

export interface CharacterManifest {
  readonly character: string;
  readonly glb: string;
  readonly glbHash: string;
  readonly sidecars: readonly string[];
}

export interface CharacterAssets {
  readonly character: "kalev" | "wolf";
  readonly template: Group;
  readonly animations: readonly import("three").AnimationClip[];
  readonly sidecars: ReadonlyMap<string, ClipSidecar>;
  readonly sidecarsByFile: ReadonlyMap<string, ClipSidecar>;
  readonly visualClips: Readonly<Record<string, string>>;
  readonly fallbacks: Readonly<Record<string, string>>;
}

export type WorldCollisionQueries = CollisionQueries;

export interface AssetDiagnostic {
  readonly stage: "manifest" | "level" | "collision" | "character" | "animation";
  readonly message: string;
}

export interface LoadedIronwoodAssets {
  readonly levelRoot: Group;
  readonly collisionWorld: CollisionWorld;
  readonly collisionQueries: WorldCollisionQueries;
  readonly placements: PlacementCatalog;
  readonly placementById: ReadonlyMap<string, Placement>;
  readonly nav: NavGraphDocument;
  readonly characters: ReadonlyMap<"kalev" | "wolf", CharacterAssets>;
  /** Exact manifest filenames -> accepted sidecars for sim/world definition assembly. */
  readonly sidecarsByFile: ReadonlyMap<string, ClipSidecar>;
  readonly diagnostics: readonly AssetDiagnostic[];
  dispose(): void;
}

export interface ActorPresentation {
  readonly id: string;
  readonly kind: WorldActorKind;
  /** SIM-owned scheduler truth; dormant actors remain instantiated but freeze their neutral pose. */
  readonly active: boolean;
  readonly position: Point3;
  readonly facingRadians: number;
  readonly action: null | {
    readonly move: string;
    readonly tick: number;
  };
  readonly alive: boolean;
  readonly invulnerable: boolean;
  /** World-space capsules copied from the deterministic sim. */
  readonly hurtboxes: readonly {
    readonly start: Point3;
    readonly end: Point3;
    readonly radius: number;
  }[];
  readonly hitboxes: readonly {
    readonly start: Point3;
    readonly end: Point3;
    readonly radius: number;
  }[];
}

export interface WorldPresentation {
  readonly tick: number;
  readonly actors: readonly ActorPresentation[];
  readonly attendTargetId: string | null;
  readonly orbit: Readonly<{ x: number; y: number }>;
  readonly damageContext: boolean;
}

export type CameraWorldEvent =
  | {
      readonly type: "camera-hold";
      readonly beat: string;
      readonly anchorId: string;
    }
  | { readonly type: "camera-release" };

export interface WorldViewEventBatch {
  readonly camera: readonly CameraWorldEvent[];
  readonly audio: readonly AudioSourceEvent[];
}

export interface WorldViewDebugSnapshot {
  readonly tick: number;
  readonly backend: "webgpu" | "webgl2";
  readonly actors: readonly {
    readonly id: string;
    readonly invulnerable: boolean;
    readonly hurtboxCount: number;
    readonly hitboxCount: number;
  }[];
  readonly fallbackClips: readonly string[];
  readonly assetDiagnostics: readonly AssetDiagnostic[];
  readonly p95FrameMs: number;
  readonly frameSampleCount: number;
}

export interface IronwoodWorldView {
  readonly scene: Scene;
  readonly assets: LoadedIronwoodAssets;
  readonly actorRoot: Object3D;
  resize(width: number, height: number, pixelRatio?: number): void;
  consumeEvents(events: WorldViewEventBatch): void;
  render(previous: WorldPresentation, current: WorldPresentation, alpha: number): void;
  setPaused(paused: boolean): Promise<void>;
  unlockAudio(): Promise<void>;
  debugSnapshot(): WorldViewDebugSnapshot;
  resetPerformanceSamples(): void;
  dispose(): void;
}
