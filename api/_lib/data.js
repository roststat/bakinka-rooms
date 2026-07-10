const GITHUB_API = "https://api.github.com";

function repoInfo() {
  const repo = process.env.GITHUB_REPO; // "owner/name"
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    throw new Error("GITHUB_REPO / GITHUB_TOKEN env vars are not set");
  }
  return { repo, branch, token };
}

async function ghFetch(path, options = {}) {
  const { token } = repoInfo();
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function getFile(filePath) {
  const { repo, branch } = repoInfo();
  const json = await ghFetch(
    `/repos/${repo}/contents/${filePath}?ref=${branch}&t=${Date.now()}`,
    { cache: "no-store" }
  );
  const content = JSON.parse(Buffer.from(json.content, "base64").toString("utf8"));
  return { content, sha: json.sha };
}

async function putFile(filePath, content, sha, message) {
  const { repo, branch } = repoInfo();
  const body = {
    message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
    sha,
    branch,
  };
  return ghFetch(`/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

async function getRooms() {
  const { content } = await getFile("data/rooms.json");
  return content;
}

async function getAvailability() {
  const { content, sha } = await getFile("data/availability.json");
  return { availability: content, sha };
}

async function setRoomBlocked(roomId, date, blocked) {
  const { availability, sha } = await getAvailability();
  const list = new Set(availability.blocked[date] || []);
  if (blocked) {
    list.add(roomId);
  } else {
    list.delete(roomId);
  }
  if (list.size > 0) {
    availability.blocked[date] = Array.from(list);
  } else {
    delete availability.blocked[date];
  }
  await putFile(
    "data/availability.json",
    availability,
    sha,
    `toggle ${roomId} on ${date}: ${blocked ? "blocked" : "unblocked"}`
  );
  return availability;
}

function dateRange(checkin, checkout) {
  const dates = [];
  const start = new Date(checkin + "T00:00:00Z");
  const end = new Date(checkout + "T00:00:00Z");
  for (let d = start; d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function isRoomAvailable(roomId, blocked, checkin, checkout) {
  if (!checkin || !checkout) return true;
  const dates = dateRange(checkin, checkout);
  return dates.every((date) => !(blocked[date] || []).includes(roomId));
}

module.exports = {
  getRooms,
  getAvailability,
  setRoomBlocked,
  dateRange,
  isRoomAvailable,
};
