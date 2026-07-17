import { STALE_MS } from "../constants.js";

export function Seat({ player, isSelf, revealed, style }) {
  const hasVoted = player.vote != null;
  const stale = Date.now() - player.lastSeen > STALE_MS;

  return (
    <div className={`sp-seat${stale ? " sp-seat--stale" : ""}`} style={style}>
      <div
        className={`sp-card${revealed ? " sp-card--revealed" : ""}${
          hasVoted ? " sp-card--filled" : ""
        }`}
      >
        <div className="sp-card-inner">
          <div className="sp-card-face sp-card-back">
            <div className="sp-card-back-pattern" />
          </div>
          <div className="sp-card-face sp-card-front">
            <span>{revealed ? player.vote : ""}</span>
          </div>
        </div>
      </div>
      <div className="sp-seat-name">
        {player.name || "No name"}
        {isSelf && <span className="sp-seat-you">you</span>}
      </div>
    </div>
  );
}
