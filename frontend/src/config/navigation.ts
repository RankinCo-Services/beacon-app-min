/**
 * PSA v2 navigation — delegates to app-ui for single source of truth.
 * basePath='' means the app is mounted at the root in standalone mode.
 */
import {
  getNavigation,
  getLevel2Navigation,
  getLevel3Navigation,
} from '@psa/navigation';

export const navigation      = getNavigation('');
export const level2Navigation = getLevel2Navigation('');
export const level3Navigation = getLevel3Navigation('');
