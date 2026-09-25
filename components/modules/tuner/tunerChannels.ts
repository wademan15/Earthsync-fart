import {
  HarmonicChannel,
  PRESETS,
  UNIVERSAL_CHANNELS,
  KNOB_CHANNELS,
} from '../visuals/shared';

/**
 * Resolves the active harmonic channels array given a preset package ID,
 * custom user channels, and dynamically tuned musical scale channels.
 */
export const getChannelsForPreset = (
  pkgId: string,
  customChannels: HarmonicChannel[] = [],
  musicScaleChannels: HarmonicChannel[] = []
): HarmonicChannel[] => {
  if (pkgId === 'CUSTOM') return customChannels;
  if (pkgId === 'KNOB') return KNOB_CHANNELS;
  if (pkgId === 'MUSIC_SCALE') return musicScaleChannels;
  const found = PRESETS.find(p => p.id === pkgId);
  return found ? found.channels : UNIVERSAL_CHANNELS;
};
