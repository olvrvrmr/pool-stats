// scripts/parse-fixtures.ts
const fs = require('fs');
const path = require('path');

interface TeamStats {
  played: number;
  wins: number;
  losses: number;
  points: number;
  framesWon: number;
  framesLost: number;
}

const FIXTURES_PATH = path.join(__dirname, '../fixtures.md');
const STANDINGS_PATH = path.join(__dirname, '../standings.md');

const teamStats: Record<string, TeamStats> = {};

function ensureTeam(name: string) {
  if (!teamStats[name]) {
    teamStats[name] = {
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      framesWon: 0,
      framesLost: 0,
    };
  }
}

function parseFixtures(markdown: string) {
  const lines = markdown.split('\n').filter(l => l.includes('|'));

  lines.forEach(line => {
    const match = line.match(/(.+?) vs (.+?)\s*\|\s*(\d+)[–-](\d+)\s*\|\s*Points:\s*(\d+)[–-](\d+)/);
    if (!match) return;

    const [, teamA, teamB, rawA, rawB, ptsA, ptsB] = match;
    const scoreA = parseInt(rawA);
    const scoreB = parseInt(rawB);
    const pointsA = parseInt(ptsA);
    const pointsB = parseInt(ptsB);

    ensureTeam(teamA);
    ensureTeam(teamB);

    teamStats[teamA].played++;
    teamStats[teamB].played++;
    teamStats[teamA].framesWon += scoreA;
    teamStats[teamA].framesLost += scoreB;
    teamStats[teamB].framesWon += scoreB;
    teamStats[teamB].framesLost += scoreA;
    teamStats[teamA].points += pointsA;
    teamStats[teamB].points += pointsB;

    if (scoreA > scoreB) {
      teamStats[teamA].wins++;
      teamStats[teamB].losses++;
    } else {
      teamStats[teamB].wins++;
      teamStats[teamA].losses++;
    }
  });
}

function generateStandings(): string {
  const sorted = Object.entries(teamStats).sort((a, b) => b[1].points - a[1].points);

  const header = '| Team | P | W | L | Points | Frames Won | Frames Lost |\n|------|---|---|---|--------|------------|-------------|';
  const rows = sorted.map(([team, stats]) =>
    `| ${team} | ${stats.played} | ${stats.wins} | ${stats.losses} | ${stats.points} | ${stats.framesWon} | ${stats.framesLost} |`
  );

  return ['# 📊 League Standings', '', header, ...rows, ''].join('\n');
}

function main() {
  const content = fs.readFileSync(FIXTURES_PATH, 'utf-8');
  parseFixtures(content);
  const standings = generateStandings();
  fs.writeFileSync(STANDINGS_PATH, standings);
  console.log('✅ standings.md updated');
}

main();