# Coolhole.org Chatbot Project

This is a Node.js chatbot designed to integrate with Coolhole.org, a CyTube-based video synchronization and chat platform.

## Project Architecture
- **Backend**: Node.js with Express.js server
- **Real-time Communication**: WebSocket (Socket.IO) and CyTube WebSocket integration  
- **Database**: JSON file-based storage for CoolPoints and transactions
- **Frontend**: Static HTML dashboard with real-time updates

## Key Components
- `server.js`: Main Express server with WebSocket handling
- `src/bot/chatBot.js`: Core bot logic and chat command processing
- `src/coolpoints/coolPointsManager.js`: Virtual currency system with debt mechanics
- `src/cytube/cyTubeClient.js`: CyTube server integration and event handling
- `public/index.html`: Web dashboard for monitoring bot status

## CoolPoints System Features
- **Virtual Currency**: Satirical economy with starting balance and daily bonuses
- **Expenditures**: Highlight (15 CP), Danmu (250 CP), Invasive (10,000 CP)
- **Debt System**: 6-level progressive penalty system affecting chat behavior
- **Transfer System**: Peer-to-peer CoolPoints transactions
- **Admin Controls**: Award, deduct, and reset user balances

## Development Guidelines
- Follow Node.js best practices for async/await and error handling
- Implement rate limiting and input validation for all user commands
- Use event-driven architecture for real-time features
- Maintain satirical tone consistent with Coolhole.org's platform humor
- Ensure WebSocket connections are resilient with reconnection logic
- Store all persistent data in JSON format under `/data` directory

## Testing and Deployment
- Test bot commands locally before connecting to live CyTube channels
- Verify CoolPoints calculations and debt level transitions
- Monitor WebSocket connection stability and error handling
- Ensure environment variables are properly configured for production