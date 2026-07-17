import { useState, useEffect } from "react";
import { Dices } from "lucide-react";
import { makeRoomCode } from "../constants.js";

export function JoinScreen({ onJoin, initialRoomCode }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(() => initialRoomCode || makeRoomCode());
  const [touchedCode, setTouchedCode] = useState(!!initialRoomCode);

  useEffect(() => {
    if (initialRoomCode) {
      setCode(initialRoomCode);
      setTouchedCode(true);
    }
  }, [initialRoomCode]);

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onJoin(trimmed, code.trim().toUpperCase() || makeRoomCode());
  };

  return (
    <div className="sp-root sp-join">
      <div className="sp-join-card">
        <div className="sp-brand">
          <span className="sp-brand-suit">♠</span>
          <div>
            <h1>Scrum Poker</h1>
            <p>Estimate together. Fibonacci deck, one table, zero drama.</p>
          </div>
        </div>

        <form onSubmit={submit} className="sp-join-form">
          <label className="sp-field">
            <span>Your name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              maxLength={24}
            />
          </label>

          <label className="sp-field">
            <span>Room code</span>
            <div className="sp-code-row">
              <input
                value={code}
                onChange={(e) => {
                  setTouchedCode(true);
                  setCode(e.target.value.toUpperCase().slice(0, 8));
                }}
                placeholder="CODE"
                className="sp-code-input"
              />
              <button
                type="button"
                className="sp-icon-btn"
                title="Generate a new room"
                onClick={() => {
                  setCode(makeRoomCode());
                  setTouchedCode(false);
                }}
              >
                <Dices size={18} />
              </button>
            </div>
            <span className="sp-field-hint">
              {touchedCode
                ? "You'll join this room if it already exists."
                : "Share this code for others to join you."}
            </span>
          </label>

          <button type="submit" className="sp-primary-btn" disabled={!name.trim()}>
            Join the table
          </button>
        </form>
      </div>
    </div>
  );
}
