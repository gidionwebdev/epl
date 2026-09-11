export interface SeasonInfo {
  compSeasonId: number;
  slug: string; // e.g. "1992-93", "2026-27"
  label: string; // e.g. "1992/93", "2026/27"
  startYear: number;
  endYear: number;
  maxMatchweeks: number;
  isCurrent?: boolean;
}

export const ALL_SEASONS: SeasonInfo[] = [
  { compSeasonId: 841, slug: '2026-27', label: '2026/27', startYear: 2026, endYear: 2027, maxMatchweeks: 38, isCurrent: true },
  { compSeasonId: 777, slug: '2025-26', label: '2025/26', startYear: 2025, endYear: 2026, maxMatchweeks: 38 },
  { compSeasonId: 719, slug: '2024-25', label: '2024/25', startYear: 2024, endYear: 2025, maxMatchweeks: 38 },
  { compSeasonId: 578, slug: '2023-24', label: '2023/24', startYear: 2023, endYear: 2024, maxMatchweeks: 38 },
  { compSeasonId: 489, slug: '2022-23', label: '2022/23', startYear: 2022, endYear: 2023, maxMatchweeks: 38 },
  { compSeasonId: 418, slug: '2021-22', label: '2021/22', startYear: 2021, endYear: 2022, maxMatchweeks: 38 },
  { compSeasonId: 363, slug: '2020-21', label: '2020/21', startYear: 2020, endYear: 2021, maxMatchweeks: 38 },
  { compSeasonId: 274, slug: '2019-20', label: '2019/20', startYear: 2019, endYear: 2020, maxMatchweeks: 38 },
  { compSeasonId: 210, slug: '2018-19', label: '2018/19', startYear: 2018, endYear: 2019, maxMatchweeks: 38 },
  { compSeasonId: 79,  slug: '2017-18', label: '2017/18', startYear: 2017, endYear: 2018, maxMatchweeks: 38 },
  { compSeasonId: 54,  slug: '2016-17', label: '2016/17', startYear: 2016, endYear: 2017, maxMatchweeks: 38 },
  { compSeasonId: 42,  slug: '2015-16', label: '2015/16', startYear: 2015, endYear: 2016, maxMatchweeks: 38 },
  { compSeasonId: 27,  slug: '2014-15', label: '2014/15', startYear: 2014, endYear: 2015, maxMatchweeks: 38 },
  { compSeasonId: 22,  slug: '2013-14', label: '2013/14', startYear: 2013, endYear: 2014, maxMatchweeks: 38 },
  { compSeasonId: 21,  slug: '2012-13', label: '2012/13', startYear: 2012, endYear: 2013, maxMatchweeks: 38 },
  { compSeasonId: 20,  slug: '2011-12', label: '2011/12', startYear: 2011, endYear: 2012, maxMatchweeks: 38 },
  { compSeasonId: 19,  slug: '2010-11', label: '2010/11', startYear: 2010, endYear: 2011, maxMatchweeks: 38 },
  { compSeasonId: 18,  slug: '2009-10', label: '2009/10', startYear: 2009, endYear: 2010, maxMatchweeks: 38 },
  { compSeasonId: 17,  slug: '2008-09', label: '2008/09', startYear: 2008, endYear: 2009, maxMatchweeks: 38 },
  { compSeasonId: 16,  slug: '2007-08', label: '2007/08', startYear: 2007, endYear: 2008, maxMatchweeks: 38 },
  { compSeasonId: 15,  slug: '2006-07', label: '2006/07', startYear: 2006, endYear: 2007, maxMatchweeks: 38 },
  { compSeasonId: 14,  slug: '2005-06', label: '2005/06', startYear: 2005, endYear: 2006, maxMatchweeks: 38 },
  { compSeasonId: 13,  slug: '2004-05', label: '2004/05', startYear: 2004, endYear: 2005, maxMatchweeks: 38 },
  { compSeasonId: 12,  slug: '2003-04', label: '2003/04', startYear: 2003, endYear: 2004, maxMatchweeks: 38 },
  { compSeasonId: 11,  slug: '2002-03', label: '2002/03', startYear: 2002, endYear: 2003, maxMatchweeks: 38 },
  { compSeasonId: 10,  slug: '2001-02', label: '2001/02', startYear: 2001, endYear: 2002, maxMatchweeks: 38 },
  { compSeasonId: 9,   slug: '2000-01', label: '2000/01', startYear: 2000, endYear: 2001, maxMatchweeks: 38 },
  { compSeasonId: 8,   slug: '1999-00', label: '1999/00', startYear: 1999, endYear: 2000, maxMatchweeks: 38 },
  { compSeasonId: 7,   slug: '1998-99', label: '1998/99', startYear: 1998, endYear: 1999, maxMatchweeks: 38 },
  { compSeasonId: 6,   slug: '1997-98', label: '1997/98', startYear: 1997, endYear: 1998, maxMatchweeks: 38 },
  { compSeasonId: 5,   slug: '1996-97', label: '1996/97', startYear: 1996, endYear: 1997, maxMatchweeks: 38 },
  { compSeasonId: 4,   slug: '1995-96', label: '1995/96', startYear: 1995, endYear: 1996, maxMatchweeks: 38 },
  { compSeasonId: 3,   slug: '1994-95', label: '1994/95', startYear: 1994, endYear: 1995, maxMatchweeks: 42 },
  { compSeasonId: 2,   slug: '1993-94', label: '1993/94', startYear: 1993, endYear: 1994, maxMatchweeks: 42 },
  { compSeasonId: 1,   slug: '1992-93', label: '1992/93', startYear: 1992, endYear: 1993, maxMatchweeks: 42 }
];

export function findSeasonBySlug(slug: string): SeasonInfo {
  return ALL_SEASONS.find(s => s.slug === slug) || ALL_SEASONS[0];
}

export function findSeasonByCompId(compId: number): SeasonInfo {
  return ALL_SEASONS.find(s => s.compSeasonId === compId) || ALL_SEASONS[0];
}
