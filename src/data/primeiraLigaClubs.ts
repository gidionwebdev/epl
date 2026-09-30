export interface PrimeiraLigaClub {
  id: string;
  name: string;
  shortName: string;
  badgeUrl: string;
  stadium: string;
  city: string;
  founded: number;
}

export const PRIMEIRA_LIGA_CLUBS: PrimeiraLigaClub[] = [
  {
    id: 'porto',
    name: 'FC Porto',
    shortName: 'Porto',
    badgeUrl: 'https://media.api-sports.io/football/teams/212.png',
    stadium: 'Estádio do Dragão',
    city: 'Porto',
    founded: 1893
  },
  {
    id: 'benfica',
    name: 'SL Benfica',
    shortName: 'Benfica',
    badgeUrl: 'https://media.api-sports.io/football/teams/211.png',
    stadium: 'Estádio da Luz',
    city: 'Lisbon',
    founded: 1904
  },
  {
    id: 'sporting-cp',
    name: 'Sporting CP',
    shortName: 'Sporting',
    badgeUrl: 'https://media.api-sports.io/football/teams/228.png',
    stadium: 'Estádio José Alvalade',
    city: 'Lisbon',
    founded: 1906
  },
  {
    id: 'braga',
    name: 'SC Braga',
    shortName: 'Braga',
    badgeUrl: 'https://media.api-sports.io/football/teams/217.png',
    stadium: 'Estádio Municipal de Braga',
    city: 'Braga',
    founded: 1921
  },
  {
    id: 'vitoria-sc',
    name: 'Vitória SC',
    shortName: 'Vitória Guimarães',
    badgeUrl: 'https://media.api-sports.io/football/teams/218.png',
    stadium: 'Estádio D. Afonso Henriques',
    city: 'Guimarães',
    founded: 1922
  },
  {
    id: 'famalicao',
    name: 'FC Famalicão',
    shortName: 'Famalicão',
    badgeUrl: 'https://media.api-sports.io/football/teams/224.png',
    stadium: 'Estádio Municipal 22 de Junho',
    city: 'Vila Nova de Famalicão',
    founded: 1931
  },
  {
    id: 'santa-clara',
    name: 'CD Santa Clara',
    shortName: 'Santa Clara',
    badgeUrl: 'https://media.api-sports.io/football/teams/227.png',
    stadium: 'Estádio de São Miguel',
    city: 'Ponta Delgada, Azores',
    founded: 1927
  },
  {
    id: 'moreirense',
    name: 'Moreirense FC',
    shortName: 'Moreirense',
    badgeUrl: 'https://media.api-sports.io/football/teams/226.png',
    stadium: 'Parque de Jogos Comendador Joaquim de Almeida Freitas',
    city: 'Moreira de Cónegos',
    founded: 1938
  },
  {
    id: 'gil-vicente',
    name: 'Gil Vicente FC',
    shortName: 'Gil Vicente',
    badgeUrl: 'https://media.api-sports.io/football/teams/221.png',
    stadium: 'Estádio Cidade de Barcelos',
    city: 'Barcelos',
    founded: 1924
  },
  {
    id: 'rio-ave',
    name: 'Rio Ave FC',
    shortName: 'Rio Ave',
    badgeUrl: 'https://media.api-sports.io/football/teams/222.png',
    stadium: 'Estádio dos Arcos',
    city: 'Vila do Conde',
    founded: 1939
  },
  {
    id: 'estoril',
    name: 'GD Estoril Praia',
    shortName: 'Estoril',
    badgeUrl: 'https://media.api-sports.io/football/teams/223.png',
    stadium: 'Estádio António Coimbra da Mota',
    city: 'Estoril',
    founded: 1939
  },
  {
    id: 'arouca',
    name: 'FC Arouca',
    shortName: 'Arouca',
    badgeUrl: 'https://media.api-sports.io/football/teams/229.png',
    stadium: 'Estádio Municipal de Arouca',
    city: 'Arouca',
    founded: 1951
  },
  {
    id: 'boavista',
    name: 'Boavista FC',
    shortName: 'Boavista',
    badgeUrl: 'https://media.api-sports.io/football/teams/214.png',
    stadium: 'Estádio do Bessa',
    city: 'Porto',
    founded: 1903
  },
  {
    id: 'casa-pia',
    name: 'Casa Pia AC',
    shortName: 'Casa Pia',
    badgeUrl: 'https://media.api-sports.io/football/teams/242.png',
    stadium: 'Estádio Municipal de Rio Maior',
    city: 'Lisbon',
    founded: 1920
  },
  {
    id: 'estrela',
    name: 'CF Estrela da Amadora',
    shortName: 'Estrela',
    badgeUrl: 'https://media.api-sports.io/football/teams/1062.png',
    stadium: 'Estádio José Gomes',
    city: 'Amadora',
    founded: 1932
  },
  {
    id: 'nacional',
    name: 'CD Nacional',
    shortName: 'Nacional',
    badgeUrl: 'https://media.api-sports.io/football/teams/231.png',
    stadium: 'Estádio da Madeira',
    city: 'Funchal, Madeira',
    founded: 1910
  },
  {
    id: 'farense',
    name: 'SC Farense',
    shortName: 'Farense',
    badgeUrl: 'https://media.api-sports.io/football/teams/219.png',
    stadium: 'Estádio de São Luís',
    city: 'Faro',
    founded: 1910
  },
  {
    id: 'academico-viseu',
    name: 'Académico de Viseu',
    shortName: 'Académico',
    badgeUrl: 'https://media.api-sports.io/football/teams/233.png',
    stadium: 'Estádio do Fontelo',
    city: 'Viseu',
    founded: 1914
  },
  {
    id: 'alverca',
    name: 'FC Alverca',
    shortName: 'Alverca',
    badgeUrl: 'https://media.api-sports.io/football/teams/234.png',
    stadium: 'Complexo Desportivo FC Alverca',
    city: 'Alverca do Ribatejo',
    founded: 1939
  }
];

export function resolvePrimeiraLigaClub(rawName?: string): PrimeiraLigaClub | undefined {
  if (!rawName) return undefined;
  const clean = rawName.toLowerCase().trim();

  return PRIMEIRA_LIGA_CLUBS.find((c) => {
    const clubName = c.name.toLowerCase();
    const short = c.shortName.toLowerCase();
    const id = c.id.toLowerCase();
    return (
      clean === clubName ||
      clean === short ||
      clean === id ||
      clubName.includes(clean) ||
      clean.includes(short) ||
      (clean.includes('sporting') && !clean.includes('braga') && id === 'sporting-cp') ||
      (clean.includes('braga') && id === 'braga') ||
      (clean.includes('porto') && id === 'porto') ||
      (clean.includes('benfica') && id === 'benfica') ||
      (clean.includes('guimar') && id === 'vitoria-sc') ||
      (clean.includes('amadora') && id === 'estrela') ||
      (clean.includes('viseu') && id === 'academico-viseu')
    );
  });
}

export function getPrimeiraLigaBadgeUrl(teamName?: string): string {
  const club = resolvePrimeiraLigaClub(teamName);
  if (club) return club.badgeUrl;
  return 'https://media.api-sports.io/football/leagues/94.png'; // Primeira Liga crest fallback
}
