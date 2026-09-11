async function findJs() {
  const r = await fetch("https://www.premierleague.com/en/matches/premier-league/1992-93/matchweek-1");
  const text = await r.text();
  const scriptSrcs = text.match(/src="([^"]+\.js[^"]*)"/gi) || [];
  console.log("Script srcs count:", scriptSrcs.length);

  for (let s of scriptSrcs) {
    const rawUrl = s.replace(/^src="/, '').replace(/"$/, '');
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : "https://www.premierleague.com" + rawUrl;
    if (fullUrl.includes("app") || fullUrl.includes("main") || fullUrl.includes("matches") || fullUrl.includes("index")) {
      console.log("Checking:", fullUrl);
      const res = await fetch(fullUrl);
      const js = await res.text();
      const apiMatches = js.match(/api\/v\d\/[a-zA-Z0-9_\-\/{}:]+/g);
      if (apiMatches) {
        console.log("API endpoints:", Array.from(new Set(apiMatches)).slice(0, 15));
      }
      const pulselive = js.match(/https?:\/\/[a-zA-Z0-9\.\-]+pulselive[a-zA-Z0-9\.\-\/]+/g);
      if (pulselive) {
        console.log("PulseLive URLs:", Array.from(new Set(pulselive)).slice(0, 10));
      }
      const competition = js.match(/competitions\/[a-zA-Z0-9_\-\/{}:]+/g);
      if (competition) {
        console.log("Competitions paths:", Array.from(new Set(competition)).slice(0, 10));
      }
    }
  }
}
findJs();
