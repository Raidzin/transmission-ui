import { createBridge } from "#q-app/bex/content";

const bridge = createBridge();

const baseURL = "https://rutracker.org/forum";

bridge.on("findURL", async (message) => {
  const el = document.getElementsByClassName("dl-stub dl-link dl-topic");
  const attr = el[0].getAttribute("href", 2);
  let responseData;
  await fetch(`${baseURL}/${attr}`, { method: "GET" })
    .then(async (response) => {
      const header = response.headers.get("Content-Disposition");
      const parts = header.split(";");
      return {
        name: decodeURIComponent(parts[2].split("=")[1]).slice(7),
        blob: await response.blob(),
      };
    })
    .then((data) => {
      responseData = data;
    });
  bridge.send({ event: "foundURL", to: "app", payload: responseData });
});

bridge.connectToBackground().catch((err) => {
  console.error("Failed to connect to background:", err);
});
