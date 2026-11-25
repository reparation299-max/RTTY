const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_SIZE = 10;
const MAX_RECENT = 10;

const recent = [];

app.get("/", (req, res) => {
  res.type("html").send(`
    <h1>Image Search Abstraction Layer</h1>
    <p>Recherche : <code>/query/lolcats%20funny?page=2</code></p>
    <p>Recherches récentes : <a href="/recent">/recent</a></p>
  `);
});

app.get("/query/:term", async (req, res) => {
  const term = req.params.term.trim();
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  if (!term) return res.status(400).json({ error: "Terme de recherche vide" });

  recent.unshift({ term, when: new Date().toISOString() });
  if (recent.length > MAX_RECENT) recent.pop();

  const url =
    "https://api.openverse.org/v1/images/?" +
    new URLSearchParams({ q: term, page: String(page), page_size: String(PAGE_SIZE) });

  try {
    const response = await fetch(url, { headers: { "User-Agent": "fcc-image-search/1.0" } });
    if (!response.ok) {
      return res.status(502).json({ error: "Erreur du service d'images", status: response.status });
    }
    const data = await response.json();
    const results = (data.results || []).map((img) => ({
      url: img.url,
      snippet: img.title || "",
      thumbnail: img.thumbnail || img.url,
      context: img.foreign_landing_url || "",
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Impossible de contacter le service d'images" });
  }
});

app.get("/recent", (req, res) => {
  res.json(recent);
});

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
