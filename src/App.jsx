import { useCallback, useEffect, useRef, useState } from "react";
import { JoinScreen } from "./components/JoinScreen.jsx";
import { RoomScreen } from "./components/RoomScreen.jsx";
import { useInterval } from "./hooks/useInterval.js";
import { emptyRoom, updateRoom, loadRoom } from "./lib/roomStore.js";
import { makeId, POLL_MS, HEARTBEAT_MS } from "./constants.js";

const SESSION_KEY = "scrum-poker-session";

function saveSession(playerId, name, roomCode) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId, name, roomCode, timestamp: Date.now() }));
  } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Session expires after 24 hours
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export default function App() {
  const playerIdRef = useRef(makeId());
  const roomCodeRef = useRef("");
  const hasAttemptedReconnect = useRef(false);
  const [urlRoomCode, setUrlRoomCode] = useState(null);

  const [screen, setScreen] = useState("join");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(emptyRoom());
  const [reconnecting, setReconnecting] = useState(false);

  // Synchronize local state with shared storage.
  const refreshRoom = useCallback(async () => {
    if (!roomCodeRef.current) return;
    const data = await loadRoom(roomCodeRef.current);
    if (data) setRoom(data);
  }, []);
  useInterval(refreshRoom, screen === "room" ? POLL_MS : null);

  // Regularly signal that this player is still at the table.
  useInterval(() => {
    if (screen !== "room" || !roomCodeRef.current) return;
    updateRoom(roomCodeRef.current, (r) => {
      const players = { ...r.players };
      if (players[playerIdRef.current]) {
        players[playerIdRef.current] = { ...players[playerIdRef.current], lastSeen: Date.now() };
      }
      return { ...r, players };
    }).then(setRoom);
  }, screen === "room" ? HEARTBEAT_MS : null);

  const handleJoin = useCallback(async (playerName, code) => {
    roomCodeRef.current = code;
    setRoomCode(code);
    setName(playerName);
    const next = await updateRoom(code, (r) => {
      const players = { ...r.players };
      players[playerIdRef.current] = {
        name: playerName,
        vote: null,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
      };
      return { ...r, players };
    });
    setRoom(next);
    setScreen("room");
    saveSession(playerIdRef.current, playerName, code);
  }, []);

  const handleVote = useCallback(async (value) => {
    const code = roomCodeRef.current;
    // Optimistic update for instant feedback on click.
    setRoom((r) => {
      const players = { ...r.players };
      if (players[playerIdRef.current]) {
        players[playerIdRef.current] = { ...players[playerIdRef.current], vote: value };
      }
      return { ...r, players };
    });
    const next = await updateRoom(code, (r) => {
      const players = { ...r.players };
      if (players[playerIdRef.current]) {
        players[playerIdRef.current] = {
          ...players[playerIdRef.current],
          vote: value,
          lastSeen: Date.now(),
        };
      }
      return { ...r, players };
    });
    setRoom(next);
  }, []);

  const handleReveal = useCallback(async () => {
    const code = roomCodeRef.current;
    setRoom((r) => ({ ...r, revealed: !r.revealed }));
    const next = await updateRoom(code, (r) => ({ ...r, revealed: !r.revealed }));
    setRoom(next);
  }, []);

  const handleNewRound = useCallback(async () => {
    const code = roomCodeRef.current;
    const clear = (r) => {
      const players = {};
      Object.entries(r.players).forEach(([id, p]) => {
        players[id] = { ...p, vote: null };
      });
      return { ...r, players, revealed: false };
    };
    setRoom((r) => clear(r));
    const next = await updateRoom(code, clear);
    setRoom(next);
  }, []);

  const handleRename = useCallback(async (newName) => {
    setName(newName);
    const code = roomCodeRef.current;
    const next = await updateRoom(code, (r) => {
      const players = { ...r.players };
      if (players[playerIdRef.current]) {
        players[playerIdRef.current] = {
          ...players[playerIdRef.current],
          name: newName,
          lastSeen: Date.now(),
        };
      }
      return { ...r, players };
    });
    setRoom(next);
    saveSession(playerIdRef.current, newName, code);
  }, []);

  // Auto-reconnect on mount if session exists
  useEffect(() => {
    if (hasAttemptedReconnect.current) return;
    hasAttemptedReconnect.current = true;

    // Check for room code in URL
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setUrlRoomCode(roomFromUrl.toUpperCase());
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }

    const session = loadSession();
    if (!session) return;

    setReconnecting(true);
    playerIdRef.current = session.playerId;

    loadRoom(session.roomCode).then((roomData) => {
      if (roomData && roomData.players && roomData.players[session.playerId]) {
        // Room still exists and player is still in it, reconnect
        roomCodeRef.current = session.roomCode;
        setRoomCode(session.roomCode);
        setName(session.name);
        setRoom(roomData);
        setScreen("room");
        // Update last seen to signal we're back
        updateRoom(session.roomCode, (r) => {
          const players = { ...r.players };
          if (players[session.playerId]) {
            players[session.playerId] = { ...players[session.playerId], lastSeen: Date.now() };
          }
          return { ...r, players };
        }).then(setRoom);
      } else {
        // Room doesn't exist or player was removed, clear session
        clearSession();
      }
      setReconnecting(false);
    }).catch(() => {
      clearSession();
      setReconnecting(false);
    });
  }, []);

  const handleLeave = useCallback(async () => {
    const code = roomCodeRef.current;
    await updateRoom(code, (r) => {
      const players = { ...r.players };
      delete players[playerIdRef.current];
      return { ...r, players };
    });
    clearSession();
    roomCodeRef.current = "";
    setRoomCode("");
    setRoom(emptyRoom());
    setScreen("join");
  }, []);

  return (
    <div className="sp-app">
      {reconnecting ? (
        <div className="sp-root sp-join">
          <div className="sp-join-card">
            <div className="sp-brand">
              <span className="sp-brand-suit">♠</span>
              <div>
                <h1>Scrum Poker</h1>
                <p>Reconnecting...</p>
              </div>
            </div>
          </div>
        </div>
      ) : screen === "join" ? (
        <JoinScreen onJoin={handleJoin} initialRoomCode={urlRoomCode} />
      ) : (
        <RoomScreen
          playerId={playerIdRef.current}
          name={name}
          roomCode={roomCode}
          room={room}
          onRename={handleRename}
          onVote={handleVote}
          onReveal={handleReveal}
          onNewRound={handleNewRound}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
