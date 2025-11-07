# Slunt Voice Client Protocol

This document describes the network protocol for connecting a remote voice client to the Slunt server.

## Architecture

```
┌─────────────────────┐         WebSocket/HTTP        ┌──────────────────────┐
│  Client Machine     │  ←─────────────────────────→  │  Server Machine      │
│                     │                                │                      │
│  - Microphone       │                                │  - AI Engine         │
│  - Speakers         │                                │  - Voice Manager     │
│  - Speech Recognition│                               │  - Chat Bot          │
│  - Audio Playback   │                                │  - TTS Synthesis     │
│  - Simple UI        │                                │  - Memory/State      │
└─────────────────────┘                                └──────────────────────┘
```

## Connection

- **Protocol**: Socket.IO (WebSocket with fallback)
- **Default Port**: 3000
- **URL Format**: `http://<server-ip>:3000`

## Events

### Client → Server

#### `voice:speech`
Send transcribed user speech to Slunt for processing.

```javascript
socket.emit('voice:speech', {
  text: "hey what's up",
  username: "You"
});
```

**Parameters:**
- `text` (string, required): The transcribed user speech
- `username` (string, optional): Display name for the user, defaults to "You"

---

#### `voice:status`
Request current voice system status.

```javascript
socket.emit('voice:status', (status) => {
  console.log('Voice status:', status);
});
```

**Response:**
```javascript
{
  isReady: true,
  provider: "piper",
  messagesHeard: 42,
  messagesSaid: 41
}
```

---

#### `voice:interrupt`
Stop Slunt's current speech immediately.

```javascript
socket.emit('voice:interrupt');
```

---

#### `clear_memory`
Clear voice conversation memory and exit focus mode.

```javascript
socket.emit('clear_memory');
```

---

### Server → Client

#### `voice:response`
Slunt's response with audio URL for playback.

```javascript
socket.on('voice:response', (data) => {
  // data.text: "oh yeah that's wild"
  // data.audioUrl: "/temp/audio/voice_1234567.mp3"
  // data.timestamp: 1234567890
});
```

**Parameters:**
- `text` (string): The text of Slunt's response
- `audioUrl` (string): Relative URL to fetch audio file
- `timestamp` (number): Unix timestamp of response

**Usage:**
Fetch the audio file from `http://<server-ip>:3000${audioUrl}` and play it.

---

#### `voice:transcript`
Echo of what the user said (for display confirmation).

```javascript
socket.on('voice:transcript', (data) => {
  // data.text: "hey what's up"
});
```

---

#### `voice:error`
Error occurred during processing.

```javascript
socket.on('voice:error', (data) => {
  // data.message: "TTS provider unavailable"
});
```

---

## HTTP Endpoints

### `GET /api/voice/clear-memory`
Alternative HTTP endpoint to clear voice memory.

```bash
curl http://<server-ip>:3000/api/voice/clear-memory
```

**Response:** `200 OK`

---

### `GET /temp/audio/:filename`
Fetch generated audio files.

```bash
curl http://<server-ip>:3000/temp/audio/voice_1234567.mp3 --output audio.mp3
```

---

### `GET /metrics`
Server health and statistics.

```bash
curl http://<server-ip>:3000/metrics
```

**Response:**
```json
{
  "uptime": 3600,
  "memoryUsage": {...},
  "voice": {
    "messagesHeard": 42,
    "messagesSaid": 41
  }
}
```

---

## Example Flow

```
1. Client connects to server via Socket.IO
   → socket.io-client connects to ws://<server-ip>:3000

2. User speaks into microphone
   → Client uses Web Speech API to transcribe

3. Client sends transcribed text
   → socket.emit('voice:speech', { text: "hey" })

4. Server processes with AI
   → Slunt generates response using Ollama/OpenAI
   → Voice Manager synthesizes speech to MP3
   → Saves to /temp/audio/voice_XYZ.mp3

5. Server responds with audio URL
   → socket.emit('voice:response', { text: "yo", audioUrl: "/temp/audio/voice_XYZ.mp3" })

6. Client fetches and plays audio
   → Fetch http://<server-ip>:3000/temp/audio/voice_XYZ.mp3
   → Play through <audio> element or speakers

7. Loop continues...
```

---

## Security Considerations

**Current State (Development):**
- No authentication required
- CORS enabled for all origins
- Anyone on network can connect

**For Production:**
- Add authentication tokens
- Use HTTPS/WSS encryption
- Restrict CORS to specific origins
- Rate limiting per client
- Firewall rules

---

## Configuration

### Server Requirements

**Environment Variables:**
```bash
# Server listening
PORT=3000

# TTS Provider
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# AI Model (for local)
# Ollama must be running with llama3.2 installed

# Optional: OpenAI
OPENAI_API_KEY=sk_...
```

**Firewall:**
```bash
# Allow incoming connections on port 3000
sudo ufw allow 3000/tcp
```

**Server Start:**
```bash
npm start
# Server listens on http://0.0.0.0:3000
```

---

### Client Requirements

**Dependencies:**
- Node.js (for socket.io-client)
- Web browser (for Web Speech API)
- OR native app with audio I/O

**Network:**
- Must reach server IP on port 3000
- Low latency recommended (<50ms for real-time feel)

---

## Troubleshooting

### Client can't connect
- Check firewall on server machine
- Verify server is listening: `netstat -an | grep 3000`
- Test connectivity: `curl http://<server-ip>:3000/metrics`
- Check CORS settings in server.js

### Audio not playing
- Verify audio URL is accessible: `curl http://<server-ip>:3000/temp/audio/voice_XYZ.mp3`
- Check browser console for fetch errors
- Ensure /temp/audio directory exists and is writable

### High latency
- Use local TTS provider (piper) instead of API
- Use local AI (Ollama) instead of OpenAI
- Check network latency: `ping <server-ip>`
- Reduce audio quality to decrease file size

### Voice not responding
- Check server logs for errors
- Verify AI engine is running (Ollama)
- Check TTS provider status: `socket.emit('voice:status', console.log)`
- Review /metrics endpoint for diagnostics
