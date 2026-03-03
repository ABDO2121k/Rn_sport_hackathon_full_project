# Sports Stats API Backend

A RESTful API for managing sports player statistics, match data, talent scouting, and automated email notifications with **OpenAI Function Calling** integration.

## Features

- 📊 **Player Stats Management** - View player statistics by position, team, or individual
- ⚽ **Match Data** - Track matches with YOLOv12 detection data
- 🔍 **Talent Scout System** - Save search preferences and find matching players
- 📧 **Email Notifications** - Automated emails for scouts and players
- 🤖 **OpenAI Function Calling** - Natural language processing for smart email handling
- 🎯 **Smart Matching** - AI-powered player matching based on requirements

## Installation

```bash
npm install
```

## Configuration

### OpenAI API Setup (Required for AI features)

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

### Gmail SMTP Configuration

To enable email functionality, you need to set up Gmail App Password:

#### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", select "2-Step Verification"
3. Follow the steps to enable it

#### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)** - name it "Sports API"
4. Click **Generate**
5. Copy the 16-character password (remove spaces)

#### Step 3: Configure Environment

Edit `.env` and add your Gmail credentials:

```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

## Running the Server

```bash
# Development mode
npm start

# Or directly with node
node server.js
```

The server will start on `http://localhost:3000`

## API Endpoints

### Player Endpoints

- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `GET /api/players/position/:position` - Get players by position
- `GET /api/players/team/:team` - Get players by team

### Match Endpoints

- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get match by ID
- `GET /api/matches/upcoming` - Get upcoming matches
- `GET /api/matches/completed` - Get completed matches
- `GET /api/matches/:id/detections` - Get YOLOv12 detection data

### Standings

- `GET /api/standings` - Get league standings

### Statistics

- `GET /api/stats/top-scorers?limit=10` - Get top scorers
- `GET /api/stats/top-assists?limit=10` - Get top assisters

### Talent Scout Endpoints

- `GET /api/scouts` - Get all scouts
- `GET /api/scouts/searches` - Get all saved searches
- `GET /api/scouts/:scoutId/searches` - Get searches by scout
- `POST /api/scouts/search` - Create new search preference
- `POST /api/scouts/match-players` - Match players based on requirements
- `GET /api/scouts/searches/:searchId/matches` - Get matches for saved search

### Email Endpoints

- `GET /api/email/test-config` - Test email configuration
- `POST /api/email/send-to-recruiter` - Send match results to recruiter
- `POST /api/email/send-to-player` - Notify player of scout interest
- `POST /api/email/notify-search-results` - Send search results to scout

### 🤖 OpenAI Function Calling Endpoints

- `POST /api/ai/process-request` - Process natural language requests (finds players, sends emails)
- `POST /api/ai/chat` - Conversational AI assistant for multi-turn interactions
- `POST /api/ai/find-players` - AI-powered player search with natural language
- `POST /api/ai/send-email` - Smart email routing (auto-detects recipient type)

## OpenAI Function Calling Examples

### Natural Language Email Processing

Send emails using plain English:

```bash
curl -X POST http://localhost:3000/api/ai/process-request \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find young forwards under 25 with at least 15 goals and email the results to scout@example.com"
  }'
```

### AI Player Search

```bash
curl -X POST http://localhost:3000/api/ai/find-players \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need a tall defender with excellent tackling and clearance stats"
  }'
```

### Conversational AI

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Help me find a good midfielder" }
    ]
  }'
```

📖 **See [OPENAI_EXAMPLES.md](OPENAI_EXAMPLES.md) for complete usage examples and real-world scenarios.**

- `POST /api/email/send-to-recruiter` - Send match results to recruiter
- `POST /api/email/send-to-player` - Notify player of scout interest
- `POST /api/email/notify-search-results` - Send search results to scout

## Email API Examples

### Test Email Configuration

```bash
curl http://localhost:3000/api/email/test-config
```

### Send Email to Recruiter

```bash
curl -X POST http://localhost:3000/api/email/send-to-recruiter \
  -H "Content-Type: application/json" \
  -d '{
    "email": "scout@example.com",
    "scoutName": "John Doe",
    "searchDescription": "Looking for young forwards with good stats",
    "playerIds": [1, 5, 9]
  }'
```

### Notify Player of Scout Interest

```bash
curl -X POST http://localhost:3000/api/email/send-to-player \
  -H "Content-Type: application/json" \
  -d '{
    "playerEmail": "player@example.com",
    "playerName": "Marcus Johnson",
    "scoutName": "John Anderson",
    "scoutEmail": "john@scouts.com",
    "scoutOrganization": "Elite Talent Agency",
    "message": "Impressed by your performance this season!"
  }'
```

### Send Search Results Email

```bash
curl -X POST http://localhost:3000/api/email/notify-search-results \
  -H "Content-Type: application/json" \
  -d '{
    "searchId": 1,
    "scoutEmail": "scout@example.com"
  }'
```

## Scout Search Example

### Create a Search

```bash
curl -X POST http://localhost:3000/api/scouts/search \
  -H "Content-Type: application/json" \
  -d '{
    "scoutId": 1,
    "scoutName": "John Anderson",
    "description": "Looking for young strikers with high goal-scoring ability",
    "requirements": {
      "position": "Forward",
      "maxAge": 25,
      "minGoals": 15,
      "minAssists": 8
    }
  }'
```

### Match Players

```bash
curl -X POST http://localhost:3000/api/scouts/match-players \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": {
      "position": "Midfielder",
      "minPassAccuracy": 85,
      "minTackles": 40
    }
  }'
```

## Data Files

- `data/players.json` - Player information and statistics
- `data/matches.json` - Match data with YOLOv12 detections
- `data/scouts.json` - Talent scout searches and preferences

## Utilities

- `utils/dataHandler.js` - CRUD operations for JSON data
- `utils/emailHandler.js` - Email sending with Gmail SMTP
- `templates/recruiterEmail.js` - HTML email template for recruiters
- `templates/playerEmail.js` - HTML email template for players

## Security Notes

- Never commit `.env` file to version control
- Use environment variables for sensitive data
- Gmail App Passwords are more secure than using your main password
- Keep your API credentials private

## License

ISC
