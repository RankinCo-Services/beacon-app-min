/**
 * App UI package entry point.
 *
 * IMPORTANT — getManifest must be defined INLINE here, not re-exported from ./navigation.
 * When the shell resolves this package from a pre-built dist, Rollup reads only this entry
 * file. Re-exports (export { getManifest } from './navigation') are not followed, and the
 * shell build will fail with "getManifest is not exported". Define it here directly.
 *
 * Rename 'app-ui' / 'App' throughout to your app slug when setting up a new app.
 */
import {
  getNavigation,
  getLevel2Navigation,
  getLevel3Navigation,
} from './navigation';
import type { NavSection, Level2Nav, Level3Nav } from './navigation';

export type { AppRouteDef } from './routeDefinitions';
export { routeDefinitions as appRouteDefinitions } from './routeDefinitions';

// ── Manifest (MUST be defined inline — see note above) ───────────────────────

export interface AppManifest {
  navigation: NavSection[];
  level2Navigation: Level2Nav[];
  level3Navigation: Level3Nav[];
}

export function getManifest(basePath = ''): AppManifest {
  return {
    navigation: getNavigation(basePath),
    level2Navigation: getLevel2Navigation(basePath),
    level3Navigation: getLevel3Navigation(basePath),
  };
}
