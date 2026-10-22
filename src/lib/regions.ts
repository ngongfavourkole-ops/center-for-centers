import { CameroonRegion, OpportunityRegion } from '../types';
import { translations } from './translations';

type Dictionary = typeof translations['en'];

export const CAMEROON_REGIONS: CameroonRegion[] = [
  'Adamawa',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'Northwest',
  'South',
  'Southwest',
  'West',
];

export const OPPORTUNITY_REGIONS: OpportunityRegion[] = [...CAMEROON_REGIONS, 'Online'];

// Lowercase, accent free form used for comparing towns and search text.
export function normalizeText(value: string | undefined | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Main towns per region, used to fill in the region for older records that only stored a town.
const TOWN_REGIONS: Record<string, CameroonRegion> = {
  ngaoundere: 'Adamawa', meiganga: 'Adamawa', tibati: 'Adamawa', banyo: 'Adamawa', tignere: 'Adamawa',
  yaounde: 'Centre', mbalmayo: 'Centre', obala: 'Centre', bafia: 'Centre', mfou: 'Centre', soa: 'Centre',
  bertoua: 'East', batouri: 'East', 'abong-mbang': 'East', yokadouma: 'East',
  maroua: 'Far North', kousseri: 'Far North', mokolo: 'Far North', mora: 'Far North', yagoua: 'Far North',
  douala: 'Littoral', edea: 'Littoral', nkongsamba: 'Littoral', loum: 'Littoral', manjo: 'Littoral',
  garoua: 'North', guider: 'North', poli: 'North', 'tchollire': 'North',
  bamenda: 'Northwest', kumbo: 'Northwest', ndop: 'Northwest', wum: 'Northwest', nkambe: 'Northwest', bali: 'Northwest',
  ebolowa: 'South', kribi: 'South', sangmelima: 'South', ambam: 'South',
  buea: 'Southwest', limbe: 'Southwest', tiko: 'Southwest', kumba: 'Southwest', mamfe: 'Southwest', mutengene: 'Southwest', idenau: 'Southwest',
  bafoussam: 'West', dschang: 'West', mbouda: 'West', foumban: 'West', bangangte: 'West', bafang: 'West',
};

export function isCameroonRegion(value: string | undefined | null): value is CameroonRegion {
  return !!value && (CAMEROON_REGIONS as string[]).includes(value);
}

// Placeholder town values from the old fixed town list that should not be shown as a town.
function isPlaceholderTown(town: string): boolean {
  const t = normalizeText(town);
  return t === '' || t === 'other' || t === 'online';
}

export function guessRegionFromTown(town: string | undefined): CameroonRegion | undefined {
  return TOWN_REGIONS[normalizeText(town)];
}

// Region of a place or opportunity, falling back to the town for records saved before regions existed.
export function resolveRegion(item: { region?: string; town?: string }): OpportunityRegion | undefined {
  if (item.region === 'Online' || isCameroonRegion(item.region)) return item.region as OpportunityRegion;
  if (normalizeText(item.town) === 'online') return 'Online';
  return guessRegionFromTown(item.town);
}

export function regionLabel(region: OpportunityRegion | undefined, t: Dictionary): string {
  if (!region) return '';
  if (region === 'Online') return t.online;
  return t.regionNames[region] || region;
}

// "Buea, Southwest", "Southwest", "Online" or "" depending on what is known.
export function formatLocation(item: { region?: string; town?: string }, t: Dictionary): string {
  const region = resolveRegion(item);
  const town = item.town && !isPlaceholderTown(item.town) ? item.town.trim() : '';
  const label = regionLabel(region, t);
  if (town && label && region !== 'Online') return `${town}, ${label}`;
  return town || label;
}

// Town for form inputs: drops the old "Other" and "Online" placeholders.
export function editableTown(town: string | undefined): string {
  return town && !isPlaceholderTown(town) ? town : '';
}
