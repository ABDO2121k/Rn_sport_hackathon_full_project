const OpenAI = require('openai');
const { sendRecruiterEmail, sendPlayerEmail } = require('./emailHandler');
const { readData } = require('./dataHandler');

/**
 * OpenAI Function Calling Handler
 * Uses OpenAI to intelligently process email requests
 */

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
});

// Function definitions for OpenAI
const functions = [
    {
        name: 'send_email_to_recruiter',
        description: 'Send an email to a talent scout/recruiter with matched player profiles. Use this when someone wants to notify a recruiter about players that match their criteria.',
        parameters: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    description: 'The recruiter/scout email address'
                },
                scoutName: {
                    type: 'string',
                    description: 'The name of the scout/recruiter'
                },
                searchDescription: {
                    type: 'string',
                    description: 'Description of what the scout is looking for'
                },
                playerIds: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Array of player IDs that match the criteria'
                }
            },
            required: ['email', 'scoutName', 'searchDescription', 'playerIds']
        }
    },
    {
        name: 'send_email_to_player',
        description: 'Send an email to a player notifying them that a talent scout is interested in them. Use this when a scout wants to contact a player.',
        parameters: {
            type: 'object',
            properties: {
                playerEmail: {
                    type: 'string',
                    description: 'The player\'s email address'
                },
                playerName: {
                    type: 'string',
                    description: 'The player\'s full name'
                },
                scoutName: {
                    type: 'string',
                    description: 'The name of the talent scout'
                },
                scoutEmail: {
                    type: 'string',
                    description: 'The scout\'s contact email'
                },
                scoutOrganization: {
                    type: 'string',
                    description: 'The scout\'s organization or company'
                },
                message: {
                    type: 'string',
                    description: 'Optional personal message from the scout to the player'
                }
            },
            required: ['playerEmail', 'playerName', 'scoutName', 'scoutEmail', 'scoutOrganization']
        }
    },
    {
        name: 'find_matching_players',
        description: 'Find players that match specific criteria/requirements. Use this when someone describes what kind of player they are looking for.',
        parameters: {
            type: 'object',
            properties: {
                position: {
                    type: 'string',
                    description: 'Player position (Forward, Midfielder, Defender, Goalkeeper)',
                    enum: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper']
                },
                minAge: {
                    type: 'number',
                    description: 'Minimum age requirement'
                },
                maxAge: {
                    type: 'number',
                    description: 'Maximum age requirement'
                },
                minGoals: {
                    type: 'number',
                    description: 'Minimum number of goals scored'
                },
                minAssists: {
                    type: 'number',
                    description: 'Minimum number of assists'
                },
                minPassAccuracy: {
                    type: 'number',
                    description: 'Minimum pass accuracy percentage'
                },
                minTackles: {
                    type: 'number',
                    description: 'Minimum number of tackles'
                },
                minHeight: {
                    type: 'number',
                    description: 'Minimum height in centimeters'
                }
            },
            required: []
        }
    }
];

/**
 * Execute function based on OpenAI function call
 */
async function executeFunctionCall(functionCall, playersData) {
    const functionName = functionCall.name;
    const args = JSON.parse(functionCall.arguments);

    try {
        switch (functionName) {
            case 'send_email_to_recruiter':
                const recruitPlayers = playersData.players.filter(p => args.playerIds.includes(p.id));
                const recruiterResult = await sendRecruiterEmail({
                    to: args.email,
                    scoutName: args.scoutName,
                    searchDescription: args.searchDescription,
                    players: recruitPlayers
                });
                return {
                    success: true,
                    function: 'send_email_to_recruiter',
                    result: recruiterResult,
                    message: `Email sent to ${args.email} with ${recruitPlayers.length} player(s)`
                };

            case 'send_email_to_player':
                const playerResult = await sendPlayerEmail({
                    to: args.playerEmail,
                    playerName: args.playerName,
                    scoutName: args.scoutName,
                    scoutEmail: args.scoutEmail,
                    scoutOrganization: args.scoutOrganization,
                    message: args.message || ''
                });
                return {
                    success: true,
                    function: 'send_email_to_player',
                    result: playerResult,
                    message: `Email sent to player ${args.playerName} at ${args.playerEmail}`
                };

            case 'find_matching_players':
                let matched = playersData.players;

                if (args.position) {
                    matched = matched.filter(p => p.position.toLowerCase() === args.position.toLowerCase());
                }
                if (args.minAge) matched = matched.filter(p => p.physical.age >= args.minAge);
                if (args.maxAge) matched = matched.filter(p => p.physical.age <= args.maxAge);
                if (args.minGoals) matched = matched.filter(p => p.stats.goals >= args.minGoals);
                if (args.minAssists) matched = matched.filter(p => p.stats.assists >= args.minAssists);
                if (args.minPassAccuracy) matched = matched.filter(p => p.stats.passAccuracy >= args.minPassAccuracy);
                if (args.minTackles) matched = matched.filter(p => p.stats.tackles >= args.minTackles);
                if (args.minHeight) matched = matched.filter(p => p.physical.height >= args.minHeight);

                return {
                    success: true,
                    function: 'find_matching_players',
                    result: {
                        count: matched.length,
                        players: matched,
                        criteria: args
                    },
                    message: `Found ${matched.length} player(s) matching the criteria`
                };

            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
    } catch (error) {
        console.error(`Error executing function ${functionName}:`, error.message);
        throw error;
    }
}

/**
 * Process a natural language request using OpenAI function calling
 */
async function processEmailRequest(userMessage, playersData) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in .env file');
        }

        console.log('🤖 Processing request with OpenAI...');

        const systemMessage = `You are an AI assistant for a sports talent scouting platform. 
You help talent scouts find players and send emails to both scouts and players.

Available player data includes:
- Player stats (goals, assists, pass accuracy, tackles, etc.)
- Physical attributes (age, height, weight)
- Position and team information

When users ask to:
1. Find players - use find_matching_players function
2. Email scouts/recruiters - use send_email_to_recruiter function
3. Contact players - use send_email_to_player function

Be helpful and extract all relevant information from the user's request.`;

        const messages = [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
        ];

        // First API call - let OpenAI decide which function to use
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            functions: functions,
            function_call: 'auto'
        });

        const responseMessage = response.choices[0].message;

        // Check if OpenAI wants to call a function
        if (responseMessage.function_call) {
            console.log(`📞 OpenAI calling function: ${responseMessage.function_call.name}`);

            // Execute the function
            const functionResult = await executeFunctionCall(responseMessage.function_call, playersData);

            // Send function result back to OpenAI for a natural response
            messages.push(responseMessage);
            messages.push({
                role: 'function',
                name: responseMessage.function_call.name,
                content: JSON.stringify(functionResult)
            });

            const secondResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages
            });

            return {
                success: true,
                aiResponse: secondResponse.choices[0].message.content,
                functionCalled: responseMessage.function_call.name,
                functionResult: functionResult
            };
        } else {
            // No function call needed, just return the AI's response
            return {
                success: true,
                aiResponse: responseMessage.content,
                functionCalled: null,
                functionResult: null
            };
        }
    } catch (error) {
        console.error('❌ OpenAI processing error:', error.message);
        throw new Error(`OpenAI processing failed: ${error.message}`);
    }
}

/**
 * Chat with OpenAI about players and email operations
 */
async function chatWithAI(messages, playersData) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in .env file');
        }

        const systemMessage = {
            role: 'system',
            content: `You are an AI assistant for a sports talent scouting platform. 
You help talent scouts find players and send emails. Be conversational and helpful.

You have access to player data and can:
1. Search for players matching criteria
2. Send emails to recruiters with player lists
3. Notify players about scout interest

Extract information naturally from conversation.`
        };

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [systemMessage, ...messages],
            functions: functions,
            function_call: 'auto'
        });

        const responseMessage = response.choices[0].message;

        if (responseMessage.function_call) {
            const functionResult = await executeFunctionCall(responseMessage.function_call, playersData);
            return {
                role: 'assistant',
                content: responseMessage.content,
                function_call: responseMessage.function_call,
                function_result: functionResult
            };
        }

        return {
            role: 'assistant',
            content: responseMessage.content
        };
    } catch (error) {
        console.error('❌ Chat error:', error.message);
        throw error;
    }
}

module.exports = {
    processEmailRequest,
    chatWithAI,
    executeFunctionCall,
    functions
};
