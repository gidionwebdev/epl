async function test() {
  const res = await fetch("https://www.premierleague.com/resources/v1.52.5/scripts/bundle-es.min.js");
  const code = await res.text();
  const pattern = "competitions/${e}/seasons/${t}/matchweeks";
  const idx = code.indexOf(pattern);
  if (idx !== -1) {
    console.log("Context around pattern:\n", code.substring(idx - 400, idx + 400));
  }

  // Also search for where season dropdown or seasons list is constructed
  const seasonSelectIdx = code.indexOf("season");
  // Let's search for "competitionId" or competition 8 or 1
  const compIdMatches = code.match(/competitionId\s*[:=]\s*[^,\};]+/gi);
  console.log("competitionId matches:", compIdMatches?.slice(0, 10));

  // Let's search for "competitions/" in general
  const compList = code.match(/competitions\/\d+/g);
  console.log("compList:", Array.from(new Set(compList || [])));
}
test();
