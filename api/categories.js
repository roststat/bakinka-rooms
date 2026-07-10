const { getRooms } = require("./_lib/data");

const LABELS = {
  single: "Одноместные",
  double: "Двухместные",
  triple: "Трёхместные",
  bungalow: "Бунгало",
  apartment: "Апартаменты",
};

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const rooms = await getRooms();
    const byCategory = {};
    for (const room of rooms) {
      const c = (byCategory[room.category] ||= {
        category: room.category,
        title: LABELS[room.category] || room.category,
        minPrice: Infinity,
        count: 0,
        image: room.image,
      });
      c.count += 1;
      c.minPrice = Math.min(c.minPrice, room.price);
    }
    res.status(200).json({ categories: Object.values(byCategory) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
