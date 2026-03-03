require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { readData, insertItem, updateItem, deleteItem, findItems } = require('./utils/dataHandler');
const { sendRecruiterEmail, sendPlayerEmail, testEmailConfig } = require('./utils/emailHandler');
const { processEmailRequest, chatWithAI } = require('./utils/openaiHandler');
const { startRecommendationCron, sendImmediateRecommendations } = require('./utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load data
const playersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'players.json'), 'utf-8'));
const matchesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'matches.json'), 'utf-8'));

// Start cron jobs
startRecommendationCron(playersData);

// Root API endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Sports Stats API - AI-Powered Talent Scouting',
        version: '2.0.0',
        features: ['AI Function Calling', 'Automated Recommendations', 'QR Code Player Profiles'],
        endpoints: {
            players: {
                all: 'GET /api/players',
                byId: 'GET /api/players/:id',
                qrCode: 'GET /api/players/:id/qrcode',
                byPosition: 'GET /api/players/position/:position',
                byTeam: 'GET /api/players/team/:team'
            },
            matches: {
                all: 'GET /api/matches',
                byId: 'GET /api/matches/:id',
                upcoming: 'GET /api/matches/upcoming',
                completed: 'GET /api/matches/completed'
            },
            standings: 'GET /api/standings',
            scouts: {
                all: 'GET /api/scouts',
                searches: 'GET /api/scouts/searches',
                createSearch: 'POST /api/scouts/search',
                matchPlayers: 'POST /api/scouts/match-players'
            }
        }
    });
});

// ===== PLAYER ENDPOINTS =====

// Get all players
app.get('/api/players', (req, res) => {
    res.json(playersData);
});

// Get player by ID
app.get('/api/players/:id', (req, res) => {
    const player = playersData.players.find(p => p.id === parseInt(req.params.id));
    if (player) {
        res.json(player);
    } else {
        res.status(404).json({ error: 'Player not found' });
    }
});

// Get players by position
app.get('/api/players/position/:position', (req, res) => {
    const position = req.params.position;
    const players = playersData.players.filter(
        p => p.position.toLowerCase() === position.toLowerCase()
    );
    if (players.length > 0) {
        res.json({ position, count: players.length, players });
    } else {
        res.status(404).json({ error: 'No players found for this position' });
    }
});

// Get players by team
app.get('/api/players/team/:team', (req, res) => {
    const teamName = req.params.team;
    const players = playersData.players.filter(
        p => p.team.toLowerCase().includes(teamName.toLowerCase())
    );
    if (players.length > 0) {
        res.json({ team: teamName, count: players.length, players });
    } else {
        res.status(404).json({ error: 'No players found for this team' });
    }
});

// Generate QR code for player
app.get('/api/players/:id/qrcode', async (req, res) => {
    try {
        const player = playersData.players.find(p => p.id === parseInt(req.params.id));
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Generate QR code with player ID
        const qrData = `player_id=${player.id}&name=${encodeURIComponent(player.name)}`;
        const qrCodeImage = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#667eea',
                light: '#ffffff'
            }
        });

        res.json({
            playerId: player.id,
            playerName: player.name,
            qrCode: qrCodeImage
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== MATCH ENDPOINTS =====

// Get all matches
app.get('/api/matches', (req, res) => {
    res.json(matchesData);
});

// Get match by ID
app.get('/api/matches/:id', (req, res) => {
    const match = matchesData.matches.find(m => m.id === parseInt(req.params.id));
    if (match) {
        res.json(match);
    } else {
        res.status(404).json({ error: 'Match not found' });
    }
});

// Get upcoming matches
app.get('/api/matches/upcoming', (req, res) => {
    const upcoming = matchesData.matches.filter(m => m.status === 'scheduled');
    res.json({ count: upcoming.length, matches: upcoming });
});

// Get completed matches
app.get('/api/matches/completed', (req, res) => {
    const completed = matchesData.matches.filter(m => m.status === 'completed');
    res.json({ count: completed.length, matches: completed });
});

// ===== STANDINGS ENDPOINT =====

// Get league standings
app.get('/api/standings', (req, res) => {
    res.json({ standings: matchesData.standings });
});

// ===== YOLO DETECTION DATA =====

// Get YOLOv12 detection data for a specific match
app.get('/api/matches/:id/detections', (req, res) => {
    const match = matchesData.matches.find(m => m.id === parseInt(req.params.id));
    if (match && match.detectedObjects) {
        res.json({
            matchId: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            detections: match.detectedObjects
        });
    } else if (match && !match.detectedObjects) {
        res.status(404).json({ error: 'No detection data available for this match (scheduled match)' });
    } else {
        res.status(404).json({ error: 'Match not found' });
    }
});

// ===== STATISTICS ENDPOINTS =====

// Get top scorers
app.get('/api/stats/top-scorers', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const topScorers = playersData.players
        .filter(p => p.stats.goals !== undefined)
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, limit)
        .map(p => ({
            name: p.name,
            team: p.team,
            position: p.position,
            goals: p.stats.goals,
            gamesPlayed: p.stats.gamesPlayed
        }));
    res.json({ topScorers });
});

// Get top assisters
app.get('/api/stats/top-assists', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const topAssisters = playersData.players
        .filter(p => p.stats.assists !== undefined)
        .sort((a, b) => b.stats.assists - a.stats.assists)
        .slice(0, limit)
        .map(p => ({
            name: p.name,
            team: p.team,
            position: p.position,
            assists: p.stats.assists,
            gamesPlayed: p.stats.gamesPlayed
        }));
    res.json({ topAssisters });
});

// ===== TALENT SCOUT ENDPOINTS =====

// Get all scouts
app.get('/api/scouts', (req, res) => {
    try {
        const scoutsData = readData('scouts.json');
        res.json(scoutsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all saved searches
app.get('/api/scouts/searches', (req, res) => {
    try {
        const scoutsData = readData('scouts.json');
        res.json({ searches: scoutsData.searches || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get searches by scout ID
app.get('/api/scouts/:scoutId/searches', (req, res) => {
    try {
        const scoutId = parseInt(req.params.scoutId);
        const searches = findItems('scouts.json', 'searches', (search) => search.scoutId === scoutId);
        res.json({ scoutId, count: searches.length, searches });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new scout search with requirements
app.post('/api/scouts/search', (req, res) => {
    try {
        const { scoutId, scoutName, description, requirements } = req.body;

        if (!scoutId || !scoutName || !description || !requirements) {
            return res.status(400).json({
                error: 'Missing required fields: scoutId, scoutName, description, requirements'
            });
        }

        const searchData = {
            scoutId,
            scoutName,
            description,
            requirements
        };

        const newSearch = insertItem('scouts.json', 'searches', searchData);
        res.status(201).json({
            message: 'Search preference saved successfully',
            search: newSearch
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Match players based on search requirements
app.post('/api/scouts/match-players', (req, res) => {
    try {
        const { requirements } = req.body;

        if (!requirements) {
            return res.status(400).json({ error: 'Requirements object is required' });
        }

        let matchedPlayers = playersData.players;

        // Filter by position
        if (requirements.position) {
            matchedPlayers = matchedPlayers.filter(
                p => p.position.toLowerCase() === requirements.position.toLowerCase()
            );
        }

        // Filter by age range
        if (requirements.minAge !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.age >= requirements.minAge);
        }
        if (requirements.maxAge !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.age <= requirements.maxAge);
        }

        // Filter by height
        if (requirements.minHeight !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.height >= requirements.minHeight);
        }

        // Filter by stats
        if (requirements.minGoals !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.goals !== undefined && p.stats.goals >= requirements.minGoals
            );
        }
        if (requirements.minAssists !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.assists !== undefined && p.stats.assists >= requirements.minAssists
            );
        }
        if (requirements.minPassAccuracy !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.passAccuracy !== undefined && p.stats.passAccuracy >= requirements.minPassAccuracy
            );
        }
        if (requirements.minDribbles !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.dribbles !== undefined && p.stats.dribbles >= requirements.minDribbles
            );
        }
        if (requirements.minTackles !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.tackles !== undefined && p.stats.tackles >= requirements.minTackles
            );
        }
        if (requirements.minInterceptions !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.interceptions !== undefined && p.stats.interceptions >= requirements.minInterceptions
            );
        }
        if (requirements.minClearances !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.clearances !== undefined && p.stats.clearances >= requirements.minClearances
            );
        }
        if (requirements.minSaves !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.saves !== undefined && p.stats.saves >= requirements.minSaves
            );
        }
        if (requirements.minSavePercentage !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.savePercentage !== undefined && p.stats.savePercentage >= requirements.minSavePercentage
            );
        }

        res.json({
            requirements,
            matchCount: matchedPlayers.length,
            players: matchedPlayers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get matched players for a saved search
app.get('/api/scouts/searches/:searchId/matches', (req, res) => {
    try {
        const searchId = parseInt(req.params.searchId);
        const scoutsData = readData('scouts.json');
        const search = scoutsData.searches.find(s => s.id === searchId);

        if (!search) {
            return res.status(404).json({ error: 'Search not found' });
        }

        const requirements = search.requirements;
        let matchedPlayers = playersData.players;

        // Apply the same filtering logic as match-players endpoint
        if (requirements.position) {
            matchedPlayers = matchedPlayers.filter(
                p => p.position.toLowerCase() === requirements.position.toLowerCase()
            );
        }
        if (requirements.minAge !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.age >= requirements.minAge);
        }
        if (requirements.maxAge !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.age <= requirements.maxAge);
        }
        if (requirements.minHeight !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.height >= requirements.minHeight);
        }
        if (requirements.minGoals !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.goals !== undefined && p.stats.goals >= requirements.minGoals
            );
        }
        if (requirements.minAssists !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.assists !== undefined && p.stats.assists >= requirements.minAssists
            );
        }
        if (requirements.minPassAccuracy !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.passAccuracy !== undefined && p.stats.passAccuracy >= requirements.minPassAccuracy
            );
        }
        if (requirements.minDribbles !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.dribbles !== undefined && p.stats.dribbles >= requirements.minDribbles
            );
        }
        if (requirements.minTackles !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.tackles !== undefined && p.stats.tackles >= requirements.minTackles
            );
        }
        if (requirements.minInterceptions !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.interceptions !== undefined && p.stats.interceptions >= requirements.minInterceptions
            );
        }
        if (requirements.minClearances !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.clearances !== undefined && p.stats.clearances >= requirements.minClearances
            );
        }
        if (requirements.minSaves !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.saves !== undefined && p.stats.saves >= requirements.minSaves
            );
        }
        if (requirements.minSavePercentage !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.savePercentage !== undefined && p.stats.savePercentage >= requirements.minSavePercentage
            );
        }

        res.json({
            search,
            matchCount: matchedPlayers.length,
            players: matchedPlayers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== EMAIL ENDPOINTS =====

// Test email configuration
app.get('/api/email/test-config', async (req, res) => {
    try {
        const isValid = await testEmailConfig();
        res.json({
            success: isValid,
            message: isValid
                ? 'Email configuration is valid and ready'
                : 'Email configuration failed. Check console for details.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send email to recruiter with matched players
app.post('/api/email/send-to-recruiter', async (req, res) => {
    try {
        const { email, scoutName, searchDescription, playerIds } = req.body;

        if (!email || !scoutName || !playerIds || !Array.isArray(playerIds)) {
            return res.status(400).json({
                error: 'Missing required fields: email, scoutName, and playerIds (array) are required'
            });
        }

        // Get player details
        const players = playersData.players.filter(p => playerIds.includes(p.id));

        if (players.length === 0) {
            return res.status(404).json({ error: 'No players found with provided IDs' });
        }

        const result = await sendRecruiterEmail({
            to: email,
            scoutName,
            searchDescription,
            players
        });

        res.status(200).json({
            message: 'Email sent successfully',
            ...result,
            playersIncluded: players.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send email to player about scout interest
app.post('/api/email/send-to-player', async (req, res) => {
    try {
        const {
            playerEmail,
            playerName,
            scoutName,
            scoutEmail,
            scoutOrganization,
            message
        } = req.body;

        if (!playerEmail || !playerName || !scoutName || !scoutEmail || !scoutOrganization) {
            return res.status(400).json({
                error: 'Missing required fields: playerEmail, playerName, scoutName, scoutEmail, scoutOrganization'
            });
        }

        const result = await sendPlayerEmail({
            to: playerEmail,
            playerName,
            scoutName,
            scoutEmail,
            scoutOrganization,
            message: message || ''
        });

        res.status(200).json({
            message: 'Email sent successfully',
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send email based on search results and notify scout
app.post('/api/email/notify-search-results', async (req, res) => {
    try {
        const { searchId, scoutEmail } = req.body;

        if (!searchId || !scoutEmail) {
            return res.status(400).json({
                error: 'Missing required fields: searchId and scoutEmail'
            });
        }

        const scoutsData = readData('scouts.json');
        const search = scoutsData.searches.find(s => s.id === parseInt(searchId));

        if (!search) {
            return res.status(404).json({ error: 'Search not found' });
        }

        // Get matched players
        const requirements = search.requirements;
        let matchedPlayers = playersData.players;

        if (requirements.position) {
            matchedPlayers = matchedPlayers.filter(
                p => p.position.toLowerCase() === requirements.position.toLowerCase()
            );
        }
        if (requirements.minAge !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.age >= requirements.minAge);
        }
        if (requirements.maxAge !== undefined) {
            matchedPlayers = matchedPlayers.filter(p => p.physical.age <= requirements.maxAge);
        }
        if (requirements.minGoals !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.goals !== undefined && p.stats.goals >= requirements.minGoals
            );
        }
        if (requirements.minAssists !== undefined) {
            matchedPlayers = matchedPlayers.filter(
                p => p.stats.assists !== undefined && p.stats.assists >= requirements.minAssists
            );
        }

        if (matchedPlayers.length === 0) {
            return res.status(404).json({ error: 'No players match the search criteria' });
        }

        const result = await sendRecruiterEmail({
            to: scoutEmail,
            scoutName: search.scoutName,
            searchDescription: search.description,
            players: matchedPlayers
        });

        res.status(200).json({
            message: 'Search results email sent successfully',
            ...result,
            playersMatched: matchedPlayers.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== CRON JOB & RECOMMENDATIONS =====

// Trigger immediate recommendations to all scouts
app.post('/api/cron/send-recommendations', async (req, res) => {
    try {
        const results = await sendImmediateRecommendations(playersData);
        res.status(200).json({
            message: 'Recommendations sent',
            results: results,
            totalScouts: results.length,
            successful: results.filter(r => r.status === 'sent').length,
            failed: results.filter(r => r.status === 'failed').length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== OPENAI FUNCTION CALLING ENDPOINTS =====

// Process natural language email request using OpenAI
app.post('/api/ai/process-request', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await processEmailRequest(message, playersData);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            tip: 'Make sure OPENAI_API_KEY is set in your .env file'
        });
    }
});

// Chat with AI assistant
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'Messages array is required',
                example: { messages: [{ role: 'user', content: 'Find me young forwards' }] }
            });
        }

        const result = await chatWithAI(messages, playersData);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            tip: 'Make sure OPENAI_API_KEY is set in your .env file'
        });
    }
});

// AI-powered player search
app.post('/api/ai/find-players', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                error: 'Query is required',
                example: { query: 'I need a young midfielder with good passing' }
            });
        }

        const message = `Find players that match this criteria: ${query}`;
        const result = await processEmailRequest(message, playersData);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI-powered email sender (smart routing)
app.post('/api/ai/send-email', async (req, res) => {
    try {
        const { instruction, data } = req.body;

        if (!instruction) {
            return res.status(400).json({
                error: 'Instruction is required',
                example: {
                    instruction: 'Send an email to the scout about these players',
                    data: {
                        scoutEmail: 'scout@example.com',
                        scoutName: 'John Doe',
                        playerIds: [1, 2, 3]
                    }
                }
            });
        }

        // Combine instruction with data context
        const message = `${instruction}. Context data: ${JSON.stringify(data || {})}`;
        const result = await processEmailRequest(message, playersData);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Sports Stats API - AI-Powered Talent Scouting`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`🌐 Server running on: http://localhost:${PORT}`);
    console.log(`📱 Web Interface: http://localhost:${PORT}/index.html`);
    console.log(`\n${'─'.repeat(60)}\n`);
    
    console.log(`🤖 AI-POWERED ENDPOINTS (Primary):`);
    console.log(`   📝 POST /api/ai/process-request - Natural language processing`);
    console.log(`   💬 POST /api/ai/chat - Conversational AI assistant`);
    console.log(`   🔍 POST /api/ai/find-players - AI player search`);
    console.log(`   📧 POST /api/ai/send-email - Smart email routing`);
    
    console.log(`\n📊 PLAYER & DATA ENDPOINTS:`);
    console.log(`   👥 GET /api/players - All players`);
    console.log(`   🆔 GET /api/players/:id - Player by ID`);
    console.log(`   📱 GET /api/players/:id/qrcode - Generate player QR code`);
    console.log(`   ⚽ GET /api/players/position/:position - By position`);
    console.log(`   🏆 GET /api/stats/top-scorers - Top scorers`);
    
    console.log(`\n⏰ AUTOMATED TASKS:`);
    console.log(`   📅 Cron: Weekly recommendations (Mondays 9:00 AM)`);
    console.log(`   🔔 POST /api/cron/send-recommendations - Manual trigger`);
    
    console.log(`\n${'─'.repeat(60)}\n`);
    console.log(`💡 TIP: Open http://localhost:${PORT} in your browser!`);
    console.log(`${'='.repeat(60)}\n`);
});
