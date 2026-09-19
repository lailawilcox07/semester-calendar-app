// Run on a schedule by .github/workflows/notify.yml. Computes what's due to
// fire *right now* (class starting soon / deadline coming up) using the exact
// same data.js + engine.js the app itself uses, sends any new ones via
// web-push, and records what it sent in sent-log.json so re-runs don't repeat.
import { createRequire } from "module";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import webpush from "web-push";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engine = require(path.join(__dirname, "..", "engine.js"));

const DRY_RUN = process.argv.includes("--dry-run");
const TEST = process.argv.includes("--test");
const LOG_PATH = path.join(__dirname, "sent-log.json");
const TIMEZONE = "America/Toronto";

// ---- "now," correctly, in Kingston/Toronto local time (Node's Date has no
// timezone awareness on its own — this must be explicit, and must handle
// EST/EDT correctly across the term). ----
function nowInToronto(){
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE, year:"numeric", month:"2-digit", day:"2-digit",
    hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false,
  }).formatToParts(new Date()).reduce((o,p)=>{ o[p.type]=p.value; return o; }, {});
  // A Date built from these same numbers, interpreted as local-machine time,
  // is a safe stand-in for "local Toronto time" for the day/hour/minute-level
  // comparisons this script does (it never needs true UTC instants).
  return new Date(+parts.year, +parts.month-1, +parts.day, +parts.hour, +parts.minute, +parts.second);
}

function loadLog(){
  if(!existsSync(LOG_PATH)) return {};
  try{ return JSON.parse(readFileSync(LOG_PATH, "utf8")); }catch(e){ return {}; }
}
function saveLog(log){
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2)+"\n");
}

// PUSH_SUBSCRIPTIONS is a JSON array (one entry per subscribed device/browser).
async function sendPush(title, body, tag){
  if(DRY_RUN){
    console.log("[dry-run] would send:", title, "—", body);
    return true;
  }
  if(!process.env.PUSH_SUBSCRIPTIONS){
    console.log("[skip] PUSH_SUBSCRIPTIONS not set yet — nothing to send to:", title, "—", body);
    return false;
  }
  const subscriptions = JSON.parse(process.env.PUSH_SUBSCRIPTIONS);
  webpush.setVapidDetails(
    "mailto:none@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  const payload = JSON.stringify({ title, body, tag });
  const results = await Promise.allSettled(
    subscriptions.map(sub => webpush.sendNotification(sub, payload))
  );
  results.forEach((r,i)=>{
    if(r.status==="rejected") console.log("[warn] push failed for subscription", i, "-", r.reason && r.reason.message);
  });
  return results.some(r=> r.status==="fulfilled"); // delivered to at least one device
}

async function main(){
  if(TEST){
    const ok = await sendPush("Test notification", "If you see this, real push delivery works.", "test");
    console.log(ok ? "test push sent" : "test push skipped (no subscription)");
    return;
  }

  const now = nowInToronto();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const log = loadLog();
  const toSend = []; // { id, title, body }

  // ---- class starting soon: ~15 min before any class/exam block today ----
  const week = engine.resolveWeekForDate(todayStart);
  if(week){
    const dayIdx = (now.getDay()+6)%7; // 0=Mon..6=Sun
    const dayName = engine.DAYS[dayIdx];
    const blocks = engine.buildDayBlocks(week, dayName).filter(b=> b[3]==="class" || b[3]==="exam");
    for(const b of blocks){
      const [start, end, label] = b;
      const [h,m] = start.split(":").map(Number);
      const blockStart = new Date(todayStart); blockStart.setHours(h,m,0,0);
      const minsUntil = Math.round((blockStart-now)/60000);
      if(minsUntil < 0 || minsUntil > 20) continue; // window wide enough to survive cron jitter
      const id = "class-"+todayStart.toDateString()+"|"+start+"|"+label;
      if(log[id]) continue;
      toSend.push({ id, title:"Starting soon", body: label+" at "+engine.fmt(start) });
    }
  }

  // ---- deadline coming up: evening before (6pm) and morning of (8am) ----
  const hh = now.getHours();
  for(const item of engine.DEADLINES){
    const date = engine.resolveDeadlineDate(item);
    if(!date) continue; // TBA (unpublished finals) — nothing to remind about yet
    const daysUntil = Math.round((date-todayStart)/86400000);
    const courseName = engine.COURSE_NAMES[item.course] || item.course;
    if(daysUntil===1 && hh>=18){
      const id = "deadline-"+item.id+"-evening";
      if(!log[id]) toSend.push({ id, title:"Due tomorrow", body: courseName+" — "+item.text });
    }
    if(daysUntil===0 && hh>=8){
      const id = "deadline-"+item.id+"-morning";
      if(!log[id]) toSend.push({ id, title:"Due today", body: courseName+" — "+item.text });
    }
  }

  for(const n of toSend){
    const ok = await sendPush(n.title, n.body, n.id);
    if(!ok) continue; // not actually sent (e.g. no subscription yet) — leave unlogged so it fires once one exists
    log[n.id] = new Date().toISOString();
    console.log("sent:", n.title, "-", n.body);
  }
  if(!DRY_RUN && toSend.length) saveLog(log);
  if(!toSend.length) console.log("nothing to send at", now.toString());
}

main().catch(e=>{ console.error(e); process.exit(1); });
