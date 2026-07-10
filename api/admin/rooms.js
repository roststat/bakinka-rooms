const { getRooms, getAvailability } = require("../_lib/data");
const { checkAdminSecret } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!checkAdminSecret(req, res)) return;
  try {
    const rooms = await getRooms();
    const { availability } = await getAvailability();
    res.status(200).json({ rooms, blocked: availability.blocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
