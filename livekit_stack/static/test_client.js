// test_client.js - LiveKit WebRTC student client logic
const connectBtn = document.getElementById('connect-btn');
const wsUrlInput = document.getElementById('ws-url');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const consoleDiv = document.getElementById('console');
const visualizer = document.getElementById('visualizer');

let room = null;
let visualizerInterval = null;

// Logger helper
function log(msg, type = 'System') {
    const now = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${now}]</span><span class="log-tag">[${type}]</span> ${msg}`;
    consoleDiv.appendChild(entry);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Generate animated audio visualizer bars
const NUM_BARS = 24;
const bars = [];
for (let i = 0; i < NUM_BARS; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    visualizer.appendChild(bar);
    bars.push(bar);
}

function updateVisualizer(active) {
    if (visualizerInterval) {
        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }

    if (!active) {
        bars.forEach(bar => bar.style.height = '10px');
        return;
    }

    visualizerInterval = setInterval(() => {
        bars.forEach(bar => {
            // Simulated mic/speaker active pulse
            const height = 10 + Math.random() * 40;
            bar.style.height = `${height}px`;
        });
    }, 80);
}

// Connect / Disconnect Action Handler
connectBtn.addEventListener('click', async () => {
    if (room && room.state === 'connected') {
        log('Disconnecting from room...');
        await room.disconnect();
        return;
    }

    const wsUrl = wsUrlInput.value.trim();
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const tokenUrl = `http://localhost:8000/token?room=socratic_tutor_room_${randomSuffix}&identity=student_01`;

    log('Requesting WebRTC access token from local display client...', 'HTTP');
    connectBtn.disabled = true;
    statusText.innerText = 'Connecting...';
    statusDot.style.backgroundColor = '#fbbf24';

    try {
        // 1. Fetch connection token from display_client server
        const tokenResp = await fetch(tokenUrl);
        if (!tokenResp.ok) throw new Error(`HTTP error: ${tokenResp.status}`);
        const tokenData = await tokenResp.json();
        const token = tokenData.token;
        log('Token successfully generated and signed by server.', 'Auth');

        // 2. Initialize LiveKit Room
        room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
            publishDefaults: {
                audioPreset: LivekitClient.AudioPresets.speech
            }
        });

        // 3. Setup Room event listeners
        room.on(LivekitClient.RoomEvent.Connected, () => {
            statusText.innerText = 'Connected';
            statusDot.style.backgroundColor = '#10b981';
            statusDot.classList.add('active');
            connectBtn.innerText = 'Disconnect Session';
            connectBtn.classList.add('connected');
            connectBtn.disabled = false;
            log('Established WebRTC session with LiveKit Server.', 'WebRTC');
            updateVisualizer(true);
        });

        room.on(LivekitClient.RoomEvent.Disconnected, () => {
            statusText.innerText = 'Disconnected';
            statusDot.style.backgroundColor = '#ef4444';
            statusDot.classList.remove('active');
            connectBtn.innerText = 'Start Audio Session';
            connectBtn.classList.remove('connected');
            connectBtn.disabled = false;
            log('Disconnected from session.', 'WebRTC');
            updateVisualizer(false);
        });

        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === 'audio') {
                // Attach the tutor's incoming audio track directly to HTML audio output
                const el = track.attach();
                document.body.appendChild(el);
                log(`Subscribed to Socratic Tutor audio stream.`, 'Audio');
            }
        });

        room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, (speakers) => {
            if (speakers.length > 0) {
                const names = speakers.map(s => s.identity).join(', ');
                log(`Active speaker update: ${names}`);
            }
        });

        // 4. Join room and publish local microphone track
        log(`Joining LiveKit room...`, 'Room');
        await room.connect(wsUrl, token);
        
        log(`Publishing local student microphone track...`, 'Mic');
        await room.localParticipant.enableCameraAndMicrophone({ video: false, audio: true });
        log(`Microphone track successfully published. Speak into your mic!`, 'System');

    } catch (err) {
        log(`Connection failed: ${err.message}`, 'ERROR');
        statusText.innerText = 'Disconnected';
        statusDot.style.backgroundColor = '#ef4444';
        connectBtn.innerText = 'Start Audio Session';
        connectBtn.classList.remove('connected');
        connectBtn.disabled = false;
        updateVisualizer(false);
        if (room) {
            await room.disconnect();
        }
    }
});
