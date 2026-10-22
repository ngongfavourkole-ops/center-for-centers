import { Organization, Opportunity, OpportunityRegion, CameroonRegion } from '../types';
import { translations } from './translations';
import { CAMEROON_REGIONS, normalizeText, resolveRegion, guessRegionFromTown } from './regions';

// Keyword and needs matching for "Describe your situation" and the venue finder.
// Only approved listings are passed in, so nothing unpublished can be suggested.

export type Need = 'computers' | 'internet' | 'power' | 'printing' | 'quiet' | 'free';

export interface ParsedSituation {
  needs: Need[];
  region?: CameroonRegion;
  town?: string;
  budget?: number; // XAF
  words: string[];
}

export interface Match<T> {
  item: T;
  score: number;
  reasons: string[]; // translation keys of matchReasons
}

// Words (English and French, accents removed) that signal each need
const NEED_WORDS: Record<Need, string[]> = {
  computers: ['computer', 'computers', 'pc', 'laptop', 'ordinateur', 'ordinateurs', 'cyber', 'typing', 'coding', 'code', 'programming'],
  internet: ['internet', 'wifi', 'wi-fi', 'online', 'connection', 'connexion', 'data', 'browse', 'email', 'research'],
  power: ['power', 'electricity', 'light', 'charge', 'charging', 'battery', 'phone', 'courant', 'electricite', 'lumiere', 'recharge', 'recharger', 'batterie', 'blackout', 'outage'],
  printing: ['print', 'printing', 'printer', 'photocopy', 'imprimer', 'impression', 'photocopie'],
  quiet: ['study', 'quiet', 'revise', 'revision', 'read', 'reading', 'exam', 'exams', 'etudier', 'calme', 'reviser', 'lire', 'examen', 'examens'],
  free: ['free', 'cheap', 'gratuit', 'gratuite', 'money', 'afford', 'affordable', 'argent', 'pas cher'],
};

const STOP_WORDS = new Set([
  'i', 'a', 'an', 'the', 'and', 'or', 'to', 'in', 'on', 'at', 'for', 'of', 'my', 'me', 'need', 'want', 'have', 'no', 'not',
  'is', 'it', 'with', 'near', 'can', 'where', 'some', 'place', 'je', 'j', 'un', 'une', 'le', 'la', 'les', 'de', 'des', 'du',
  'et', 'ou', 'a', 'au', 'pour', 'dans', 'sur', 'avec', 'pres', 'mon', 'ma', 'mes', 'besoin', 'veux', 'ai', 'pas', 'lieu',
]);

// "Free", "gratuit" or a standalone 0 XAF (not the end of "1,000 XAF")
const FREE_PATTERN = /\bfree\b|gratuit|(^|[^\d.,\s])\s*0\s*(xaf|fcfa|cfa)/;

function regionFromText(text: string): CameroonRegion | undefined {
  // Longest names first so "Far North" wins over "North"
  const candidates = CAMEROON_REGIONS.flatMap(region => [
    { region, name: normalizeText(region) },
    { region, name: normalizeText(translations.fr.regionNames[region]) },
  ]).sort((a, b) => b.name.length - a.name.length);
  const padded = ` ${text.replace(/[^a-z0-9-]+/g, ' ')} `;
  return candidates.find(c => padded.includes(` ${c.name} `))?.region;
}

export function parseSituation(input: string): ParsedSituation {
  const text = normalizeText(input);
  const words = text.split(/[^a-z0-9-]+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
  const needs = (Object.keys(NEED_WORDS) as Need[]).filter(need =>
    NEED_WORDS[need].some(word => (word.includes(' ') ? text.includes(word) : words.includes(word)))
  );
  const budgetMatch = text.match(/(\d[\d\s.,]*)\s*(xaf|fcfa|cfa|f\b|frs?)/);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/[\s.,]/g, '')) : undefined;

  let town: string | undefined;
  let region = regionFromText(text);
  for (const word of words) {
    const townRegion = guessRegionFromTown(word);
    if (townRegion) {
      town = word;
      region = region || townRegion;
      break;
    }
  }
  return { needs, region, town, budget: budget && budget > 0 ? budget : undefined, words };
}

function hasFacility(org: Organization, ...names: string[]): boolean {
  return (org.facilities || []).some(f => names.includes(f));
}

// Lowest number written in the fees text, e.g. "300 XAF per hour" gives 300; undefined if none.
export function feeAmount(fees: string | undefined): number | undefined {
  const numbers = (fees || '').replace(/(\d)[\s.,](?=\d{3}\b)/g, '$1').match(/\d+/g);
  return numbers ? Math.min(...numbers.map(Number)) : undefined;
}

function isFree(org: Organization): boolean {
  const fees = normalizeText(org.fees);
  return FREE_PATTERN.test(fees);
}

// How well a place meets one need: 'yes', 'partly', 'no' or 'unknown'
export function needStatus(org: Organization, need: Need): 'yes' | 'partly' | 'no' | 'unknown' {
  switch (need) {
    case 'computers':
      if (hasFacility(org, 'Computers') || org.type === 'Cyber cafe' || org.type === 'Computer lab') return 'yes';
      return org.facilities?.length ? 'no' : 'unknown';
    case 'internet':
      if (org.internetReliability === 'Stable' || hasFacility(org, 'Internet', 'Wi-Fi') || org.type === 'Internet access point') return 'yes';
      if (org.internetReliability === 'Limited') return 'partly';
      if (org.internetReliability === 'None') return 'no';
      return 'unknown';
    case 'power':
      if (org.powerReliability === 'Backup power available' || hasFacility(org, 'Power backup', 'Charging sockets') || org.type === 'Charging point') return 'yes';
      if (org.powerReliability === 'Grid power only') return 'partly';
      if (org.powerReliability === 'Unreliable power') return 'no';
      return 'unknown';
    case 'printing':
      if (hasFacility(org, 'Printing')) return 'yes';
      return org.facilities?.length ? 'no' : 'unknown';
    case 'quiet':
      if (hasFacility(org, 'Quiet study area', 'Library') || org.type === 'Study space') return 'yes';
      if (hasFacility(org, 'Workspace')) return 'partly';
      return 'unknown';
    case 'free':
      if (isFree(org)) return 'yes';
      return org.fees ? 'no' : 'unknown';
  }
}

function keywordHits(words: string[], fields: Array<string | undefined>): number {
  const haystack = normalizeText(fields.filter(Boolean).join(' '));
  return words.filter(word => word.length > 2 && haystack.includes(word)).length;
}

function locationScore(itemRegion: OpportunityRegion | undefined, itemTown: string | undefined, region?: string, town?: string) {
  let score = 0;
  const reasons: string[] = [];
  if (town && normalizeText(itemTown) === town) {
    score += 4;
    reasons.push('sameTown');
  } else if (region && itemRegion === region) {
    score += 3;
    reasons.push('sameRegion');
  } else if (region && itemRegion && itemRegion !== 'Online') {
    score -= 3;
  }
  return { score, reasons };
}

export function matchPlaces(situation: ParsedSituation, places: Organization[], budget?: number): Match<Organization>[] {
  const maxBudget = budget ?? situation.budget;
  return places
    .map(org => {
      let score = 0;
      const reasons: string[] = [];
      const location = locationScore(resolveRegion(org), org.town, situation.region, situation.town);
      score += location.score;
      reasons.push(...location.reasons);

      for (const need of situation.needs) {
        const status = needStatus(org, need);
        if (status === 'yes') {
          score += 3;
          reasons.push(`need_${need}`);
        } else if (status === 'partly') {
          score += 1;
        } else if (status === 'no') {
          score -= 2;
        }
      }

      if (maxBudget !== undefined) {
        const fee = isFree(org) ? 0 : feeAmount(org.fees);
        if (fee !== undefined && fee <= maxBudget) {
          score += 2;
          reasons.push('withinBudget');
        } else if (fee !== undefined) {
          score -= 2;
        }
      }

      const hits = Math.min(keywordHits(situation.words, [org.name, org.type, org.description, org.studentAccess, ...(org.facilities || [])]), 3);
      score += hits;
      if (hits > 0) reasons.push('keywords');

      return { item: org, score, reasons };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

const CATEGORY_WORDS: Record<string, string[]> = {
  Training: ['training', 'course', 'learn', 'formation', 'cours', 'apprendre'],
  Workshop: ['workshop', 'atelier'],
  Internship: ['internship', 'job', 'work', 'stage', 'emploi', 'travail'],
  Scholarship: ['scholarship', 'bourse', 'fees', 'school fees', 'frais'],
  Hackathon: ['hackathon', 'competition', 'concours'],
  Event: ['event', 'evenement', 'conference', 'meetup'],
};

export function matchOpportunities(situation: ParsedSituation, opportunities: Opportunity[]): Match<Opportunity>[] {
  const today = new Date().toISOString().split('T')[0];
  return opportunities
    .filter(opp => !opp.deadline || opp.deadline >= today)
    .map(opp => {
      let score = 0;
      const reasons: string[] = [];
      const location = locationScore(resolveRegion(opp), opp.town, situation.region, situation.town);
      score += location.score;
      reasons.push(...location.reasons);
      if (resolveRegion(opp) === 'Online') score += 1;

      const categoryWords = CATEGORY_WORDS[opp.category] || [];
      if (situation.words.some(w => categoryWords.includes(w))) {
        score += 3;
        reasons.push('category');
      }
      if (situation.needs.includes('free') && opp.cost === 0) {
        score += 2;
        reasons.push('need_free');
      }

      const hits = Math.min(keywordHits(situation.words, [opp.title, opp.description, opp.orgName, opp.eligibility, ...(opp.interests || [])]), 4);
      score += hits;
      if (hits > 0) reasons.push('keywords');

      return { item: opp, score, reasons };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
