import { useCallback, useRef, useState } from "react";
import { JoinScreen } from "./components/JoinScreen.jsx";
import { RoomScreen } from "./components/RoomScreen.jsx";
import { useInterval } from "./hooks/useInterval.js";
import { emptyRoom, updateRoom, loadRoom } from "./lib/roomStore.js";
import { makeId, POLL_MS, HEARTBEAT_MS } from "./constants.js";

export default function App() {
  const playerIdRef = useRef(makeId());
  const roomCodeRef = useRef("");

  const [screen, setScreen] = useState("join");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(emptyRoom());

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
  }, []);

  const handleLeave = useCallback(async () => {
    const code = roomCodeRef.current;
    await updateRoom(code, (r) => {
      const players = { ...r.players };
      delete players[playerIdRef.current];
      return { ...r, players };
    });
    roomCodeRef.current = "";
    setRoomCode("");
    setRoom(emptyRoom());
    setScreen("join");
  }, []);

  return (
    <div className="sp-app">
      {screen === "join" ? (
        <JoinScreen onJoin={handleJoin} />
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
