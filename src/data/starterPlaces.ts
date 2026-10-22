import { PlaceDraft } from '../lib/places';

// Real places confirmed from public sources, imported once by an admin as team-managed listings.
// Only publicly known facts are filled in; power, internet, fees and hours stay Unknown until
// someone visits. Each entry's sourceNote says where the information came from.
type StarterPlace = Partial<PlaceDraft> & Pick<PlaceDraft, 'name' | 'type' | 'region' | 'sourceNote'>;

const NOT_VISITED = 'Not yet visited by the team: power, internet, fees and hours to be confirmed.';

const university = (name: string, region: PlaceDraft['region'], town: string): StarterPlace => ({
  name,
  type: 'Educational institution',
  region,
  town,
  facilities: ['Library'],
  description: `Public university in ${town}. Its library and computer facilities may be open to students; access conditions to be confirmed.`,
  sourceNote: `Public university listed by the Ministry of Higher Education. ${NOT_VISITED}`,
});

const americanCorner = (town: string, region: PlaceDraft['region'], address = ''): StarterPlace => ({
  name: `American Corner ${town}`,
  type: 'Learning center',
  region,
  town,
  address,
  facilities: ['Library'],
  description: 'Reading and learning space supported by the U.S. Embassy, with books and programs for young people and alumni.',
  sourceNote: `Public reports of U.S. Embassy American Corners in Cameroon (Cameroon Tribune, U.S. Army news). ${NOT_VISITED}`,
});

export const STARTER_PLACES: StarterPlace[] = [
  {
    name: 'ActivSpaces Douala',
    type: 'Technology hub',
    region: 'Littoral',
    town: 'Douala',
    address: 'Immeuble TECNO, Boulevard de la Liberté',
    website: 'https://activspaces.com',
    facilities: ['Workspace'],
    description: 'Innovation hub and tech business incubator supporting startups and young innovators.',
    sourceNote: `AfriLabs and VC4A hub listings. ${NOT_VISITED}`,
  },
  {
    name: 'ActivSpaces Buea',
    type: 'Technology hub',
    region: 'Southwest',
    town: 'Buea',
    website: 'https://activspaces.com',
    facilities: ['Workspace'],
    description: 'Buea space of the ActivSpaces innovation hub and tech incubator.',
    sourceNote: `AfriLabs and VC4A hub listings (exact Buea address not published). ${NOT_VISITED}`,
  },
  {
    name: 'Institut français du Cameroun, Yaoundé media library',
    type: 'Learning center',
    region: 'Centre',
    town: 'Yaoundé',
    address: 'Near the municipal lake (Lac municipal)',
    facilities: ['Library'],
    description: 'Media library of the French Institute, reopened in a renovated building near the municipal lake in 2025.',
    sourceNote: `Cameroon Tribune report on the media library's move and reopening. ${NOT_VISITED}`,
  },
  {
    name: 'Institut français du Cameroun, Douala media library',
    type: 'Learning center',
    region: 'Littoral',
    town: 'Douala',
    facilities: ['Library'],
    description: 'Media library of the French Institute in Douala.',
    sourceNote: `Institut français du Cameroun public notices. ${NOT_VISITED}`,
  },
  americanCorner('Buea', 'Southwest', 'University of Buea campus'),
  americanCorner('Douala', 'Littoral', 'Centre linguistique pilote, Bonanjo'),
  americanCorner('Yaoundé', 'Centre'),
  americanCorner('Garoua', 'North'),
  university('University of Buea', 'Southwest', 'Buea'),
  university('University of Bamenda', 'Northwest', 'Bambili'),
  university('University of Douala', 'Littoral', 'Douala'),
  university('University of Yaoundé I', 'Centre', 'Yaoundé'),
  university('University of Dschang', 'West', 'Dschang'),
  university('University of Ngaoundéré', 'Adamawa', 'Ngaoundéré'),
  university('University of Maroua', 'Far North', 'Maroua'),
  university('University of Bertoua', 'East', 'Bertoua'),
  university('University of Ebolowa', 'South', 'Ebolowa'),
  university('University of Garoua', 'North', 'Garoua'),
];
