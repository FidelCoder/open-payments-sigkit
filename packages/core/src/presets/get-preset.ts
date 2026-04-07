import type { PresetDefinition, PresetName } from '../types/public.js'
import { PRESET_DEFINITIONS } from './definitions.js'

/**
 * Returns a named Open Payments signing preset.
 */
export const getPreset = (name: PresetName): PresetDefinition => PRESET_DEFINITIONS[name]

