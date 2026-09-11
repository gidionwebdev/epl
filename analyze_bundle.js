async function test() {
  const res = await fetch("https://www.premierleague.com/resources/v1.52.5/scripts/bundle-es.min.js");
  console.log("bundle status:", res.status);
  const code = await res.text();
  console.log("bundle length:", code.length);

  const compMatches = code.match(/competitions\/[^\s"'\`]+/g);
  console.log("competitions endpoints:", Array.from(new Set(compMatches || [])).slice(0, 15));

  const sdpEndpoints = code.match(/api\/v\d\/[^\s"'\`]+/g);
  console.log("sdpEndpoints:", Array.from(new Set(sdpEndpoints || [])).slice(0, 15));

  const idx1992 = code.indexOf("1992");
  console.log("indexOf 1992:", idx1992);
  if (idx1992 !== -1) {
    console.log("around 1992:", code.substring(idx1992 - 100, idx1992 + 200));
  }

  // Let's search for "matchweeks" in code
  const mwMatches = code.match(/[^\s"'\`]*matchweeks[^\s"'\`]*/g);
  console.log("matchweeks occurrences:", Array.from(new Set(mwMatches || [])).slice(0, 10));

  // Let's search for "seasons"
  const seasonsMatches = code.match(/api\/v\d\/competitions\/\d+\/seasons[^\s"'\`]*/g);
  console.log("seasons endpoints:", Array.from(new Set(seasonsMatches || [])).slice(0, 10));
}
test();
