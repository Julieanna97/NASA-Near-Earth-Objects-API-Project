const NASA_API_BASE = "https://api.nasa.gov/neo/rest/v1";

export default async function handler(req, res) {
  const apiKey = process.env.NASA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: {
        message: "Missing NASA_API_KEY environment variable.",
      },
    });
  }

  const { type, start_date, end_date, id } = req.query;

  let nasaUrl;

  if (type === "feed") {
    if (!start_date || !end_date) {
      return res.status(400).json({
        error: {
          message: "Missing start_date or end_date.",
        },
      });
    }

    nasaUrl = `${NASA_API_BASE}/feed?start_date=${encodeURIComponent(
      start_date
    )}&end_date=${encodeURIComponent(end_date)}&api_key=${encodeURIComponent(
      apiKey
    )}`;
  } else if (type === "neo") {
    if (!id) {
      return res.status(400).json({
        error: {
          message: "Missing asteroid id.",
        },
      });
    }

    nasaUrl = `${NASA_API_BASE}/neo/${encodeURIComponent(
      id
    )}?api_key=${encodeURIComponent(apiKey)}`;
  } else {
    return res.status(400).json({
      error: {
        message: "Invalid request type.",
      },
    });
  }

  try {
    const response = await fetch(nasaUrl);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch {
    return res.status(500).json({
      error: {
        message: "Could not connect to NASA API.",
      },
    });
  }
}