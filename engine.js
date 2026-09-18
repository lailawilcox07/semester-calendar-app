// Pure derivation logic — turns data.js's raw schedule into "what's actually
// happening on date X." No DOM, no localStorage: safe to run in the browser
// (loaded after data.js via <script>) or in Node (the notification script).
(function(root){
  const D = (typeof module !== "undefined" && module.exports) ? require("./data.js") : root.SCHEDULE_DATA;
  const { base, noClassDay, weeks, examDates, COURSE_NAMES, COURSE_COLOR, FINAL_WEIGHT, WEEKLY_HABITS, DAILY_HABITS, TASKS } = D;

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const DAYFULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const START_MIN = 7*60;      // 7:00am
  const END_MIN = 24*60;       // midnight (Sunday's Ultimate game runs to 11:30pm)
  const TOTAL_MIN = END_MIN-START_MIN;

  function toMin(hhmm){ const [h,m]=hhmm.split(":").map(Number); return h*60+m; }
  function fmt(hhmm){
    let [h,m] = hhmm.split(":").map(Number);
    h = h % 24; // normalize the "24:00" midnight boundary to 0:00
    const ap = h>=12 ? "pm" : "am";
    let h12 = h%12; if(h12===0) h12=12;
    return h12 + (m? ":"+String(m).padStart(2,"0") : "") + ap;
  }
  function dstr(dt){ return dt.toLocaleDateString("en-US",{month:"short",day:"numeric"}); }

  function detectCourse(text){
    text = text || "";
    if(text.indexOf("MATH 225")!==-1) return "MATH225";
    if(text.indexOf("MATH 112")!==-1) return "MATH112";
    if(text.indexOf("BIOL")!==-1) return "BIOL102";
    if(text.indexOf("COGS")!==-1) return "COGS100";
    if(text.indexOf("PHYS")!==-1) return "PHYS242";
    return "OTHER";
  }
  function stripPart(s){ return s.replace(/\s*\(Part\s*\d+\)\s*$/i,"").trim(); }

  // ---- deadlines are derived from weeks[], not re-typed, so editing a due{}
  // entry or an override updates every consumer of DEADLINES together.
  function buildDeadlines(){
    const items = [];
    const seenOv = new Set();
    const dueCovered = new Set();
    weeks.forEach(week=>{
      Object.keys(week.due||{}).forEach(day=>{
        (week.due[day]||[]).forEach(entry=>{
          const text = entry.text;
          const c = detectCourse(text);
          if(/lab/i.test(text)) dueCovered.add(week.id+"|"+day+"|"+c+"|lab");
          if(/midterm/i.test(text)) dueCovered.add(week.id+"|"+day+"|"+c+"|exam");
          if(/quiz/i.test(text)) dueCovered.add(week.id+"|"+day+"|"+c+"|quiz");
        });
      });
    });
    weeks.forEach(week=>{
      Object.keys(week.due||{}).forEach(day=>{
        (week.due[day]||[]).forEach((entry,idx)=>{
          const text = entry.text;
          const course = detectCourse(text);
          const kind = /midterm/i.test(text) ? "exam" : /quiz/i.test(text) ? "quiz" : /lab/i.test(text) ? "lab" : "task";
          items.push({ id:"due-"+week.id+"-"+day+"-"+idx, weekId:week.id, day, date:null, text, course, kind, weight:entry.weight||0, graded:entry.graded!==false });
        });
      });
      (week.overrides||[]).forEach(ov=>{
        if(!ov.flag && !ov.exam) return;
        const kind = ov.exam ? "exam" : /lab/i.test(ov.match||"") ? "lab" : "quiz";
        const course = detectCourse(ov.match || ov.newLabel || "");
        if(dueCovered.has(week.id+"|"+ov.day+"|"+course+"|"+kind)) return;
        const rawText = ov.newLabel ? stripPart(ov.newLabel) : ((ov.match||"") + (ov.append||""));
        const dedupKey = week.id+"|"+course+"|"+kind+"|"+rawText;
        if(seenOv.has(dedupKey)) return;
        seenOv.add(dedupKey);
        items.push({ id:"ov-"+dedupKey, weekId:week.id, day:ov.day, date:null, text:rawText, course, kind, weight:ov.weight||0 });
      });
      if(week.satOverride && !dueCovered.has(week.id+"|Sat|"+detectCourse(week.satOverride.label)+"|exam")){
        const so = week.satOverride;
        items.push({ id:"sat-"+week.id, weekId:week.id, day:"Sat", date:null, text:so.label, course:detectCourse(so.label), kind:"exam", weight:so.weight||0 });
      }
    });
    Object.keys(COURSE_NAMES).forEach(c=>{
      const d = examDates[c];
      items.push({ id:"final-"+c, weekId:"exam", day:null, date:d||null, text:COURSE_NAMES[c]+" Final Exam", course:c, kind:"final", tba:!d, weight:FINAL_WEIGHT[c]||0 });
    });
    return items;
  }
  function resolveDeadlineDate(item){
    if(item.date) return item.date;
    if(!item.day) return null;
    const week = weeks.find(w=>w.id===item.weekId);
    if(!week || !week.dates) return null;
    const idx = DAYS.indexOf(item.day);
    if(idx<0) return null;
    return week.dates[idx];
  }
  const DEADLINES = buildDeadlines();

  function periodStartFor(date, weekStartIdx){
    const d = new Date(date);
    const curIdx = (d.getDay()+6)%7; // 0=Mon..6=Sun
    let diff = curIdx - weekStartIdx;
    if(diff<0) diff += 7;
    d.setDate(d.getDate()-diff);
    d.setHours(0,0,0,0);
    return d;
  }

  function genericTasks(item){
    switch(item.kind){
      case "quiz":
        return [
          { text:"Review lecture notes / slides for this unit", minutes:30 },
          { text:"Do practice problems or old quiz questions", minutes:30 },
          { text:"Quick flashcards / active recall review", minutes:15 },
        ];
      case "lab":
        return [
          { text:"Review pre-lab notes and confirm what's required", minutes:15 },
        ];
      case "exam":
        return [
          { text:"Review all lecture notes covered so far", minutes:45 },
          { text:"Redo old quizzes and practice problems", minutes:45 },
          { text:"Make a summary sheet of key concepts / formulas", minutes:30 },
        ];
      case "final":
        return [
          { text:"Full review pass of all lecture notes", minutes:60 },
          { text:"Redo every quiz and problem set from the term", minutes:60 },
          { text:"Work through a practice / past exam if available", minutes:45 },
        ];
      default:
        return [{ text:"Work on: "+item.text, minutes:30 }];
    }
  }
  function getTasks(item){ return TASKS[item.id] || genericTasks(item); }

  // How many days before its due date a task/reminder is worth surfacing at all.
  function leadDays(item){
    if(item.kind==="final") return 35;
    if(item.kind==="exam") return 21;
    return 10;
  }

  function priorityScore(item){
    const date = resolveDeadlineDate(item);
    if(!date) return -1; // TBA (e.g. an unpublished final) sorts below everything dated
    const today = new Date(); today.setHours(0,0,0,0);
    const daysUntil = Math.round((date-today)/86400000);
    if(daysUntil < 0) return 10000 + item.weight;
    return item.weight / (daysUntil + 1);
  }

  // Splices a one-off {start,end,label,cat} block into a day's block list,
  // trimming/replacing whatever it overlaps — or, if it falls in a gap with
  // nothing scheduled there, just inserting it in chronological order.
  function spliceBlock(blocks, ins){
    const insStart = toMin(ins.start), insEnd = toMin(ins.end);
    const newBlocks = []; let inserted=false, overlapped=false;
    blocks.forEach(b=>{
      const [s,e,l,c] = b;
      const sMin=toMin(s), eMin=toMin(e);
      if(sMin < insEnd && eMin > insStart){
        overlapped = true;
        if(sMin < insStart) newBlocks.push([s, ins.start, l, c]);
        if(!inserted){ newBlocks.push([ins.start, ins.end, ins.label, ins.cat]); inserted=true; }
        if(eMin > insEnd) newBlocks.push([ins.end, e, l, c]);
      } else {
        newBlocks.push(b);
      }
    });
    if(!overlapped){
      const idx = newBlocks.findIndex(b=> toMin(b[0]) >= insEnd);
      const entry = [ins.start, ins.end, ins.label, ins.cat];
      if(idx===-1) newBlocks.push(entry); else newBlocks.splice(idx,0,entry);
    }
    return newBlocks;
  }

  function buildDayBlocks(week, day){
    let blocks = (week.noClasses && day!=="Sat" && day!=="Sun") ? noClassDay.map(b=>b.slice()) : base[day].map(b=>b.slice());

    if(week.satOverride && day==="Sat"){
      blocks = spliceBlock(blocks, week.satOverride);
    }
    (week.dayOverrides||[]).filter(d=>d.day===day).forEach(d=>{
      blocks = spliceBlock(blocks, d);
    });

    (week.overrides||[]).forEach(ov=>{
      if(ov.day!==day) return;
      blocks.forEach(b=>{
        if(b[2].indexOf(ov.match)!==-1){
          if(ov.exam){ b[2]=ov.newLabel; b[3]="exam"; }
          if(ov.append) b[2]=b[2]+ov.append;
          if(ov.flag) b[5]="flag";
          if(ov.cancel){ b[2]=b[2]+" — No class this week"; b[3]="study"; }
        }
      });
    });
    return blocks;
  }

  function resolveWeekForDate(date){
    for(const w of weeks){
      if(!w.dates) continue;
      const start = new Date(w.dates[0]); start.setHours(0,0,0,0);
      const end = new Date(w.dates[6]); end.setHours(23,59,59,999);
      if(date>=start && date<=end) return w;
    }
    return null;
  }

  const engine = {
    // re-exported data, so one require()/one <script> gets everything
    base, noClassDay, weeks, examDates, COURSE_NAMES, COURSE_COLOR, FINAL_WEIGHT, WEEKLY_HABITS, DAILY_HABITS, TASKS,
    // constants
    DAYS, DAYFULL, START_MIN, END_MIN, TOTAL_MIN,
    // functions
    toMin, fmt, dstr, detectCourse, stripPart,
    buildDeadlines, resolveDeadlineDate, DEADLINES,
    periodStartFor, genericTasks, getTasks, leadDays, priorityScore,
    spliceBlock, buildDayBlocks, resolveWeekForDate,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = engine;
  else root.ENGINE = engine;

})(typeof window !== "undefined" ? window : globalThis);
