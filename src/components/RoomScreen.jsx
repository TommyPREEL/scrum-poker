import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, RefreshCw, LogOut, Pencil, Users, Share2, Link } from "lucide-react";
import { DECK, NUMERIC, STALE_MS } from "../constants.js";
import { Seat } from "./Seat.jsx";
import { HandCard } from "./HandCard.jsx";

export function RoomScreen({
  playerId,
  name,
  roomCode,
  room,
  onRename,
  onVote,
  onReveal,
  onNewRound,
  onLeave,
  onUpdateSharedUrl,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [editingUrl, setEditingUrl] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");

  const players = useMemo(() => {
    return Object.entries(room.players || {})
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => a.joinedAt - b.joinedAt);
  }, [room.players]);

  const activePlayers = players.filter(
    (p) => Date.now() - p.lastSeen <= STALE_MS || p.id === playerId
  );
  const voteCount = activePlayers.filter((p) => p.vote != null).length;
  const self = room.players?.[playerId];

  const stats = useMemo(() => {
    if (!room.revealed) return null;
    const numericVotes = activePlayers
      .map((p) => p.vote)
      .filter((v) => v != null && NUMERIC.has(v))
      .map(Number);
    const votedValues = activePlayers.map((p) => p.vote).filter((v) => v != null);
    const consensus = votedValues.length > 0 && votedValues.every((v) => v === votedValues[0]);
    if (numericVotes.length === 0) return { avg: null, consensus, min: null, max: null };
    const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    return {
      avg: Math.round(avg * 10) / 10,
      consensus,
      min: Math.min(...numericVotes),
      max: Math.max(...numericVotes),
    };
  }, [room.revealed, activePlayers]);

  const seatPositions = useMemo(() => {
    const n = Math.max(activePlayers.length, 1);
    return activePlayers.map((_, i) => {
      const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
      const x = 50 + 43 * Math.cos(angle);
      const y = 50 + 40 * Math.sin(angle);
      return { left: `${x}%`, top: `${y}%` };
    });
  }, [activePlayers.length]);

  const shareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* clipboard unavailable, ignore */
    }
  };

  const saveName = () => {
    const trimmed = draftName.trim();
    setEditingName(false);
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setDraftName(name);
  };

  const saveUrl = () => {
    const trimmed = draftUrl.trim();
    setEditingUrl(false);
    if (trimmed !== (room.sharedUrl || "")) onUpdateSharedUrl(trimmed);
  };

  const startEditingUrl = () => {
    setDraftUrl(room.sharedUrl || "");
    setEditingUrl(true);
  };

  return (
    <div className="sp-root sp-room">
      <header className="sp-header">
        <div className="sp-header-left">
          <span className="sp-brand-suit sp-brand-suit--sm">♠</span>
          <div>
            <div className="sp-room-code-row">
              <span className="sp-room-code">{roomCode}</span>
              <button 
                className={`sp-icon-btn sp-icon-btn--ghost${linkCopied ? ' sp-icon-btn--success' : ''}`}
                onClick={shareLink} 
                title={linkCopied ? "Link copied!" : "Share link"}
              >
                {linkCopied ? <Check size={15} /> : <Share2 size={15} />}
              </button>
            </div>
            <div className="sp-header-sub">
              <Users size={13} />
              {voteCount}/{activePlayers.length} voted
            </div>
          </div>
        </div>

        <div className="sp-header-right">
          {editingName ? (
            <input
              autoFocus
              className="sp-name-edit"
              value={draftName}
              maxLength={24}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setDraftName(name);
                  setEditingName(false);
                }
              }}
            />
          ) : (
            <button className="sp-name-btn" onClick={() => setEditingName(true)}>
              {name} <Pencil size={13} />
            </button>
          )}
          <button className="sp-icon-btn sp-icon-btn--ghost" onClick={onLeave} title="Leave room">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {(room.sharedUrl || editingUrl) && (
        <div className="sp-shared-url">
          <Link size={14} />
          {editingUrl ? (
            <input
              autoFocus
              className="sp-shared-url-input"
              value={draftUrl}
              placeholder="https://example.com/story-123"
              onChange={(e) => setDraftUrl(e.target.value)}
              onBlur={saveUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveUrl();
                if (e.key === "Escape") {
                  setDraftUrl(room.sharedUrl || "");
                  setEditingUrl(false);
                }
              }}
            />
          ) : (
            <>
              <a 
                href={room.sharedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sp-shared-url-link"
                title="Open link in new tab"
              >
                {room.sharedUrl}
              </a>
              <button 
                className="sp-icon-btn sp-icon-btn--ghost" 
                onClick={startEditingUrl}
                title="Edit URL"
              >
                <Pencil size={14} />
              </button>
            </>
          )}
        </div>
      )}

      {!room.sharedUrl && !editingUrl && (
        <div className="sp-shared-url sp-shared-url--empty">
          <button className="sp-shared-url-add" onClick={startEditingUrl}>
            <Link size={14} />
            Share a link with everyone
          </button>
        </div>
      )}

      <main className="sp-table-wrap">
        <div className="sp-table">
          <div className="sp-table-felt">
            {room.revealed && stats && (
              <div className="sp-stats">
                {stats.avg != null ? (
                  <>
                    <div className="sp-stats-avg">{stats.avg}</div>
                    <div className="sp-stats-label">average</div>
                    {stats.consensus && <div className="sp-stats-consensus">Consensus!</div>}
                    {!stats.consensus && (
                      <div className="sp-stats-range">
                        {stats.min} – {stats.max}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="sp-stats-label">no numeric votes</div>
                )}
              </div>
            )}
            {!room.revealed && (
              <div className="sp-stats sp-stats--waiting">
                <div className="sp-waiting-dot" />
                <div className="sp-stats-label">
                  {voteCount === activePlayers.length && activePlayers.length > 0
                    ? "everyone voted — reveal when ready"
                    : "waiting for votes"}
                </div>
              </div>
            )}
          </div>

          {activePlayers.map((p, i) => (
            <Seat
              key={p.id}
              player={p}
              isSelf={p.id === playerId}
              revealed={room.revealed}
              style={seatPositions[i]}
            />
          ))}
        </div>
      </main>

      <footer className="sp-footer">
        <div className="sp-controls">
          <button className="sp-primary-btn sp-primary-btn--wide" onClick={onReveal}>
            {room.revealed ? <EyeOff size={16} /> : <Eye size={16} />}
            {room.revealed ? "Hide cards" : "Reveal cards"}
          </button>
          <button className="sp-secondary-btn" onClick={onNewRound}>
            <RefreshCw size={15} />
            New round
          </button>
        </div>

        <div className="sp-hand">
          {DECK.map((v) => (
            <HandCard key={v} value={v} selected={self?.vote === v} onSelect={onVote} />
          ))}
        </div>
      </footer>
    </div>
  );
}
