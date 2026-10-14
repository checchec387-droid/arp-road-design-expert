import {
  RoadCategory,
  ProjectMetadata,
  TraceEnPlanElement,
  ProfilEnLongElement,
  CalculationHistoryEntry
} from '../types/arp';

export interface FullProjectState {
  metadata: ProjectMetadata;
  // Module inputs
  deversNormal: {
    category: RoadCategory;
    isInterurbaine110: boolean;
    radiusR: number;
  };
  deversRD: {
    radiusR: number;
    longitudinalSlopeP: number;
    hasSnowOrFrost: boolean;
    userReducedDevers?: number;
  };
  clothoideNormal: {
    crossSectionType: '2 voies' | '3 voies' | '2x2 voies';
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    category: RoadCategory;
    isInterurbaine110: boolean;
  };
  clothoideRD: {
    crossSectionType: '2 voies' | '3 voies' | '2x2 voies';
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    proposedReducedLength?: number;
    exactLg?: number;
    deversAtPoint: number;
    longitudinalSlope: number;
  };
  surlargeur: {
    innerRadiusR: number;
    normalLaneWidth: number;
    isDifficultRelief: boolean;
  };
  largeurRoulable: {
    functionLevel: 'eleve' | 'intermediaire' | 'modere';
    tmja: number;
    heavyVehiclesPL: number;
  };
  traceEnPlan: {
    v85Kmh: number;
    elements: TraceEnPlanElement[];
  };
  profilEnLong: {
    v85Kmh: number;
    elements: ProfilEnLongElement[];
  };
  history: CalculationHistoryEntry[];
}

export const INITIAL_PROJECT_STATE: FullProjectState = {
  metadata: {
    id: 'proj-arp-2026-001',
    name: 'Aménagement RD 904 — Section Évitement',
    dossierNumber: 'BE-2026-ARP-09',
    client: 'Conseil Départemental — Direction des Infrastructures',
    consultingFirm: 'Cabinet d’Ingénierie Géométrique & Routière (CIGR)',
    leadEngineer: 'M. Laurent Mercier (Ingénieur Routier Senior)',
    date: '2026-10-13',
    version: '1.2 - Phase PRO',
    description: 'Étude d’aménagement géométrique de la route principale selon le guide ARP du Cerema (Édition Août 2022). Vérification des lois de dévers, dimensionnement des clothoïdes et contrôle de coordination tracé/profil.',
    technicalNotes: 'Projet intégrant le basculement de dévers en section courante et les adaptations spécifiques en relief difficile (§6 ARP). Présence de trafics agricoles et circulation de cyclistes à intégrer en BDD revêtue.',
    category: 'R1',
    roadType: '4.1',
    functionLevel: 'intermediaire',
    speedLimitKmh: 80,
    tmja: 2500,
    plDaily: 150,
    isWinterSnowFrostZone: false,
    isDifficultReliefSite: false,
    createdAt: '2026-10-13T08:00:00.000Z',
    updatedAt: '2026-10-13T10:15:00.000Z'
  },
  deversNormal: {
    category: 'R1',
    isInterurbaine110: false,
    radiusR: 300 // from Sheet 3
  },
  deversRD: {
    radiusR: 200, // from Sheet 4
    longitudinalSlopeP: 4.0,
    hasSnowOrFrost: false,
    userReducedDevers: undefined
  },
  clothoideNormal: {
    crossSectionType: '2 voies', // from Sheet 5
    radiusR: 300,
    widthL: 7.00,
    deltaDevers: 4.50,
    category: 'R1',
    isInterurbaine110: false
  },
  clothoideRD: {
    crossSectionType: '2 voies', // from Sheet 6
    radiusR: 150,
    widthL: 7.00,
    deltaDevers: 4.50,
    proposedReducedLength: undefined,
    exactLg: undefined,
    deversAtPoint: 5.0,
    longitudinalSlope: 4.0
  },
  surlargeur: {
    innerRadiusR: 100, // from Sheet 7
    normalLaneWidth: 3.50,
    isDifficultRelief: true
  },
  largeurRoulable: {
    functionLevel: 'intermediaire', // from Sheet 8
    tmja: 2500,
    heavyVehiclesPL: 150
  },
  traceEnPlan: {
    v85Kmh: 80,
    elements: [
      { id: 'tp-1', type: 'ALIGNEMENT', lengthM: 450, cumulPkStart: 0, cumulPkEnd: 450 },
      { id: 'tp-2', type: 'CLOTHOIDE', lengthM: 63, parameterA: 137.5, cumulPkStart: 450, cumulPkEnd: 513 },
      { id: 'tp-3', type: 'COURBE', lengthM: 180, radiusM: 300, direction: 'DROITE', cumulPkStart: 513, cumulPkEnd: 693 },
      { id: 'tp-4', type: 'CLOTHOIDE', lengthM: 63, parameterA: 137.5, cumulPkStart: 693, cumulPkEnd: 756 },
      { id: 'tp-5', type: 'ALIGNEMENT', lengthM: 320, cumulPkStart: 756, cumulPkEnd: 1076 }
    ]
  },
  profilEnLong: {
    v85Kmh: 80,
    elements: [
      { id: 'pl-1', type: 'DECLIVITE', slopePercent: 2.5, lengthM: 400, startZ: 142.0, endZ: 152.0, cumulPkStart: 0, cumulPkEnd: 400 },
      { id: 'pl-2', type: 'RACCORDEMENT_SAILLANT', verticalRadiusM: 3500, lengthM: 150, startZ: 152.0, endZ: 154.5, cumulPkStart: 400, cumulPkEnd: 550 },
      { id: 'pl-3', type: 'DECLIVITE', slopePercent: -1.8, lengthM: 526, startZ: 154.5, endZ: 145.0, cumulPkStart: 550, cumulPkEnd: 1076 }
    ]
  },
  history: [
    {
      id: 'hist-init',
      timestamp: '2026-10-13 09:30',
      moduleName: 'Initialisation du projet',
      summary: 'Import des données du projet initial selon feuille de calcul ARP CEREMA',
      paramsSnapshot: { category: 'R1', roadType: '4.1', tmja: 2500 },
      resultsSnapshot: { deversNormal: '3.18%', clothoideL: '63.00 m' }
    }
  ]
};

const STORAGE_KEY = 'arp_cerema_project_state_v2';

export function loadProjectState(): FullProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROJECT_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed.metadata || !parsed.deversNormal) return INITIAL_PROJECT_STATE;
    return parsed;
  } catch {
    return INITIAL_PROJECT_STATE;
  }
}

export function saveProjectState(state: FullProjectState): void {
  try {
    const stateToSave = {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du projet dans localStorage', err);
  }
}

export function exportProjectToJson(state: FullProjectState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const filename = `Projet_ARP_${(state.metadata.dossierNumber || 'Etude').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTableToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = 'data:text/csv;charset=utf-8,' + [
    headers.join(';'),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
  ].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
