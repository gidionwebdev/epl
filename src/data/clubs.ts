export interface ClubData {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  aliases: string[];
  badgeUrl: string;
  primaryColor?: string;
}

export const ALL_PREMIER_LEAGUE_CLUBS: ClubData[] = [
  {
    id: '1',
    name: 'Arsenal',
    shortName: 'Arsenal',
    abbr: 'ARS',
    aliases: ['arsenal', 'ars', 'the gunners'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png',
    primaryColor: '#EF0107'
  },
  {
    id: '2',
    name: 'Aston Villa',
    shortName: 'Aston Villa',
    abbr: 'AVL',
    aliases: ['aston villa', 'villa', 'avl'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png',
    primaryColor: '#670E36'
  },
  {
    id: '3',
    name: 'Barnsley',
    shortName: 'Barnsley',
    abbr: 'BAR',
    aliases: ['barnsley', 'bar'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8283.png',
    primaryColor: '#BA0C2F'
  },
  {
    id: '35',
    name: 'Birmingham City',
    shortName: 'Birmingham',
    abbr: 'BIR',
    aliases: ['birmingham city', 'birmingham', 'bir', 'blues'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8658.png',
    primaryColor: '#0000FF'
  },
  {
    id: '36',
    name: 'Blackburn Rovers',
    shortName: 'Blackburn',
    abbr: 'BLB',
    aliases: ['blackburn rovers', 'blackburn', 'blb', 'rovers'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8655.png',
    primaryColor: '#009EE0'
  },
  {
    id: '37',
    name: 'Blackpool',
    shortName: 'Blackpool',
    abbr: 'BLP',
    aliases: ['blackpool', 'blp', 'seasiders'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8659.png',
    primaryColor: '#F68B1F'
  },
  {
    id: '27',
    name: 'Bolton Wanderers',
    shortName: 'Bolton',
    abbr: 'BOL',
    aliases: ['bolton wanderers', 'bolton', 'bol', 'trotters'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8559.png',
    primaryColor: '#002B49'
  },
  {
    id: '127',
    name: 'Bournemouth',
    shortName: 'Bournemouth',
    abbr: 'BOU',
    aliases: ['bournemouth', 'afc bournemouth', 'bou', 'cherries'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png',
    primaryColor: '#DA291C'
  },
  {
    id: '39',
    name: 'Bradford City',
    shortName: 'Bradford',
    abbr: 'BRA',
    aliases: ['bradford city', 'bradford', 'bra', 'bantams'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png',
    primaryColor: '#800000'
  },
  {
    id: '130',
    name: 'Brentford',
    shortName: 'Brentford',
    abbr: 'BRE',
    aliases: ['brentford', 'bre', 'bees'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9937.png',
    primaryColor: '#E30613'
  },
  {
    id: '131',
    name: 'Brighton & Hove Albion',
    shortName: 'Brighton',
    abbr: 'BHA',
    aliases: ['brighton and hove albion', 'brighton & hove albion', 'brighton', 'bha', 'seagulls'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10204.png',
    primaryColor: '#0057B8'
  },
  {
    id: '43',
    name: 'Burnley',
    shortName: 'Burnley',
    abbr: 'BUR',
    aliases: ['burnley', 'bur', 'clarets'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8191.png',
    primaryColor: '#6C1D45'
  },
  {
    id: '45',
    name: 'Cardiff City',
    shortName: 'Cardiff',
    abbr: 'CAR',
    aliases: ['cardiff city', 'cardiff', 'car', 'bluebirds'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8344.png',
    primaryColor: '#0070B8'
  },
  {
    id: '46',
    name: 'Charlton Athletic',
    shortName: 'Charlton',
    abbr: 'CHA',
    aliases: ['charlton athletic', 'charlton', 'cha', 'addicks'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8657.png',
    primaryColor: '#D31145'
  },
  {
    id: '4',
    name: 'Chelsea',
    shortName: 'Chelsea',
    abbr: 'CHE',
    aliases: ['chelsea', 'che', 'the blues'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png',
    primaryColor: '#034694'
  },
  {
    id: '5',
    name: 'Coventry City',
    shortName: 'Coventry',
    abbr: 'COV',
    aliases: ['coventry city', 'coventry', 'cov', 'sky blues'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8669.png',
    primaryColor: '#00A3E0'
  },
  {
    id: '6',
    name: 'Crystal Palace',
    shortName: 'Crystal Palace',
    abbr: 'CRY',
    aliases: ['crystal palace', 'palace', 'cry', 'eagles'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9826.png',
    primaryColor: '#1B458F'
  },
  {
    id: '47',
    name: 'Derby County',
    shortName: 'Derby',
    abbr: 'DER',
    aliases: ['derby county', 'derby', 'der', 'rams'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8656.png',
    primaryColor: '#FFFFFF'
  },
  {
    id: '7',
    name: 'Everton',
    shortName: 'Everton',
    abbr: 'EVE',
    aliases: ['everton', 'eve', 'toffees'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8668.png',
    primaryColor: '#003399'
  },
  {
    id: '34',
    name: 'Fulham',
    shortName: 'Fulham',
    abbr: 'FUL',
    aliases: ['fulham', 'ful', 'cottagers'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9879.png',
    primaryColor: '#CC0000'
  },
  {
    id: '49',
    name: 'Huddersfield Town',
    shortName: 'Huddersfield',
    abbr: 'HUD',
    aliases: ['huddersfield town', 'huddersfield', 'hud', 'terriers'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9796.png',
    primaryColor: '#0E63AD'
  },
  {
    id: '41',
    name: 'Hull City',
    shortName: 'Hull',
    abbr: 'HUL',
    aliases: ['hull city', 'hull', 'hul', 'tigers'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8667.png',
    primaryColor: '#F5A800'
  },
  {
    id: '8',
    name: 'Ipswich Town',
    shortName: 'Ipswich',
    abbr: 'IPS',
    aliases: ['ipswich town', 'ipswich', 'ips', 'tractor boys'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9832.png',
    primaryColor: '#004488'
  },
  {
    id: '9',
    name: 'Leeds United',
    shortName: 'Leeds',
    abbr: 'LEE',
    aliases: ['leeds united', 'leeds', 'lee', 'peacocks'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8463.png',
    primaryColor: '#FFCD00'
  },
  {
    id: '26',
    name: 'Leicester City',
    shortName: 'Leicester',
    abbr: 'LEI',
    aliases: ['leicester city', 'leicester', 'lei', 'foxes'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8197.png',
    primaryColor: '#003090'
  },
  {
    id: '10',
    name: 'Liverpool',
    shortName: 'Liverpool',
    abbr: 'LIV',
    aliases: ['liverpool', 'liv', 'the reds'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
    primaryColor: '#C8102E'
  },
  {
    id: '163',
    name: 'Luton Town',
    shortName: 'Luton',
    abbr: 'LUT',
    aliases: ['luton town', 'luton', 'lut', 'hatters'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8346.png',
    primaryColor: '#FF6600'
  },
  {
    id: '11',
    name: 'Manchester City',
    shortName: 'Man City',
    abbr: 'MCI',
    aliases: ['manchester city', 'man city', 'mci', 'city', 'citizens'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    primaryColor: '#6CABDD'
  },
  {
    id: '12',
    name: 'Manchester United',
    shortName: 'Man Utd',
    abbr: 'MUN',
    aliases: ['manchester united', 'man utd', 'mun', 'united', 'red devils'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png',
    primaryColor: '#DA291C'
  },
  {
    id: '13',
    name: 'Middlesbrough',
    shortName: 'Middlesbrough',
    abbr: 'MID',
    aliases: ['middlesbrough', 'boro', 'mid'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png',
    primaryColor: '#D31145'
  },
  {
    id: '23',
    name: 'Newcastle United',
    shortName: 'Newcastle',
    abbr: 'NEW',
    aliases: ['newcastle united', 'newcastle', 'new', 'magpies'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png',
    primaryColor: '#241F20'
  },
  {
    id: '14',
    name: 'Norwich City',
    shortName: 'Norwich',
    abbr: 'NOR',
    aliases: ['norwich city', 'norwich', 'nor', 'canaries'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9850.png',
    primaryColor: '#FFF200'
  },
  {
    id: '15',
    name: 'Nottingham Forest',
    shortName: "Nott'm Forest",
    abbr: 'NFO',
    aliases: ['nottingham forest', "nott'm forest", 'forest', 'nfo', 'reds'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10203.png',
    primaryColor: '#DD0000'
  },
  {
    id: '50',
    name: 'Oldham Athletic',
    shortName: 'Oldham',
    abbr: 'OLD',
    aliases: ['oldham athletic', 'oldham', 'old', 'latics'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8670.png',
    primaryColor: '#002B49'
  },
  {
    id: '51',
    name: 'Portsmouth',
    shortName: 'Portsmouth',
    abbr: 'POR',
    aliases: ['portsmouth', 'por', 'pompey'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8462.png',
    primaryColor: '#001489'
  },
  {
    id: '17',
    name: 'Queens Park Rangers',
    shortName: 'QPR',
    abbr: 'QPR',
    aliases: ['queens park rangers', 'qpr', 'hoops'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10172.png',
    primaryColor: '#1D428A'
  },
  {
    id: '52',
    name: 'Reading',
    shortName: 'Reading',
    abbr: 'REA',
    aliases: ['reading', 'rea', 'royals'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9798.png',
    primaryColor: '#004488'
  },
  {
    id: '18',
    name: 'Sheffield United',
    shortName: 'Sheffield Utd',
    abbr: 'SHU',
    aliases: ['sheffield united', 'sheffield utd', 'shu', 'blades'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8653.png',
    primaryColor: '#EE2737'
  },
  {
    id: '19',
    name: 'Sheffield Wednesday',
    shortName: 'Sheff Wed',
    abbr: 'SHW',
    aliases: ['sheffield wednesday', 'sheff wed', 'shw', 'owls'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10163.png',
    primaryColor: '#002B49'
  },
  {
    id: '20',
    name: 'Southampton',
    shortName: 'Southampton',
    abbr: 'SOU',
    aliases: ['southampton', 'sou', 'saints'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8466.png',
    primaryColor: '#D71920'
  },
  {
    id: '53',
    name: 'Stoke City',
    shortName: 'Stoke',
    abbr: 'STK',
    aliases: ['stoke city', 'stoke', 'stk', 'potters'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10194.png',
    primaryColor: '#E03A3E'
  },
  {
    id: '29',
    name: 'Sunderland',
    shortName: 'Sunderland',
    abbr: 'SUN',
    aliases: ['sunderland', 'sun', 'black cats'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8472.png',
    primaryColor: '#EB172B'
  },
  {
    id: '54',
    name: 'Swansea City',
    shortName: 'Swansea',
    abbr: 'SWA',
    aliases: ['swansea city', 'swansea', 'swa', 'swans'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10003.png',
    primaryColor: '#000000'
  },
  {
    id: '55',
    name: 'Swindon Town',
    shortName: 'Swindon',
    abbr: 'SWI',
    aliases: ['swindon town', 'swindon', 'swi', 'robins'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8465.png',
    primaryColor: '#D31145'
  },
  {
    id: '21',
    name: 'Tottenham Hotspur',
    shortName: 'Spurs',
    abbr: 'TOT',
    aliases: ['tottenham hotspur', 'tottenham', 'spurs', 'tot'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    primaryColor: '#132257'
  },
  {
    id: '33',
    name: 'Watford',
    shortName: 'Watford',
    abbr: 'WAT',
    aliases: ['watford', 'wat', 'hornets'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9817.png',
    primaryColor: '#FBEE23'
  },
  {
    id: '56',
    name: 'West Bromwich Albion',
    shortName: 'West Brom',
    abbr: 'WBA',
    aliases: ['west bromwich albion', 'west brom', 'wba', 'baggies'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8652.png',
    primaryColor: '#122F67'
  },
  {
    id: '25',
    name: 'West Ham United',
    shortName: 'West Ham',
    abbr: 'WHU',
    aliases: ['west ham united', 'west ham', 'whu', 'hammers', 'irons'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png',
    primaryColor: '#7A263A'
  },
  {
    id: '57',
    name: 'Wigan Athletic',
    shortName: 'Wigan',
    abbr: 'WIG',
    aliases: ['wigan athletic', 'wigan', 'wig', 'latics'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8528.png',
    primaryColor: '#001489'
  },
  {
    id: '58',
    name: 'Wimbledon',
    shortName: 'Wimbledon',
    abbr: 'WIM',
    aliases: ['wimbledon', 'wim', 'dons'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8464.png',
    primaryColor: '#002B49'
  },
  {
    id: '38',
    name: 'Wolverhampton Wanderers',
    shortName: 'Wolves',
    abbr: 'WOL',
    aliases: ['wolverhampton wanderers', 'wolves', 'wol'],
    badgeUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8602.png',
    primaryColor: '#FDB913'
  }
];

// Helper to resolve club accurately
export function resolveClub(identifier: string | number | undefined | null): ClubData | null {
  if (!identifier) return null;
  const str = String(identifier).trim().toLowerCase();
  if (!str) return null;

  // 1. Direct ID match
  const byId = ALL_PREMIER_LEAGUE_CLUBS.find((c) => c.id === str);
  if (byId) return byId;

  // 2. Exact name or abbr match
  const byName = ALL_PREMIER_LEAGUE_CLUBS.find(
    (c) =>
      c.name.toLowerCase() === str ||
      c.shortName.toLowerCase() === str ||
      c.abbr.toLowerCase() === str
  );
  if (byName) return byName;

  // 3. Alias match
  const byAlias = ALL_PREMIER_LEAGUE_CLUBS.find((c) =>
    c.aliases.some((alias) => alias === str || str.includes(alias) || alias.includes(str))
  );
  if (byAlias) return byAlias;

  // 4. Fuzzy containment match
  const byContains = ALL_PREMIER_LEAGUE_CLUBS.find(
    (c) =>
      str.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(str) ||
      str.includes(c.shortName.toLowerCase()) ||
      c.shortName.toLowerCase().includes(str)
  );
  if (byContains) return byContains;

  return null;
}

export function getVerifiedBadgeUrl(
  clubIdentifier: string | number | undefined | null,
  fallbackBadgeUrl?: string
): string {
  const club = resolveClub(clubIdentifier);
  if (club && club.badgeUrl) {
    return club.badgeUrl;
  }
  return fallbackBadgeUrl || '';
}
