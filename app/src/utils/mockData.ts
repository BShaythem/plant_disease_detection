import { ScanResult, NewsArticle, UserProfile } from '../types';

export const MOCK_DISEASES: Omit<ScanResult, 'id' | 'imageUri' | 'date'>[] = [
  {
    diseaseName: 'Olive Peacock Spot',
    scientificName: 'Spilocaea oleagina (Cycloconium oleagineum)',
    confidence: 96.4,
    status: 'infected',
    severity: 'Moderate',
    description:
      'The most widespread fungal defoliator of olive trees in temperate Mediterranean climates. Forms conspicuous concentric eye-shaped circular lesions on the upper leaf surface.',
    userNote: 'Observed on lower branches near south-facing slope after 3 consecutive days of morning fog.',
    symptoms: [
      'Concentric circular dark green to brownish spots with yellowish halos',
      'Premature defoliation of lower canopy leaves',
      'Reduced photosynthetic activity and weakened twigs',
    ],
    recommendedTreatments: [
      'Apply preventive copper-based fungicides (Bordeaux mixture or copper oxychloride) in early autumn and late winter.',
      'Prune the canopy to improve air circulation and sunlight penetration.',
      'Avoid excessive nitrogen fertilization which stimulates overly lush susceptible shoots.',
    ],
    preventiveMeasures: [
      'Clear and destroy infected fallen leaves to reduce overwintering fungal spores.',
      'Ensure proper orchard spacing for adequate aeration.',
    ],
  },
  {
    diseaseName: 'Olive Knot Disease',
    scientificName: 'Pseudomonas savastanoi pv. oleae',
    confidence: 94.1,
    status: 'warning',
    severity: 'Moderate',
    description:
      'A bacterial disease causing hypertrophic rough galls or knots on twigs, branches, leaf petioles, and occasionally trunks following frost or harvest wounds.',
    userNote: 'Appeared after last winter hail storm on young 3-year-old Picual cultivars.',
    symptoms: [
      'Rough, knobby, spongy excrescences that harden and crack into woody galls',
      'Disruption of sap vascular flow leading to twig dieback above knot zones',
      'Stunted terminal shoot growth and reduced flower induction',
    ],
    recommendedTreatments: [
      'Disinfect pruning shears with 70% alcohol or 10% bleach solution between each tree cut.',
      'Excise galls during hot dry summer months and paint wounds with copper paste sealant.',
      'Apply copper protective spray within 24 hours of hail, frost cracks, or mechanical harvesting.',
    ],
    preventiveMeasures: [
      'Plant certified disease-free nursery saplings.',
      'Avoid pruning during wet or rainy weather when bacteria readily spread through water droplets.',
    ],
  },
  {
    diseaseName: 'Verticillium Wilt',
    scientificName: 'Verticillium dahliae',
    confidence: 91.8,
    status: 'infected',
    severity: 'High',
    description:
      'A soil-borne vascular wilt fungus that penetrates olive roots and obstructs xylem water transport, causing rapid dieback of individual branches or entire tree sectors.',
    userNote: 'Sectoral curling noted on northwest sector of tree #14; soil moisture testing indicated slight waterlogging.',
    symptoms: [
      'Sectoral leaf curling, rolling inward, with leaves turning dull grey-green before browning',
      'Dead dry leaves remain attached to affected branches (apoplexy syndrome)',
      'Brown discoloration in wood xylem rings visible when branch cross-section is cut',
    ],
    recommendedTreatments: [
      'Prune out dead symptomatic branches at least 30 cm below visible vascular discoloration.',
      'Soil solarization with transparent polyethylene tarps during peak summer heat to reduce microsclerotia.',
      'Avoid intercropping with susceptible Solanaceae (tomatoes, potatoes, peppers).',
    ],
    preventiveMeasures: [
      'Adopt drip irrigation rather than furrow flooding to avoid dispersing fungal spores.',
      'Plant tolerant or resistant rootstocks in infested soils.',
    ],
  },
  {
    diseaseName: 'Olive Anthracnose',
    scientificName: 'Colletotrichum gloeosporioides',
    confidence: 89.5,
    status: 'infected',
    severity: 'High',
    description:
      'A devastating fungal disease known as "soapberry" in fruits and leaf blight. Causes extensive circular necrotic lesions, premature leaf drop, and bitter oily fruit rot.',
    userNote: 'Detected on mature fruit-bearing branches during humid autumn ripening period.',
    symptoms: [
      'Chlorotic leaf margins turning into dark brown circular necrosis with yellow halos',
      'Fruit rot with sunken circular brownish spots producing salmon-colored gelatinous spore masses',
      'Severe tree defoliation in prolonged humid wet seasons',
    ],
    recommendedTreatments: [
      'Apply registered copper or strobilurin fungicides at flowering and fruit onset.',
      'Immediately remove and destroy mummified fruits and diseased twig litter.',
      'Accelerate harvest schedule before heavy autumn rains occur.',
    ],
    preventiveMeasures: [
      'Select cultivars with lower susceptibility in humid valley orchards.',
      'Prune internal canopy to accelerate leaf drying.',
    ],
  },
  {
    diseaseName: 'Leaf Chlorosis & Mineral Deficiency',
    scientificName: 'Iron & Micronutrient Imbalance',
    confidence: 88.2,
    status: 'warning',
    severity: 'Low',
    description:
      'A physiological condition characterized by loss of chlorophyll pigmentation between leaf veins, commonly triggered by high soil calcium carbonate, alkaline pH, or iron immobilization.',
    userNote: 'Soil pH is 8.2; scheduled for chelated iron foliar supplement next week.',
    symptoms: [
      'Interveinal leaf yellowing while main veins retain green coloration',
      'Stunted leaf blade expansion and fragile cuticle development',
      'Bleached ivory appearance of newest young shoots under acute deficiency',
    ],
    recommendedTreatments: [
      'Foliar application of chelated iron (Fe-EDDHA) or balanced micro-nutrient foliar spray.',
      'Amend soil with organic compost and elemental sulfur to gently moderate rhizosphere pH.',
      'Optimize drip irrigation to prevent alkaline salt accumulation in topsoil.',
    ],
    preventiveMeasures: [
      'Conduct annual leaf tissue analysis and soil mineral testing in mid-summer.',
      'Avoid over-irrigation that causes root hypoxia in calcareous soils.',
    ],
  },
  {
    diseaseName: 'Healthy Olive Foliage',
    scientificName: 'Olea europaea (Healthy leaf)',
    confidence: 99.4,
    status: 'healthy',
    severity: 'None',
    description:
      'Optimal physiological condition. Thick wax cuticle layer, uniform silver-green color, vigorous photosynthetic capacity, and completely free from pathogen lesions or galls.',
    userNote: 'Control sample from north orchard block after organic seaweed foliar treatment.',
    symptoms: [
      'Uniform vibrant silver-green coloration with smooth waxy texture',
      'No visible necrotic lesions, spots, felt-like mycelium, or bacterial knots',
      'Strong mechanical resistance and healthy leaf blade elasticity',
    ],
    recommendedTreatments: [
      'No chemical or curative treatment required.',
      'Maintain standard balanced organic nutrition and scheduled drip irrigation.',
    ],
    preventiveMeasures: [
      'Continue routine bi-weekly field scouting throughout active vegetative flush.',
    ],
  },
];

export const MOCK_INITIAL_HISTORY: ScanResult[] = [
  {
    id: 'scan-sample-1',
    imageUri: 'sample1',
    diseaseName: 'Olive Peacock Spot',
    scientificName: 'Spilocaea oleagina',
    confidence: 96.4,
    status: 'infected',
    severity: 'Moderate',
    date: 'Oct 05, 2026 • 09:15 AM',
    description:
      'Concentric circular dark spots with yellowish halo on upper leaf blade. High risk of premature defoliation if autumn rain continues.',
    userNote: 'Found on lower canopy leaves of tree #42. Scheduled preventative copper spray.',
    symptoms: [
      'Concentric circular dark spots with yellow halo on upper leaf blade',
      'Early leaf yellowing and dropping on lower canopy',
    ],
    recommendedTreatments: [
      'Apply copper hydroxide or Bordeaux mixture',
      'Aerate canopy by selective pruning',
    ],
    preventiveMeasures: [
      'Clear fallen leaves under tree canopies to minimize spore inoculum',
    ],
  },
  {
    id: 'scan-sample-2',
    imageUri: 'sample2',
    diseaseName: 'Olive Knot Disease',
    scientificName: 'Pseudomonas savastanoi',
    confidence: 94.1,
    status: 'warning',
    severity: 'Moderate',
    date: 'Oct 04, 2026 • 02:40 PM',
    description:
      'Rough knobby galls on leaf petiole and twig junctions. Bacteria entered through minor harvest abrasions.',
    userNote: 'Marked branch with red ribbon for summer surgical pruning.',
    symptoms: [
      'Spongy greenish-brown galls on twig joints and leaf petiole',
      'Twig tip dieback above knot site',
    ],
    recommendedTreatments: [
      'Sterilize pruning shears with 70% alcohol between cuts',
      'Apply protective copper paste on pruning wounds',
    ],
    preventiveMeasures: [
      'Avoid pruning during wet rainstorms',
    ],
  },
  {
    id: 'scan-sample-3',
    imageUri: 'sample3',
    diseaseName: 'Verticillium Wilt',
    scientificName: 'Verticillium dahliae',
    confidence: 91.8,
    status: 'infected',
    severity: 'High',
    date: 'Oct 03, 2026 • 11:20 AM',
    description:
      'Sectoral leaf curling, greyish-green desiccation and wilt. Vascular xylem blockage detected.',
    userNote: 'Tested soil drainage around root zone. Suspect over-irrigation.',
    symptoms: [
      'Inward leaf curling and grey-green desiccation',
      'Branch apoplexy where dried leaves cling to shoots',
    ],
    recommendedTreatments: [
      'Prune dead branches 30 cm below discoloration zone',
      'Soil solarization with clear plastic sheets in summer',
    ],
    preventiveMeasures: [
      'Ensure strict drip irrigation control',
    ],
  },
  {
    id: 'scan-sample-4',
    imageUri: 'sample4',
    diseaseName: 'Olive Anthracnose',
    scientificName: 'Colletotrichum gloeosporioides',
    confidence: 89.5,
    status: 'infected',
    severity: 'High',
    date: 'Oct 01, 2026 • 04:10 PM',
    description:
      'Brown marginal necrosis and chlorotic halo on foliage with initial fruit lesion onset.',
    userNote: 'Removed nearby mummified fruits from previous harvest.',
    symptoms: [
      'Chlorotic leaf margins turning into brown necrosis',
      'Premature fruit decay and rot',
    ],
    recommendedTreatments: [
      'Apply registered copper fungicide immediately',
      'Destroy infected fruit and leaf debris',
    ],
    preventiveMeasures: [
      'Advance harvest timing before seasonal moisture peaks',
    ],
  },
  {
    id: 'scan-sample-5',
    imageUri: 'sample5',
    diseaseName: 'Leaf Chlorosis',
    scientificName: 'Nutritional / Fe-Mg Deficiency',
    confidence: 88.2,
    status: 'warning',
    severity: 'Low',
    date: 'Sep 28, 2026 • 10:05 AM',
    description:
      'Interveinal yellowing with preserved green main vein. Indicates reduced chlorophyll synthesis in calcareous soil.',
    userNote: 'Ordered organic iron chelate foliar biostimulant.',
    symptoms: [
      'Yellow chlorotic patches between leaf veins',
      'Pale young shoot foliage',
    ],
    recommendedTreatments: [
      'Apply chelated iron (Fe-EDDHA) foliar spray',
      'Supplement soil with mature organic compost',
    ],
    preventiveMeasures: [
      'Monitor soil pH and irrigation salinity regularly',
    ],
  },
  {
    id: 'scan-sample-6',
    imageUri: 'sample6',
    diseaseName: 'Healthy Olive Foliage',
    scientificName: 'Olea europaea (Healthy leaf)',
    confidence: 99.4,
    status: 'healthy',
    severity: 'None',
    date: 'Sep 25, 2026 • 03:30 PM',
    description:
      'Prime health benchmark. Clean cuticle layer, vibrant silver-green coloration, no necrotic or bacterial symptoms.',
    userNote: 'Excellent vegetative vigor in north orchard sector.',
    symptoms: [
      'Smooth waxy cuticle with no pathogen marks',
      'Strong vigor and uniform green color',
    ],
    recommendedTreatments: [
      'Maintain standard balanced organic nourishment',
    ],
    preventiveMeasures: [
      'Continue routine bi-weekly field monitoring',
    ],
  },
];

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Autumn Canopy Management: Preventing Peacock Spot Outbreaks',
    category: 'Crop Protection',
    date: 'Oct 02, 2026',
    readTime: '4 min read',
    tag: 'Fungus Control',
    author: 'Dr. Elena Rostova, Phytopathology Specialist',
    summary:
      'High humidity and mild autumn temperatures elevate spore dispersal. Discover timing recommendations for copper sprays and pruning aeration.',
    content:
      'Olive peacock spot (Spilocaea oleagina) poses the greatest defoliation threat when temperatures hover between 15°C and 20°C with prolonged rain. Agronomists recommend opening up inner tree canopies through vertical pruning to reduce leaf-wetness duration. Field studies demonstrate a 40% reduction in spore loads when copper hydroxide is applied at bud-break.',
  },
  {
    id: 'news-2',
    title: 'Precision Irrigation in Mediterranean Climates for 2026',
    category: 'Water Conservation',
    date: 'Sep 28, 2026',
    readTime: '5 min read',
    tag: 'Irrigation',
    author: 'Marco Valente, Agro-Hydrologist',
    summary:
      'Regulated deficit irrigation (RDI) optimizes fruit oil synthesis while slashing water consumption by up to 25% without compromising yield.',
    content:
      'Water stress monitoring via leaf water potential and soil moisture sensors allows olive growers to apply water strictly during critical pit-hardening stages. Strategic deficit irrigation preserves soil microbiomes and reduces fungal proliferation around the root zone.',
  },
  {
    id: 'news-3',
    title: 'Eco-Friendly Biostimulants for Olive Tree Vitality',
    category: 'Organic Farming',
    date: 'Sep 19, 2026',
    readTime: '3 min read',
    tag: 'Soil Health',
    author: 'Sarah Bennani, Organic Agronomy Consultant',
    summary:
      'Seaweed extracts and mycorrhizal fungi enhance leaf cuticle thickness, creating a natural physical shield against airborne pathogens.',
    content:
      'Trial orchards treated with Ascophyllum nodosum extract exhibited notable increases in polyphenols and cuticle wax thickness. This biochemical strengthening hampers initial hyphal penetration by spores, providing a synergistic defense alongside reduced-rate copper regimens.',
  },
  {
    id: 'news-4',
    title: 'Early Detection of Olive Leaf Scab via Smartphone AI',
    category: 'AI Technology',
    date: 'Sep 10, 2026',
    readTime: '6 min read',
    tag: 'AgriTech',
    author: 'TechAgri Review',
    summary:
      'How computer vision on mobile devices is democratizing rapid field diagnostics for smallholder olive farmers across the globe.',
    content:
      'Visual symptoms of leaf fungal infections are frequently confused with nutrient deficiencies. Deep learning models trained on vast leaf datasets can classify microscopic lesion patterns in seconds, preventing unnecessary broad-spectrum pesticide treatments.',
  },
];

export const MOCK_USER_PROFILE: UserProfile = {
  firstName: 'Julien',
  lastName: 'Laurent',
  email: 'julien.laurent@olivegrove.org',
  farmName: 'Val d’Olive Heritage Orchard',
  region: 'Provence-Alpes-Côte d’Azur, France',
  oliveTreeCount: 340,
  memberSince: 'March 2024',
};
