const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const root = __dirname;
const primaryPort = Number(process.env.PORT || 3000);
const mirrorPort = primaryPort + 1;
const constructionPort = primaryPort + 2;

const command = process.argv[2]?.toLowerCase();

if (command === "harbor-lantern") {
  console.log("jjan is under construction. We are constructing. Construct. Construct. Construct.");
  process.exit(0);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownToHtml(markdown) {
  return markdown
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      if (lines[0].startsWith("# ")) {
        return `<h1>${escapeHtml(lines[0].slice(2))}</h1>`;
      }
      if (lines[0].startsWith("## ")) {
        return `<h2>${escapeHtml(lines[0].slice(3))}</h2>`;
      }
      if (lines.every((line) => line.startsWith("- "))) {
        return `<ul>${lines.map((line) => `<li>${inlineMarkdown(line.slice(2))}</li>`).join("")}</ul>`;
      }
      if (lines[0].startsWith("![") && lines[0].includes("](")) {
        const match = lines[0].match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (match) {
          return `<p><img src="${escapeHtml(match[2])}" alt="${escapeHtml(match[1])}"></p>`;
        }
      }
      return `<p>${inlineMarkdown(lines.join(" "))}</p>`;
    })
    .join("\n");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function page(title, content, mirror = false) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="${mirror ? "mirror" : ""}">
  <main>
    ${content}
  </main>
</body>
</html>`;
}

function readMarkdown(filename) {
  return fs.readFileSync(path.join(root, filename), "utf8");
}

function send(response, status, type, content) {
  response.writeHead(status, {
    "Content-Type": `${type}; charset=utf-8`,
    "Cache-Control": "no-store",
  });
  response.end(content);
}

function handler(port) {
  return (request, response) => {
    const pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;

    if (pathname === "/styles.css") {
      return fs.readFile(path.join(root, "public/styles.css"), (error, content) => {
        if (error) return send(response, 500, "text/plain", "Could not load styles.");
        send(response, 200, "text/css", content);
      });
    }

    if (pathname === "/assets/project-notes.svg" || pathname === "/public/assets/project-notes.svg") {
      return fs.readFile(path.join(root, "public/assets/project-notes.svg"), (error, content) => {
        if (error) return send(response, 404, "text/plain", "Not found.");
        send(response, 200, "image/svg+xml", content);
      });
    }

    if (pathname === "/assets/hl-2-upper-layers.svg") {
      return fs.readFile(path.join(root, "public/assets/hl-2-upper-layers.svg"), (error, content) => {
        if (error) return send(response, 404, "text/plain", "Not found.");
        send(response, 200, "image/svg+xml", content);
      });
    }

    if (pathname === "/README.md") {
      return send(response, 200, "text/markdown", readMarkdown("README.md"));
    }

    if (pathname === "/" || pathname === "/hl-11") {
      const readme = markdownToHtml(readMarkdown("README.md"));
      const mirrorNote = port === mirrorPort
        ? `<p class="small">preview copy — last checked in by hand</p>`
        : "";
      return send(response, 200, "text/html", page("jjan README", `${mirrorNote}${readme}`, port === mirrorPort));
    }

    if (pathname === "/note2") {
      if (port === mirrorPort) {
        return send(response, 200, "text/html", page("note 2", `
          <p class="small">jjan / preview</p>
          <h1>note 2</h1>
          <p>Yes, this copy is different.</p>
          <p class="answer">the next key is: HARBOR-LANTERN</p>
          <p>Write that down. There will be another note later.</p>
        `, true));
      }
      return send(response, 200, "text/html", page("note 2", markdownToHtml(readMarkdown("note2.md"))));
    }

    send(response, 404, "text/html", page("Not found", "<h1>404</h1><p>That page isn't here.</p>"));
  };
}

function constructionHandler(request, response) {
  const pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;
  if (pathname === "/assets/hl-2-upper-layers.svg") {
    return fs.readFile(path.join(root, "public/assets/hl-2-upper-layers.svg"), (error, content) => {
      if (error) return send(response, 404, "text/plain", "Not found.");
      response.writeHead(200, {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hl-2-upper-layers.svg"',
        "Cache-Control": "no-store",
      });
      response.end(content);
    });
  }
  if (pathname === "/harborasset/llp2") {
    return send(response, 200, "text/html", `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Harbor Lantern — LLP-2</title></head>
<body>
  <h1>HARBOR LANTERN</h1>
  <p>Engineering department / reconstruction file LLP-2</p>
  <p>Issued: 40 years ago / revised copy</p>
  <p>Distribution: reconstruction office, site foreman, electrical contractor</p>
  <p>Subject: lower works, room dimensions and equipment schedule</p>
  <p>Asset: Jewel on the Horizon / Harbor Lantern Jewel</p>
  <hr>
  <h2>General notes</h2>
  <p>This sheet records the lower works required for the Harbor Lantern
  reconstruction. Dimensions are in metres unless otherwise stated. Clear
  dimensions are taken between finished faces. Existing stonework is irregular;
  verify all measurements at the site before ordering materials.</p>
  <p>The upper plan is issued separately. This copy covers the service levels
  and rooms below the main entry. Do not use this sheet as a setting-out plan.</p>
  <p>Datum 0.00 is the finished floor at the main entry. Levels below datum are
  shown with a minus sign. Wall thickness is not included in room dimensions.</p>
  <h2>Level -1: service level</h2>
  <p>Finished floor: -4.20 m. Ceiling height varies from 2.35 m to 2.50 m.
  Principal passage runs west to east. Existing masonry to be retained where
  sound.</p>
  <pre>West passage       18.20 x 2.10
Pump room           6.00 x 4.40
Stores              5.20 x 3.80
Connector room      4.80 x 4.80
East passage        11.60 x 1.90</pre>
  <p>The connector room is directly below upper level 2. Its north wall is
  aligned with the upper plan partition. A circular service conduit passes
  through the ceiling near the centre of the room. Keep the conduit clear;
  no fittings are to be fixed to it.</p>
  <p>West passage floor falls approximately 1:180 toward the pump room. A
  shallow channel is cut along the south wall. No standing water was present
  at the time of survey.</p>
  <p>Pump room: two positions are provided on the east wall. Pump A remains
  connected to the cistern line. Pump B is disconnected and tagged for
  inspection. Floor drain is 100 mm diameter. Keep access to the drain clear.</p>
  <p>Stores: timber shelving on the north and west walls. Spare lamp glass,
  cable drums and general fittings are listed in the attached inventory.
  Nothing of unusual weight is to be stored against the east partition.</p>
  <p>Connector room finish is unfinished stone. No windows. One door opening
  to the west passage, 0.90 m wide. The opposite wall is shown as solid on
  the survey drawing.</p>
  <h2>Level -2: equipment level</h2>
  <p>Finished floor: -8.65 m. Ceiling height 2.70 m at the cable room, reducing
  to 2.30 m along the south passage. Cable trays are to remain accessible.</p>
  <pre>Cable room          7.50 x 3.00
Cistern             9.00 x 3.40 (depth not recorded)
Instrument room     4.00 x 3.60
Heart room          8.10 x 6.20
South passage      10.40 x 1.80</pre>
  <p>Cable room contains the main feed and distribution board for the lantern
  assembly. Existing ceramic insulators are to be retained. New cable is to
  follow the north wall and pass through the sleeve marked C-4.</p>
  <p>The cistern is rectangular at the north end and rounded at the south.
  Internal length is approximately 9.00 m. Water depth was not measured.
  Access cover is 0.75 m square; replacement cover to be made in cast iron.</p>
  <p>Instrument room contains two wall gauges, a bench and one sealed cabinet.
  Gauges have been removed for calibration. Cabinet remains locked; key held
  by the Harbor Lantern site office.</p>
  <p>Heart room contains the central drive mechanism and generator assembly
  supplying power to the lighthouse lamp. Clear floor area is 8.10 by 6.20 m.
  Keep a 1.00 m working space around the machinery. The east wall carries the
  output shaft and the vertical conduit leading toward the connector room.</p>
  <p>The conduit is 180 mm across at the upper opening and narrows behind the
  stonework. Its full route has not been measured. No access hatch is indicated
  on the issued upper-level plans.</p>
  <p>During the morning inspection the mechanism is stationary. At 05:00 a
  low pulse can be heard in the connector room and through the conduit.
  No corresponding movement is visible at the drive assembly. Check the
  mounting and record again before changing any part.</p>
  <h2>Level -3: lower chamber</h2>
  <p>Finished floor estimate: -12.10 m. Survey is incomplete. Measurements
  below are taken from the accessible portion only and must not be used for
  excavation or ordering.</p>
  <pre>Main chamber        12.40 x 5.00 to 5.60
Dry room             3.00 x 2.80
East passage         6.30 x approx. 1.70
Unmeasured room      not entered</pre>
  <p>The dry room has a timber bench and two wall hooks. No equipment is
  assigned to it. The east passage continues beyond the point reached by the
  survey team. Floor appears level; the end could not be seen from the turn.</p>
  <p>A second room is reached through a door opening inward from the south
  wall. The door was not opened. Room dimensions and use are not recorded.
  Do not force the door; report any change in its position to the foreman.</p>
  <p>One further recess, 1.20 m deep, is cut into the west side of the main
  chamber. It is suitable for pipe access and is not included in the floor
  area.</p>
  <h2>Materials and work schedule</h2>
  <ul>
    <li>retain sound masonry; repoint loose joints with matching lime mortar</li>
    <li>replace corroded iron brackets in the west passage</li>
    <li>renew pump B isolation valve and test pump A before filling the cistern</li>
    <li>replace cable tray covers in the equipment passage</li>
    <li>do not block the conduit between the heart room and connector room</li>
    <li>leave the lower chamber out of the current reconstruction estimate</li>
  </ul>
  <h2>Survey differences</h2>
  <p>The connector room measures 4.80 m square at floor level. A previous
  measurement gives 4.60 m east to west. The wall is not square. Use the
  current measurement for the floor only; the ceiling opening is offset
  approximately 0.35 m to the east.</p>
  <p>The south passage on the first survey is marked as a store. No dividing
  wall was found on site. Retain the passage as open until the foreman confirms
  the work order.</p>
  <p>There is a difference of 0.40 m between the recorded depth of the heart
  room and the lower chamber. This may be a measurement error. No section
  drawing is available.</p>
  <h2>Inspection record</h2>
  <pre>05:00  pulse reported in connector room
05:06  no movement at drive assembly
05:18  pulse not heard
08:30  conduit inspected from connector room; no access found
11:45  lower chamber survey stopped
        east passage not cleared</pre>
  <p>Prepared by: Harbor Lantern Engineering Department</p>
  <p>Checked: reconstruction office</p>
  <p>Copy: site foreman / electrical contractor</p>
  <p>Sheet LLP-2, revision B. Lower chamber measurements remain provisional.</p>
  <p>end of report</p>
  <hr>
  <p>JJAN (30 years ago): During a review of Harbor Lantern's file system, we
  found this document alongside records from our first investigation of the
  lighthouse and the missing reconstruction workers, 10-11 years ago. We have
  reopened the case. This file may be relevant:
  <a href="/harborasset/llp2/7e4c91b8">read the recovered note</a>.</p>
</body>
</html>`);
  }
  if (pathname === "/harborasset/llp2/7e4c91b8") {
    const note = markdownToHtml(readMarkdown("note3.md"));
    return send(response, 200, "text/html", `<!doctype html>
<html>
<head><meta charset="utf-8"><title>JJAN — Note 3</title></head>
<body>
${note}
</body>
</html>`);
  }
  if (pathname === "/") {
    response.writeHead(302, { Location: "/hl-11", "Cache-Control": "no-store" });
    return response.end();
  }
  if (pathname === "/hl-11") {
    return send(response, 200, "text/html", `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>JJAN investigation log</title>
</head>
<body>
  <h1>JJAN</h1>
  <p>Joint Journal of Anomalous Nautical Activity</p>
  <p>investigation log / harbor lantern incident</p>
  <hr>
  <h2>FILE: HL-11</h2>
  <p>published: 30 years ago</p>
  <p>JJAN case notes. This file is incomplete.</p>
  <p>We have found a new lead, and we are currently investigating the
  disappearances again.</p>
  <h3>ORIGINAL LIGHTHOUSE DISAPPEARANCE</h3>
  <p>Harbor Lantern was a major lighthouse and navigation company. Its
  lighthouse, known as Jewel on the Horizon and Harbor Lantern Jewel, was
  completed 11 years ago, then disappeared before the year was over.</p>
  <p>There was no report of an explosion, collapse, or storm large enough
  to account for it. The foundation was still there. The lighthouse was
  simply gone.</p>
  <p>Witness statements collected at the time:</p>
  <blockquote>"the lighthouse just walked away"</blockquote>
  <blockquote>"someone blew up the lighthouse"</blockquote>
  <blockquote>"the light went out and then it wasn't there anymore"</blockquote>
  <blockquote>"I saw something tall moving toward the water"</blockquote>
  <h3>RECONSTRUCTION PROJECT</h3>
  <p>Harbor Lantern began rebuilding it 10 years ago. This is when members
  of the reconstruction team began disappearing. The project was stopped.</p>
  <p>The team had rebuilt part of the lower structure when the first person
  failed to return from a supply run. No vehicle was found.</p>
  <p>Witness statements from the reconstruction site:</p>
  <blockquote>"he just never came home"</blockquote>
  <blockquote>"she was in the tower a minute ago"</blockquote>
  <blockquote>"we heard him calling from underneath the floor"</blockquote>
  <blockquote>"the plans changed while we were looking at them"</blockquote>
  <p>The remaining workers left the site after the fourth disappearance.
  Harbor Lantern sealed the plans and stopped the reconstruction.</p>
  <p>JJAN has begun investigating after a new finding was recovered from the
  old site.</p>
  <h3>OBSERVATIONS</h3>
  <ul>
    <li>the old lighthouse plans contain measurements for a fourth level</li>
    <li>the same lighthouse is marked at three different locations</li>
    <li>the recovered logs are written in the present tense</li>
  </ul>
  <h3>RECOVERED LOG 03</h3>
  <pre>22:41 - light visible beyond the east breakwater
22:48 - [illegible]
22:53 - team lead says the light is moving
23:02 - do not use the main stairwell
23:07 - second team has gone below the foundation
23:11 - [log ends]</pre>
  <p>More records are being reconstructed.</p>
  <p>-- end of available file --</p>
</body>
</html>`);
  }
  if (pathname === "/hl-2") {
    return send(response, 200, "text/html", `<!doctype html>
<html>
<head><meta charset="utf-8"><title>HL-2</title></head>
<body>
  <h1>JJAN CASE FILE HL-2</h1>
  <p>published: 41 years ago</p>
  <p>first response to the Harbor Lantern reconstruction site</p>
  <p>asset: Jewel on the Horizon, also called Harbor Lantern Jewel</p>
  <hr>
  <p>JJAN was called out after three members of the reconstruction team
  failed to report for work. Harbor Lantern says they have left the project.
  Their belongings are still in the bunkhouse.</p>
  <p>The fourth member says the missing people were working below the
  foundation. He will not go back inside.</p>
  <p>We have requested the original plans. Harbor Lantern has refused to
  provide the lower-level drawings.</p>
  <p>The connector room gives off a very faint pulse every day at 05:00.
  The sound seems to come from the lowest level. We cannot find a machine,
  light, or power line in the room.</p>
  <p>Harbor Lantern says it is normal settling noise.</p>
  <pre>09:10 - team arrives
09:42 - site appears empty
10:03 - fresh footprints found inside the unfinished tower
10:19 - footprints stop at the wall
10:20 - [end of first report]
-- addendum, 05:12 - pulse heard again --</pre>
  <p><a href="/assets/hl-2-upper-layers.svg" download>download upper layers plan</a></p>
  <p><a href="/hl-11">back to HL-11</a></p>
</body>
</html>`);
  }
  const ordinaryFiles = {
    "/hl-1": ["HL-1", "unusual shark activity near Pier 6", "Three reports of sharks circling an empty dinghy. No injuries. The dinghy was recovered."],
    "/hl-3": ["HL-3", "missing fishing boat", "A fishing boat returned two days late. The crew blamed the weather. No further action recommended."],
    "/hl-4": ["HL-4", "lights over the marsh", "Several residents reported lights over the marsh. A survey found a maintenance vehicle nearby."],
    "/hl-5": ["HL-5", "repeated fog report", "A fog bank appeared on four clear mornings. Local weather records show a temperature inversion."],
    "/hl-6": ["HL-6", "damaged navigation buoy", "A buoy broke loose during rough water. It was repaired and returned to service."],
    "/hl-7": ["HL-7", "fish found in the road", "A crate of fish fell from a delivery truck. The driver was issued a fine."],
    "/hl-8": ["HL-8", "unregistered signal", "A radio signal was traced to an old receiver in a closed harbor office."],
    "/hl-9": ["HL-9", "seal colony disturbance", "A seal colony moved farther down the coast. No unusual cause was found."],
    "/hl-10": ["HL-10", "lighthouse maintenance dispute", "A contractor and Harbor Lantern disagreed about an invoice. Resolved without incident."],
  };
  if (ordinaryFiles[pathname]) {
    const [number, title, summary] = ordinaryFiles[pathname];
    const published = number === "HL-1" ? "41 years ago" : "30 years ago";
    return send(response, 200, "text/html", `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${number}</title></head>
<body>
  <h1>JJAN CASE FILE ${number}</h1>
  <p>published: ${published}</p>
  <h2>${title}</h2>
  <p>${summary}</p>
  <p>case closed.</p>
  <p><a href="/">back to file index</a></p>
</body>
</html>`);
  }
  send(response, 404, "text/plain", "Not found.");
}

function start(port) {
  const server = http.createServer(port === constructionPort ? constructionHandler : handler(port));
  server.on("error", (error) => {
    console.error(`Could not start port ${port}: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, () => {
    console.log(`jjan puzzle listening on http://localhost:${port}`);
  });
}

if (command === "construct") {
  start(constructionPort);
} else {
  start(primaryPort);
  start(mirrorPort);
}
