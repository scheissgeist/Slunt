# 🕳️ Coolhole.org Chatbot

A sophisticated Node.js chatbot designed to integrate with Coolhole.org's CyTube-based platform, featuring the satirical CoolPoints virtual currency system with CUM (Cryptographic Ultra-Modulation) technology.

## 🚀 Features

### Core Functionality
- **Real-time CyTube Integration**: Connects to CyTube servers for synchronized video watching and chat
- **WebSocket API**: Provides real-time communication for external integrations
- **RESTful API**: HTTP endpoints for CoolPoints management and bot status
- **Web Dashboard**: Built-in web interface for monitoring and management

### CoolPoints System
- **Virtual Currency**: Satirical economic system as per Coolhole.org specifications
- **Debt Levels**: Progressive penalty system with chat effects (0-5 levels)
- **Expenditures**: Special chat features with costs:
  - Highlight Messages (15 CP)
  - "Sister"ing Content (20 CP)  
  - Danmu/Bullet Comments (250 CP)
  - Invasive Messages (10,000 CP)

### Chat Commands
- Balance checking (`!balance`, `!cp`)
- Daily bonus claiming (`!daily`)
- Point transfers (`!give`)
- Leaderboards (`!leaderboard`)
- Statistics (`!stats`)
- Debt status (`!debt`)
- Special effects (`!highlight`, `!danmu`, `!invasive`)

## 📋 Prerequisites

Before running this chatbot, ensure you have:

1. **Node.js** (v16.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

## 🛠️ Installation

1. **Clone or download** this project to your local machine

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Edit `.env` with your settings:
   ```env
   CYTUBE_SERVER=wss://cytu.be/socketio/
   CYTUBE_CHANNEL=coolhole
   CYTUBE_USERNAME=YourBotName
   CYTUBE_PASSWORD=YourBotPassword
   BOT_ADMIN_USERS=admin1,admin2
   ```

## 🚀 Running the Bot

### Option 1: Using VS Code Tasks
1. Open the project in VS Code
2. Press `Ctrl+Shift+P` and type "Tasks: Run Task"
3. Select "Start Coolhole Chatbot"

### Option 2: Command Line
```bash
# Production mode
npm start

# Development mode (auto-restart on changes)
npm run dev

# Run tests
npm test
```

### Option 3: Manual Launch
```bash
node server.js
```

## 🌐 Accessing the Bot

Once running, you can access:

- **Web Dashboard**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/api/health`
- **CoolPoints API**: `http://localhost:3000/api/coolpoints/{username}`

## 🎮 Chat Commands

### User Commands
| Command | Description | Example |
|---------|-------------|---------|
| `!balance` or `!cp` | Check CoolPoints balance | `!balance` or `!cp username` |
| `!daily` | Claim daily bonus | `!daily` |
| `!give <user> <amount>` | Transfer points | `!give alice 100` |
| `!spend <type>` | Spend on features | `!spend highlight` |
| `!leaderboard` or `!lb` | Show top users | `!lb 10` |
| `!stats` | Show user statistics | `!stats` |
| `!debt` | Check debt status | `!debt` |
| `!help` | Show command help | `!help` |

### Special Effect Commands
| Command | Cost | Description |
|---------|------|-------------|
| `!highlight <message>` | 15 CP | Send highlighted chat message |
| `!danmu <message>` | 250 CP | Send bullet-style overlay comment |
| `!invasive <message>` | 10,000 CP | Send disruptive message with effects |

### Admin Commands (Requires Admin Status)
| Command | Description |
|---------|-------------|
| `!award <user> <amount>` | Award CoolPoints |
| `!deduct <user> <amount>` | Deduct CoolPoints |
| `!reset <user>` | Reset user balance |

## 🏗️ Project Structure

```
├── .env.example          # Environment configuration template
├── .github/
│   └── copilot-instructions.md  # AI assistant instructions
├── .vscode/
│   └── tasks.json        # VS Code task definitions
├── data/                 # Persistent data storage
├── public/
│   └── index.html        # Web dashboard
├── src/
│   ├── bot/
│   │   └── chatBot.js    # Main bot logic and commands
│   ├── coolpoints/
│   │   └── coolPointsManager.js  # CoolPoints system
│   └── cytube/
│       └── cyTubeClient.js       # CyTube integration
├── package.json          # Dependencies and scripts
└── server.js            # Express server and WebSocket handling
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `CYTUBE_SERVER`: CyTube server WebSocket URL
- `CYTUBE_CHANNEL`: Target channel name
- `CYTUBE_USERNAME`: Bot username
- `CYTUBE_PASSWORD`: Bot password
- `BOT_PREFIX`: Command prefix (default: !)
- `BOT_ADMIN_USERS`: Comma-separated admin usernames
- `COOLPOINTS_STARTING_BALANCE`: New user starting balance
- `COOLPOINTS_DAILY_BONUS`: Daily bonus amount

### CoolPoints Debt System
The bot implements a progressive debt penalty system:

| Level | Balance Range | Effect |
|-------|---------------|--------|
| 0 | 0 to -499 CP | Speech repetition (extra proof-of-work) |
| 1 | -500 to -999 CP | Speech degradation (vowels replaced) |
| 2 | -1000 to -1999 CP | Content insertion (ads in messages) |
| 3 | -2000 to -3499 CP | Text shrinking (50% message length) |
| 4 | -3500 to -4999 CP | Bandwidth reduction (25% message length) |
| 5 | -5000+ CP | Criticality Event (messages blocked) |

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```
Returns bot status and operational state.

### CoolPoints Balance
```
GET /api/coolpoints/{username}
```
Returns user's CoolPoints balance.

### CoolPoints Transaction
```
POST /api/coolpoints/{username}/transaction
Content-Type: application/json

{
  "amount": 100,
  "reason": "Manual adjustment"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"npm is not recognized"**
   - Install Node.js from [nodejs.org](https://nodejs.org/)
   - Restart your terminal/VS Code after installation

2. **CyTube connection fails**
   - Check your `CYTUBE_SERVER` URL in `.env`
   - Verify network connectivity
   - Ensure the CyTube server supports WebSocket connections

3. **Commands not working**
   - Check the bot is connected (web dashboard at `http://localhost:3000`)
   - Verify the command prefix in `.env` (default: `!`)
   - Check if user has sufficient CoolPoints for expenditures

4. **Permission denied errors**
   - Verify admin usernames in `BOT_ADMIN_USERS` environment variable
   - Check username spelling and case sensitivity

## 📝 Development

### Adding New Commands
1. Add command function to `ChatBot` class in `src/bot/chatBot.js`
2. Register command in the constructor's command Map
3. Update help text and documentation

### Extending CoolPoints Features
- Modify `CoolPointsManager` in `src/coolpoints/coolPointsManager.js`
- Add new expenditure types or modify costs in the constructor
- Update debt level effects in `applyDebtEffects()` method

### CyTube Integration
- Extend `CyTubeClient` in `src/cytube/cyTubeClient.js`
- Add new message handlers in `handleMessage()` method
- Implement additional CyTube API features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🎭 About Coolhole.org

This bot is designed specifically for Coolhole.org's satirical take on digital economics and synchronized media consumption. The CoolPoints system implements the platform's humorous "Socialized Purview Evidence Review Manifest" with CUM (Cryptographic Ultra-Modulation) technology.

For more information about Coolhole.org's features and philosophy, visit [coolhole.org](https://coolhole.org).

---

**Note**: This chatbot is a community project and is not officially affiliated with Coolhole.org. Please respect the platform's terms of service and community guidelines when using this bot.