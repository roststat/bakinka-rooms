const { getRooms, getAvailability, isRoomAvailable } = require("./_lib/data");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const { checkin, checkout, guests, kids, category, options } = req.query;
    const guestsN = guests ? parseInt(guests, 10) : 0;
    const kidsN = kids ? parseInt(kids, 10) : 0;
    const wantedOptions = options
      ? String(options).split(",").filter(Boolean)
      : [];

    const rooms = await getRooms();
    const { availability } = await getAvailability();

    const result = rooms.filter((room) => {
      if (category && room.category !== category) return false;
      if (guestsN + kidsN > room.capacity) return false;
      if (kidsN > 0 && kidsN > room.maxKids) return false;
      if (wantedOptions.some((o) => !room.options.includes(o))) return false;
      if (!isRoomAvailable(room.id, availability.blocked, checkin, checkout))
        return false;
      return true;
    });

    res.status(200).json({ rooms: result, checkin: checkin || null, checkout: checkout || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
