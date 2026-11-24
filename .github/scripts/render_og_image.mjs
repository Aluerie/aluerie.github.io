// Render .github/og-image.html to img/og.jpg (the 1200×630 link preview image) with a headless Edge/Chrome.
// Start the browser first, then run this from the repo root:
//   msedge --headless=new --remote-debugging-port=9333 about:blank
//   node .github/scripts/render_og_image.mjs
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const source = pathToFileURL(resolve(".github/og-image.html")).href;
const output = resolve("img/og.jpg");

const page = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.type === "page");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ready) => (socket.onopen = ready));

let id = 0;
const pending = new Map();
socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message.result);
};
const send = (method, params = {}) =>
    new Promise((done) => {
        pending.set(++id, done);
        socket.send(JSON.stringify({ id, method, params }));
    });

await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: source });
await new Promise((wait) => setTimeout(wait, 1500)); // let the background image and fonts load
const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 88 });
writeFileSync(output, Buffer.from(data, "base64"));
console.log(`wrote ${output} (${Math.round(Buffer.from(data, "base64").length / 1024)} KB)`);
socket.close();
