const cron = require('node-cron');
const { sendRecruiterEmail, sendPlayerEmail } = require('./emailHandler');
const { readData } = require('./dataHandler');

/**
 * Cron job to send player recommendations to talent scouts
 * Runs every minute (for testing)
 */
function startRecommendationCron(playersData) {
    // Schedule: Every minute for testing
    // Format: second minute hour day month weekday
    // '* * * * *' = Every minute

    cron.schedule('* * * * *', async () => {
        console.log('🔔 Running scheduled talent scout recommendations...');

        try {
            const scoutsData = readData('scouts.json');
            const scouts = scoutsData.scouts || [];

            for (const scout of scouts) {
                // Find searches for this scout
                const scoutSearches = scoutsData.searches.filter(s => s.scoutId === scout.id);

                if (scoutSearches.length === 0) {
                    console.log(`⏭️  Skipping ${scout.name} - no active searches`);
                    continue;
                }

                // Get latest search
                const latestSearch = scoutSearches[scoutSearches.length - 1];
                const requirements = latestSearch.requirements;

                // Find matching players
                let matchedPlayers = playersData.players;

                if (requirements.position) {
                    matchedPlayers = matchedPlayers.filter(
                        p => p.position.toLowerCase() === requirements.position.toLowerCase()
                    );
                }
                if (requirements.minAge) matchedPlayers = matchedPlayers.filter(p => p.physical.age >= requirements.minAge);
                if (requirements.maxAge) matchedPlayers = matchedPlayers.filter(p => p.physical.age <= requirements.maxAge);
                if (requirements.minGoals) matchedPlayers = matchedPlayers.filter(p => p.stats.goals >= requirements.minGoals);
                if (requirements.minAssists) matchedPlayers = matchedPlayers.filter(p => p.stats.assists >= requirements.minAssists);
                if (requirements.minPassAccuracy) matchedPlayers = matchedPlayers.filter(p => p.stats.passAccuracy >= requirements.minPassAccuracy);
                if (requirements.minTackles) matchedPlayers = matchedPlayers.filter(p => p.stats.tackles >= requirements.minTackles);
                if (requirements.minHeight) matchedPlayers = matchedPlayers.filter(p => p.physical.height >= requirements.minHeight);

                if (matchedPlayers.length === 0) {
                    console.log(`⏭️  No matches for ${scout.name}`);
                    continue;
                }

                // Send email with recommendations to recruiter
                try {
                    await sendRecruiterEmail({
                        to: scout.email,
                        scoutName: scout.name,
                        searchDescription: latestSearch.description,
                        players: matchedPlayers.slice(0, 5) // Top 5 matches
                    });

                    console.log(`✅ Sent recommendations to ${scout.name} (${scout.email})`);
                } catch (emailError) {
                    console.error(`❌ Failed to send email to ${scout.name}:`, emailError.message);
                }

                // Notify matched players that their profile appeared in a search
                for (const player of matchedPlayers.slice(0, 5)) {
                    try {
                        await sendPlayerEmail({
                            to: `${player.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                            playerName: player.name,
                            scoutOrganization: scout.organization,
                            searchDescription: latestSearch.description,
                            subject: '🌟 Great News! Your profile caught a talent scout\'s attention'
                        });

                        console.log(`📧 Notified player ${player.name} about scout interest`);
                    } catch (playerEmailError) {
                        console.error(`❌ Failed to notify player ${player.name}:`, playerEmailError.message);
                    }
                }
            }

            console.log('✅ Recommendations completed');
        } catch (error) {
            console.error('❌ Error in recommendation cron job:', error.message);
        }
    });

    console.log('📅 Cron job scheduled: Talent scout recommendations (Every minute)');
}

/**
 * Manual trigger for testing (sends immediately)
 */
async function sendImmediateRecommendations(playersData) {
    console.log('📧 Sending immediate recommendations to all scouts...');

    try {
        const scoutsData = readData('scouts.json');
        const scouts = scoutsData.scouts || [];
        const results = [];

        for (const scout of scouts) {
            const scoutSearches = scoutsData.searches.filter(s => s.scoutId === scout.id);

            if (scoutSearches.length === 0) {
                results.push({ scout: scout.name, status: 'skipped', reason: 'No active searches' });
                continue;
            }

            const latestSearch = scoutSearches[scoutSearches.length - 1];
            const requirements = latestSearch.requirements;

            let matchedPlayers = playersData.players;

            if (requirements.position) {
                matchedPlayers = matchedPlayers.filter(
                    p => p.position.toLowerCase() === requirements.position.toLowerCase()
                );
            }
            if (requirements.minAge) matchedPlayers = matchedPlayers.filter(p => p.physical.age >= requirements.minAge);
            if (requirements.maxAge) matchedPlayers = matchedPlayers.filter(p => p.physical.age <= requirements.maxAge);
            if (requirements.minGoals) matchedPlayers = matchedPlayers.filter(p => p.stats.goals >= requirements.minGoals);
            if (requirements.minAssists) matchedPlayers = matchedPlayers.filter(p => p.stats.assists >= requirements.minAssists);
            if (requirements.minPassAccuracy) matchedPlayers = matchedPlayers.filter(p => p.stats.passAccuracy >= requirements.minPassAccuracy);
            if (requirements.minTackles) matchedPlayers = matchedPlayers.filter(p => p.stats.tackles >= requirements.minTackles);
            if (requirements.minHeight) matchedPlayers = matchedPlayers.filter(p => p.physical.height >= requirements.minHeight);

            if (matchedPlayers.length === 0) {
                results.push({ scout: scout.name, status: 'skipped', reason: 'No matching players' });
                continue;
            }

            try {
                const emailResult = await sendRecruiterEmail({
                    to: scout.email,
                    scoutName: scout.name,
                    searchDescription: latestSearch.description,
                    players: matchedPlayers.slice(0, 5)
                });

                results.push({
                    scout: scout.name,
                    status: 'sent',
                    email: scout.email,
                    playersMatched: matchedPlayers.length,
                    messageId: emailResult.messageId
                });
            } catch (emailError) {
                results.push({
                    scout: scout.name,
                    status: 'failed',
                    error: emailError.message
                });
            }
        }

        return results;
    } catch (error) {
        throw new Error(`Failed to send recommendations: ${error.message}`);
    }
}

module.exports = {
    startRecommendationCron,
    sendImmediateRecommendations
};
