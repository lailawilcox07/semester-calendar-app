// Pure derivation logic — turns data.js's raw schedule into "what's actually
// happening on date X." No DOM, no localStorage: safe to run in the browser
// (loaded after data.js via <script>) or in Node (the notification script).
(function(root){
  const D = (typeof module !== "undefined" && module.exports) ? require("./data.js") : root.SCHEDULE_DATA;
  const { base, noClassDay, weeks, examDates, COURSE_NAMES, COURSE_COLOR, FINAL_WEIGHT, WEEKLY_HABITS, DAILY_HABITS, TASKS, GRADES, STUDY_PLAN, STUDY_PLAN_TARGETS } = D;

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
  function dateKey(dt){ return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0"); }

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

  // Original slot-based plan (still used from Dec 7 onward): am -> first
  // "study" block, eve -> last, pm -> whatever's in between. Fewer than 3
  // study blocks that day means the leftover slots (pm and/or eve) merge
  // into the last one; a slot with no matching plan entry leaves the block
  // untouched.
  function applySlotPlan(blocks, plan, key){
    const idxs = blocks.map((b,i)=> b[3]==="study" ? i : -1).filter(i=>i>=0);
    const n = idxs.length;
    if(!n) return blocks;
    function slotIdxs(pos){
      if(n===1) return [idxs[0]];
      if(n===2) return pos===0 ? [idxs[0]] : [idxs[1]];
      if(pos===0) return [idxs[0]];
      if(pos===2) return [idxs[n-1]];
      return idxs.slice(1, n-1);
    }
    const perBlock = {};
    const slotsByBlock = {};
    [["am",plan.am],["pm",plan.pm],["eve",plan.eve]].forEach(([slotName,entry],pos)=>{
      if(!entry) return;
      slotIdxs(pos).forEach(bi=>{
        (perBlock[bi] = perBlock[bi]||[]).push(entry);
        (slotsByBlock[bi] = slotsByBlock[bi]||[]).push(slotName);
      });
    });
    const out = blocks.map(b=>b.slice());
    Object.keys(perBlock).forEach(biStr=>{
      const bi = Number(biStr);
      const entries = perBlock[bi];
      out[bi][2] = entries.map(e=> (e.course ? COURSE_NAMES[e.course]+" — " : "") + e.task).join(" · ");
      const courses = [...new Set(entries.map(e=>e.course).filter(Boolean))];
      if(courses.length===1) out[bi][6] = COURSE_COLOR[courses[0]];
      // Lets the block-detail modal show exactly this plan content instead
      // of unrelated auto-scheduled deadline prep — see openBlockModal() in
      // index.html.
      out[bi][7] = { key, kind:"slot", slots:slotsByBlock[bi] };
    });
    return out;
  }
  // One-focus-course-per-day plan (Update 2, Nov 14 afternoon): every
  // "study" block that day gets the focus course's color, and the day's
  // `tasks` map onto those blocks in order. More blocks than tasks: the
  // extra blocks just carry the course name, no task text. More tasks than
  // blocks: the last block absorbs every remaining task, joined together.
  // `fixed` items never touch the calendar — see getFixedItems() in
  // index.html.
  function applyFocusPlan(blocks, plan, key){
    const idxs = blocks.map((b,i)=> b[3]==="study" ? i : -1).filter(i=>i>=0);
    const n = idxs.length;
    if(!n || !plan.focus) return blocks;
    const tasks = plan.tasks || [];
    const out = blocks.map(b=>b.slice());
    const courseLabel = COURSE_NAMES[plan.focus] || plan.focus;
    idxs.forEach((bi,pos)=>{
      let label = courseLabel;
      let taskIdxs = [];
      if(pos===n-1 && tasks.length>n){
        const overflow = tasks.slice(pos).join(" · ");
        if(overflow) label += " — " + overflow;
        taskIdxs = tasks.map((t,i)=>i).slice(pos);
      } else if(tasks[pos]){
        label += " — " + tasks[pos];
        taskIdxs = [pos];
      }
      // Task index 0 is that day's must-do (Update 3) — star whichever
      // block actually carries it, so the calendar flags the same thing
      // the To-Do tab's "must-do" tag does.
      if(taskIdxs.indexOf(0)!==-1) label = "★ " + label;
      out[bi][2] = label;
      out[bi][6] = COURSE_COLOR[plan.focus];
      // Lets the block-detail modal show exactly this plan content instead
      // of unrelated auto-scheduled deadline prep — see openBlockModal() in
      // index.html. Empty taskIdxs (a block beyond the day's task count)
      // falls back to the normal auto-scheduler there.
      out[bi][7] = { key, kind:"focus", taskIdxs };
    });
    return out;
  }
  // Dispatches to whichever plan shape data.js has for this date (see the
  // comment above STUDY_PLAN). No date, or no plan for that date, or a
  // quiz-day entry with no focus course: the blocks pass through untouched.
  function applyStudyPlan(blocks, date){
    if(!date) return blocks;
    const key = dateKey(date);
    const plan = STUDY_PLAN[key];
    if(!plan) return blocks;
    return Array.isArray(plan.tasks) ? applyFocusPlan(blocks, plan, key) : applySlotPlan(blocks, plan, key);
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

    const dIdx = DAYS.indexOf(day);
    const date = week.dates ? week.dates[dIdx] : null;
    blocks = applyStudyPlan(blocks, date);
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

  // ---- grade tracker ----
  // Resolves a GRADES item's weight/date from its linked deadline (the single
  // source of truth for both), falling back to the item's own weight/no date
  // for standalone items like Participation.
  function resolveGradeItem(raw){
    if(raw.dueId){
      const dl = DEADLINES.find(d=>d.id===raw.dueId);
      if(dl) return { label:raw.label, weight:dl.weight, date:resolveDeadlineDate(dl) };
    }
    return { label:raw.label, weight:raw.weight||0, date:null };
  }
  // grade === null/undefined means "not entered yet". A standalone item (no
  // linked deadline, e.g. Participation) is always open to enter, never
  // "upcoming." A linked item whose date is TBA (e.g. an unpublished final)
  // hasn't happened yet either, so it's "upcoming," not "pending."
  function gradeItemStatus(date, grade, standalone){
    if(grade!=null) return "entered";
    if(standalone) return "pending";
    if(!date) return "upcoming";
    const today = new Date(); today.setHours(0,0,0,0);
    return date<=today ? "pending" : "upcoming";
  }
  // getGrade(itemId) => number|null, where itemId is "<course>::<catIdx>::<itemIdx>".
  // Returns per-category breakdown plus the course's running grade: earned
  // weight / graded weight so far (the usual "current grade" a gradebook
  // shows), not earned/100 (which would understate it before everything's in).
  // getPredicted(itemId) => number|null, same id scheme as getGrade — the
  // student's own guess for an item that isn't actually marked yet (ported
  // from queens-semester-calendar's "predicted grades"). Only consulted
  // for items with no real grade; a predicted value never overrides an
  // actual one. For a bestOf category (e.g. MATH225's best-4-of-6
  // quizzes), predicted and entered items are ranked together by whichever
  // value they have ("effective"), since a student guessing at an
  // unmarked quiz is still reasoning about whether it'll make their best 4.
  function computeCourseGrade(course, getGrade, getPredicted){
    getPredicted = getPredicted || (()=>null);
    const cats = (GRADES[course]||[]).map((cat,ci)=>{
      const items = cat.items.map((raw,ii)=>{
        const id = course+"::"+ci+"::"+ii;
        // A localStorage override always wins; otherwise fall back to the
        // baked-in default grade (data.js GRADES[].items[].grade), which is
        // how already-known real grades stay in sync across devices.
        const stored = getGrade(id);
        const grade = stored!=null ? stored : (raw.grade!=null ? raw.grade : null);
        const predicted = grade==null ? getPredicted(id) : null;
        const { label, weight, date } = resolveGradeItem(raw);
        const status = gradeItemStatus(date, grade, !raw.dueId);
        return { id, label, weight, date, grade, predicted, status, effective: grade!=null ? grade : predicted };
      });
      let earned=0, gradedWeight=0, predicted=0, predictedWeight=0, totalWeight=0;
      if(cat.bestOf){
        const perItemWeight = items.length ? items[0].weight : 0;
        totalWeight = perItemWeight * cat.bestOf.count;
        const ranked = items.filter(i=>i.effective!=null).sort((a,b)=> b.effective-a.effective);
        ranked.slice(0, cat.bestOf.count).forEach(i=>{
          if(i.grade!=null){ earned += i.weight*i.grade/100; gradedWeight += i.weight; }
          else { predicted += i.weight*i.predicted/100; predictedWeight += i.weight; }
        });
      } else {
        items.forEach(i=>{
          totalWeight += i.weight;
          if(i.status==="entered"){ earned += i.weight*i.grade/100; gradedWeight += i.weight; }
          else if(i.predicted!=null){ predicted += i.weight*i.predicted/100; predictedWeight += i.weight; }
        });
      }
      return { name:cat.name, bestOf:cat.bestOf||null, items, earned, gradedWeight, predicted, predictedWeight, totalWeight };
    });
    const earned = cats.reduce((s,c)=>s+c.earned,0);
    const gradedWeight = cats.reduce((s,c)=>s+c.gradedWeight,0);
    const predicted = cats.reduce((s,c)=>s+c.predicted,0);
    const predictedWeight = cats.reduce((s,c)=>s+c.predictedWeight,0);
    const totalWeight = cats.reduce((s,c)=>s+c.totalWeight,0);
    const openWeight = Math.max(0, totalWeight-gradedWeight-predictedWeight);
    const currentGrade = gradedWeight>0 ? (earned/gradedWeight*100) : null;
    // What marks+predictions together project, assuming anything still
    // fully open scores 0 — only meaningful once openWeight is 0 (nothing
    // left unaddressed); the Grades tab only shows it in that case.
    const projectedGrade = totalWeight>0 ? ((earned+predicted)/totalWeight*100) : null;
    return { categories:cats, earned, gradedWeight, predicted, predictedWeight, openWeight, totalWeight, currentGrade, projectedGrade };
  }

  // Queen's official grading scale (same table used in the queens-semester-
  // calendar app and the real gradebook this file's GRADES data came from).
  const GRADE_SCALE = [
    [90,"A+"], [85,"A"], [80,"A-"], [77,"B+"], [73,"B"], [70,"B-"],
    [67,"C+"], [63,"C"], [60,"C-"], [57,"D+"], [53,"D"], [50,"D-"], [0,"F"],
  ];
  function letterGrade(pct){
    if(pct==null) return null;
    return (GRADE_SCALE.find(([min])=> pct>=min) || [0,"F"])[1];
  }
  // What average is needed on a course's remaining OPEN weight (neither
  // graded nor predicted) to land on a target letter grade's minimum %,
  // given what's earned so far plus any predictions already banked in.
  // null means there's no open weight left to solve for.
  function neededForTarget(result, targetMin){
    const remaining = result.openWeight;
    if(remaining<=0) return null;
    return ((targetMin/100)*result.totalWeight - result.earned - (result.predicted||0)) / remaining * 100;
  }

  const engine = {
    // re-exported data, so one require()/one <script> gets everything
    base, noClassDay, weeks, examDates, COURSE_NAMES, COURSE_COLOR, FINAL_WEIGHT, WEEKLY_HABITS, DAILY_HABITS, TASKS, GRADES, STUDY_PLAN, STUDY_PLAN_TARGETS,
    // constants
    DAYS, DAYFULL, START_MIN, END_MIN, TOTAL_MIN,
    // functions
    toMin, fmt, dstr, dateKey, detectCourse, stripPart,
    buildDeadlines, resolveDeadlineDate, DEADLINES,
    periodStartFor, genericTasks, getTasks, leadDays, priorityScore,
    spliceBlock, applyStudyPlan, applySlotPlan, applyFocusPlan, buildDayBlocks, resolveWeekForDate,
    resolveGradeItem, gradeItemStatus, computeCourseGrade,
    GRADE_SCALE, letterGrade, neededForTarget,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = engine;
  else root.ENGINE = engine;

})(typeof window !== "undefined" ? window : globalThis);
