const { setRoomBlocked } = require("../_lib/data");
const { checkAdminSecret } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!checkAdminSecret(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { roomId, date, blocked } = req.body || {};
    if (!roomId || !date || typeof blocked !== "boolean") {
      res.status(400).json({ error: "roomId, date, blocked are required" });
      return;
    }
    const availability = await setRoomBlocked(roomId, date, blocked);
    res.status(200).json({ ok: true, blocked: availability.blocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
