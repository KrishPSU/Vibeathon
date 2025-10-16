const WebSocket = require('ws');
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use('/', express.static(path.join(__dirname, 'home')));

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// NFL QBs database with ESPN IDs
let qbs = [
    { id: 1, name: "Patrick Mahomes", team: "Kansas City Chiefs", espnId: "3139477", rating: 1500, votes: 0, emoji: "🔴" },
    { id: 2, name: "Josh Allen", team: "Buffalo Bills", espnId: "3918298", rating: 1500, votes: 0, emoji: "🔵" },
    { id: 3, name: "Joe Burrow", team: "Cincinnati Bengals", espnId: "4360310", rating: 1500, votes: 0, emoji: "🧡" },
    { id: 4, name: "Lamar Jackson", team: "Baltimore Ravens", espnId: "3916387", rating: 1500, votes: 0, emoji: "💜" },
    { id: 5, name: "Jalen Hurts", team: "Philadelphia Eagles", espnId: "4361741", rating: 1500, votes: 0, emoji: "🦅" },
    { id: 6, name: "Dak Prescott", team: "Dallas Cowboys", espnId: "2577417", rating: 1500, votes: 0, emoji: "⭐" },
    { id: 7, name: "Justin Herbert", team: "Los Angeles Chargers", espnId: "4038941", rating: 1500, votes: 0, emoji: "⚡" },
    { id: 8, name: "Trevor Lawrence", team: "Jacksonville Jaguars", espnId: "4360310", rating: 1500, votes: 0, emoji: "🐆" },
    { id: 9, name: "Tua Tagovailoa", team: "Miami Dolphins", espnId: "4241479", rating: 1500, votes: 0, emoji: "🐬" },
    { id: 10, name: "Brock Purdy", team: "San Francisco 49ers", espnId: "4430068", rating: 1500, votes: 0, emoji: "🔴" },
    { id: 11, name: "Geno Smith", team: "Seattle Seahawks", espnId: "14881", rating: 1500, votes: 0, emoji: "🦅" },
    { id: 12, name: "Jared Goff", team: "Detroit Lions", espnId: "3046779", rating: 1500, votes: 0, emoji: "🦁" },
    { id: 13, name: "Kirk Cousins", team: "Atlanta Falcons", espnId: "14880", rating: 1500, votes: 0, emoji: "🔴" },
    { id: 14, name: "Daniel Jones", team: "New York Giants", espnId: "3915511", rating: 1500, votes: 0, emoji: "🔵" },
    { id: 15, name: "Derek Carr", team: "New Orleans Saints", espnId: "16757", rating: 1500, votes: 0, emoji: "⚜️" },
    { id: 16, name: "Russell Wilson", team: "Pittsburgh Steelers", espnId: "14881", rating: 1500, votes: 0, emoji: "⚫" },
    { id: 17, name: "Deshaun Watson", team: "Cleveland Browns", espnId: "3052587", rating: 1500, votes: 0, emoji: "🟤" },
    { id: 18, name: "Jordan Love", team: "Green Bay Packers", espnId: "4241389", rating: 1500, votes: 0, emoji: "💚" },
    { id: 19, name: "C.J. Stroud", team: "Houston Texans", espnId: "4431611", rating: 1500, votes: 0, emoji: "🔴" },
    { id: 20, name: "Anthony Richardson", team: "Indianapolis Colts", espnId: "4569618", rating: 1500, votes: 0, emoji: "🔵" },
    { id: 21, name: "Matthew Stafford", team: "Los Angeles Rams", espnId: "12483", rating: 1500, votes: 0, emoji: "💙" },
    { id: 22, name: "Baker Mayfield", team: "Tampa Bay Buccaneers", espnId: "3912547", rating: 1500, votes: 0, emoji: "🔴" },
    { id: 23, name: "Kyler Murray", team: "Arizona Cardinals", espnId: "3918298", rating: 1500, votes: 0, emoji: "🔴" },
    { id: 24, name: "Bryce Young", team: "Carolina Panthers", espnId: "4432577", rating: 1500, votes: 0, emoji: "🔵" },
    { id: 25, name: "Sam Howell", team: "Seattle Seahawks", espnId: "4426385", rating: 1500, votes: 0, emoji: "💚" },
    { id: 26, name: "Jacoby Brissett", team: "New England Patriots", espnId: "2969939", rating: 1500, votes: 0, emoji: "🔴" },
    { id: 27, name: "Justin Fields", team: "Pittsburgh Steelers", espnId: "4360797", rating: 1500, votes: 0, emoji: "🧡" },
    { id: 28, name: "Aaron Rodgers", team: "New York Jets", espnId: "8439", rating: 1500, votes: 0, emoji: "💚" },
    { id: 29, name: "Kenny Pickett", team: "Philadelphia Eagles", espnId: "4361031", rating: 1500, votes: 0, emoji: "⚫" },
    { id: 30, name: "Will Levis", team: "Tennessee Titans", espnId: "4432580", rating: 1500, votes: 0, emoji: "⚔️" }
];

let totalVotes = 0;

// Fetch player headshot from ESPN API
function fetchPlayerHeadshot(espnId) {
    return new Promise((resolve, reject) => {
        const url = `https://site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${espnId}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const headshotUrl = json.athlete?.headshot?.href || null;
                    resolve(headshotUrl);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Fetch team logo from ESPN API
function fetchTeamLogo(teamName) {
    return new Promise((resolve, reject) => {
        // Map team names to ESPN team IDs
        const teamIds = {
            "Kansas City Chiefs": "12",
            "Buffalo Bills": "2",
            "Cincinnati Bengals": "4",
            "Baltimore Ravens": "33",
            "Philadelphia Eagles": "21",
            "Dallas Cowboys": "6",
            "Los Angeles Chargers": "24",
            "Jacksonville Jaguars": "30",
            "Miami Dolphins": "15",
            "San Francisco 49ers": "25",
            "Seattle Seahawks": "26",
            "Detroit Lions": "8",
            "Atlanta Falcons": "1",
            "New York Giants": "19",
            "New Orleans Saints": "18",
            "Pittsburgh Steelers": "23",
            "Cleveland Browns": "5",
            "Green Bay Packers": "9",
            "Houston Texans": "34",
            "Indianapolis Colts": "11",
            "Los Angeles Rams": "14",
            "Tampa Bay Buccaneers": "27",
            "Arizona Cardinals": "22",
            "Carolina Panthers": "29",
            "New England Patriots": "17",
            "Chicago Bears": "3",
            "New York Jets": "20",
            "Tennessee Titans": "10",
            "Las Vegas Raiders": "13",
            "Minnesota Vikings": "16",
            "Washington Commanders": "28",
            "Denver Broncos": "7"
        };
        
        const teamId = teamIds[teamName];
        if (!teamId) {
            resolve(null);
            return;
        }
        
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const logoUrl = json.team?.logos?.[0]?.href || null;
                    resolve(logoUrl);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Initialize QBs with headshots and team logos
async function initializeQBs() {
    console.log('Fetching player headshots and team logos...');
    
    for (let qb of qbs) {
        try {
            // Fetch headshot
            const headshotUrl = await fetchPlayerHeadshot(qb.espnId);
            qb.headshotUrl = headshotUrl;
            
            // Fetch team logo
            const teamLogoUrl = await fetchTeamLogo(qb.team);
            qb.teamLogoUrl = teamLogoUrl;
            
            console.log(`✓ Loaded ${qb.name}`);
        } catch (error) {
            console.error(`✗ Error loading ${qb.name}:`, error.message);
        }
    }
    
    console.log('All QBs initialized!');
}

// Initialize on startup
initializeQBs();

// ELO rating calculation (K-factor of 32)
function calculateNewRatings(winnerRating, loserRating) {
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
    
    const newWinnerRating = winnerRating + K * (1 - expectedWinner);
    const newLoserRating = loserRating + K * (0 - expectedLoser);
    
    return { newWinnerRating, newLoserRating };
}

// Get two QBs with similar ratings for matchup
function getMatchup() {
    const sorted = [...qbs].sort((a, b) => b.rating - a.rating);
    
    const index1 = Math.floor(Math.random() * qbs.length);
    let qb1 = qbs[index1];
    
    const similarQBs = qbs.filter(qb => 
        qb.id !== qb1.id && 
        Math.abs(qb.rating - qb1.rating) < 200
    );
    
    let qb2;
    if (similarQBs.length > 0) {
        qb2 = similarQBs[Math.floor(Math.random() * similarQBs.length)];
    } else {
        let index2 = Math.floor(Math.random() * qbs.length);
        while (index2 === index1) {
            index2 = Math.floor(Math.random() * qbs.length);
        }
        qb2 = qbs[index2];
    }
    
    return { qb1, qb2 };
}

// Broadcast to all connected clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.send(JSON.stringify({
        type: 'rankings',
        qbs: qbs,
        totalVotes: totalVotes
    }));
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'getMatchup') {
            const matchup = getMatchup();
            ws.send(JSON.stringify({
                type: 'matchup',
                qb1: matchup.qb1,
                qb2: matchup.qb2
            }));
        }
        
        if (data.type === 'vote') {
            const winner = qbs.find(qb => qb.id === data.winnerId);
            const loser = qbs.find(qb => qb.id === data.loserId);
            
            if (winner && loser) {
                const { newWinnerRating, newLoserRating } = calculateNewRatings(
                    winner.rating,
                    loser.rating
                );
                
                winner.rating = newWinnerRating;
                loser.rating = newLoserRating;
                winner.votes++;
                loser.votes++;
                totalVotes++;
                
                broadcast({
                    type: 'update',
                    qbs: qbs,
                    totalVotes: totalVotes
                });
            }
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running');
