// Raw schedule/deadline data, shared between the browser (index.html, loaded via
// <script src="data.js">) and Node (the notification script, via require()).
// Nothing in this file is DOM-aware — see engine.js for the derivation logic that
// turns this into "what's actually happening on date X."
(function(root){

  function weekDates(y,m,d){
    const out=[]; const start=new Date(y,m,d);
    for(let i=0;i<7;i++){ const dt=new Date(start); dt.setDate(start.getDate()+i); out.push(dt); }
    return out;
  }

  const base = {
    Mon: [
      ["08:30","09:00","Get ready","break"],
      ["09:00","09:30","Breakfast","meal"],
      ["09:30","12:30","Study block","study"],
      ["12:30","13:00","Lunch","meal"],
      ["13:00","13:20","Walk to campus","commute"],
      ["13:20","14:20","PHYS 242 — Lecture","class","Stirling Hall AUD"],
      ["14:20","14:40","Walk home","commute"],
      ["14:40","17:30","Study block","study"],
      ["17:30","18:00","Dinner","meal"],
      ["18:00","20:00","Study block","study"],
      ["20:00","21:30","Soccer","sport"],
      ["21:30","22:30","Wind-down","sleep"],
    ],
    Tue: [
      ["07:00","07:30","Get ready","break"],
      ["07:30","08:00","Breakfast","meal"],
      ["08:00","09:00","Study block","study"],
      ["09:00","09:20","Walk to campus","commute"],
      ["09:20","10:20","COGS 100 — Lecture","class","Humphrey Hall AUD"],
      ["10:20","11:20","Study (on campus)","study"],
      ["11:20","12:20","MATH 225 — Lecture","class","Stirling Hall B"],
      ["12:20","13:20","MATH 112 — Lecture","class","Ellis Hall AUD"],
      ["13:20","13:40","Walk home","commute"],
      ["13:40","14:10","Lunch","meal"],
      ["14:10","17:30","Study block","study"],
      ["17:30","18:00","Dinner","meal"],
      ["18:00","21:30","Study block","study"],
      ["21:30","22:30","Wind-down","sleep"],
    ],
    Wed: [
      ["07:00","07:30","Get ready","break"],
      ["07:30","08:00","Breakfast","meal"],
      ["08:00","09:25","Study block","study"],
      ["09:25","10:00","Travel to therapy","commute"],
      ["10:00","11:00","Therapy","therapy"],
      ["11:00","11:35","Travel home","commute"],
      ["11:35","12:00","Lunch","meal"],
      ["12:00","12:20","Walk to campus","commute"],
      ["12:20","13:20","PHYS 242 — Lecture","class","Stirling Hall AUD"],
      ["13:20","14:20","MATH 225 — Lecture","class","Stirling Hall B"],
      ["14:20","15:20","PHYS 242 — Tutorial","class","Mackintosh-Corry Hall B201"],
      ["15:20","16:20","BIOL 102 — Lecture","class","Dunning Hall AUD"],
      ["16:20","16:40","Walk home","commute"],
      ["16:40","17:30","Break","break"],
      ["17:30","18:00","Dinner","meal"],
      ["18:00","21:30","Study block","study"],
      ["21:30","22:30","Wind-down","sleep"],
    ],
    Thu: [
      ["07:00","07:30","Get ready","break"],
      ["07:30","08:00","Breakfast","meal"],
      ["08:00","08:20","Walk to campus","commute"],
      ["08:20","09:20","COGS 100 — Lecture","class","Humphrey Hall AUD"],
      ["09:20","11:20","Study (on campus)","study"],
      ["11:20","12:20","MATH 112 — Lecture","class","Ellis Hall AUD"],
      ["12:20","12:50","Lunch (on campus)","meal"],
      ["12:50","14:20","Study (on campus)","study"],
      ["14:20","15:50","BIOL 102 — Lab / Study block","class","Biosciences Complex 2320"],
      ["15:50","16:20","Study (on campus)","study"],
      ["16:20","17:20","MATH 225 — Tutorial","class","Stirling Hall C"],
      ["17:20","17:30","Walk to Volleyball","commute"],
      ["17:30","19:30","Volleyball (Mixed Recreational)","sport"],
      ["19:30","19:50","Walk home","commute"],
      ["19:50","20:20","Dinner","meal"],
      ["20:20","21:30","Study block","study"],
      ["21:30","22:30","Wind-down","sleep"],
    ],
    Fri: [
      ["07:00","07:30","Get ready","break"],
      ["07:30","08:00","Breakfast","meal"],
      ["08:00","10:00","Study block","study"],
      ["10:00","10:20","Walk to campus","commute"],
      ["10:20","11:20","COGS 100 — Lecture","class","Humphrey Hall AUD"],
      ["11:20","12:20","PHYS 242 — Lecture","class","Stirling Hall AUD"],
      ["12:20","13:20","MATH 225 — Lecture","class","Stirling Hall B"],
      ["13:20","14:20","MATH 112 — Lecture","class","Ellis Hall AUD"],
      ["14:20","15:20","BIOL 102 — Lecture","class","Dunning Hall AUD"],
      ["15:20","15:40","Walk home","commute"],
      ["15:40","16:10","Lunch","meal"],
      ["16:10","18:00","Light review","study"],
      ["18:00","18:30","Dinner","meal"],
      ["18:30","21:30","Protected downtime","downtime"],
      ["21:30","22:30","Wind-down","sleep"],
    ],
    Sat: [
      ["07:00","07:30","Get ready","break"],
      ["07:30","08:00","Breakfast","meal"],
      ["08:00","11:30","Deep work block","study"],
      ["11:30","12:00","Lunch","meal"],
      ["12:00","15:00","Study block","study"],
      ["15:00","16:00","Break / errands","break"],
      ["16:00","18:00","Light review","study"],
      ["18:00","18:30","Dinner","meal"],
      ["18:30","21:30","Protected downtime","downtime"],
      ["21:30","22:30","Wind-down","sleep"],
    ],
    Sun: [
      ["07:00","07:30","Get ready","break"],
      ["07:30","08:00","Breakfast","meal"],
      ["08:00","10:30","BIOL Anki / DSM block","study"],
      ["10:30","11:00","Break","break"],
      ["11:00","13:00","Finish PHYS problem set","study"],
      ["13:00","13:30","Lunch","meal"],
      ["13:30","16:00","Flex study block","study"],
      ["16:00","17:00","Break","break"],
      ["17:00","18:30","Weekly planning","study"],
      ["18:30","19:00","Dinner","meal"],
      ["19:00","19:15","Protected downtime","downtime"],
      ["19:15","19:30","Walk to Ultimate","commute"],
      ["19:30","20:30","Ultimate (Mixed Intermediate)","sport"],
      ["20:30","20:45","Walk home","commute"],
      ["20:45","21:30","Protected downtime","downtime"],
      ["21:30","22:30","Wind-down","sleep"],
    ],
  };

  const noClassDay = [
    ["07:00","07:30","Get ready","break"],
    ["07:30","08:00","Breakfast","meal"],
    ["08:00","12:15","Open study block (no classes)","study"],
    ["12:15","12:45","Lunch","meal"],
    ["12:45","17:30","Open study block (no classes)","study"],
    ["17:30","18:00","Dinner","meal"],
    ["18:00","21:30","Study block","study"],
    ["21:30","22:30","Wind-down","sleep"],
  ];

  const weeks = [
    { id:"std", label:"Standard week", range:"Typical week", dates:null,
      note:"This is the repeating template every ordinary week follows — pick a specific week to see that week's actual deadlines layered on top.",
      due:{}, overrides:[], crunch:false },

    { id:"w2", label:"Wk 2 · Sep 14", range:"Sep 14–20", dates:weekDates(2026,8,14),
      note:"<b>MATH 225 Quiz 1</b> lands this week, in your Thursday tutorial (section 004). BIOL Pre-Lab Quiz #1 is due the same day — check it isn't still unstarted. MATH 225 Assignment 1 (ungraded practice) due Fri. No MATH 112 lecture Thu or Fri this week — that time's freed up for study.",
      due:{
        Thu:[{text:"BIOL Pre-Lab Quiz #1 due (Lab 1A)", weight:2}],
        Fri:[
          {text:"MATH 225 Assignment 1 due (ungraded practice)", weight:5, graded:false},
          {text:"MATH 112 Homework 1 due (ungraded)", weight:5, graded:false},
        ],
      },
      overrides:[
        {day:"Thu", match:"MATH 225 — Tutorial", flag:true, append:" — Quiz 1", weight:10},
        {day:"Thu", match:"MATH 112", cancel:true},
        {day:"Fri", match:"MATH 112", cancel:true},
        {day:"Thu", match:"BIOL 102 — Lab", cancel:true},
      ],
      dayOverrides:[
        // Volleyball/Ultimate don't start until next week — revert this week's
        // Thu evening and Sun evening back to the pre-sport routine.
        {day:"Thu", start:"17:20", end:"17:40", label:"Walk home", cat:"commute"},
        {day:"Thu", start:"17:40", end:"18:10", label:"Dinner", cat:"meal"},
        {day:"Thu", start:"18:10", end:"19:30", label:"Study block", cat:"study"},
        {day:"Thu", start:"19:30", end:"24:00", label:"Going out (until 1am)", cat:"downtime"},
        {day:"Sun", start:"19:00", end:"21:30", label:"Protected downtime", cat:"downtime"},
        {day:"Sun", start:"21:30", end:"24:00", label:"Wind-down", cat:"sleep"},
      ],
      crunch:false },

    { id:"w3", label:"Wk 3 · Sep 21", range:"Sep 21–27", dates:weekDates(2026,8,21),
      note:"BIOL-heavy: <b>Lab 1B</b> in-person, <b>Lecture Quiz 1</b> due Fri, and the first <b>DSM batch (1–7)</b> due Sat. MATH 225 Assignment 2 (ungraded practice) also due Fri. MATH 225 Tutorial is cancelled this week.",
      due:{
        Mon:[{text:"PHYS 242 Problem Set 1 due", weight:2}],
        Thu:[{text:"BIOL Lab 1B (in-person)", weight:4}],
        Fri:[
          {text:"BIOL Lecture Quiz 1 due", weight:5},
          {text:"MATH 225 Assignment 2 due (ungraded practice)", weight:5, graded:false},
          {text:"MATH 112 Homework 2 due (ungraded)", weight:5, graded:false},
        ],
        Sat:[{text:"BIOL DSMs 1–7 due", weight:2.67}],
      },
      overrides:[
        {day:"Thu", match:"BIOL 102 — Lab", flag:true, append:" (Lab 1B)", weight:4},
        {day:"Thu", match:"MATH 225 — Tutorial", cancel:true},
      ],
      dayOverrides:[
        // Mon Sep 21 comes before the first Ultimate game (Sun Sep 27), so the
        // later wake time that protects sleep after Ultimate isn't needed yet.
        {day:"Mon", start:"07:00", end:"07:30", label:"Get ready", cat:"break"},
        {day:"Mon", start:"07:30", end:"08:00", label:"Breakfast", cat:"meal"},
        {day:"Mon", start:"08:00", end:"12:30", label:"Study block", cat:"study"},
        // Volleyball's first game isn't until Oct 1 (week 4) — revert this
        // week's Thursday evening back to the pre-sport routine.
        {day:"Thu", start:"17:20", end:"17:40", label:"Walk home", cat:"commute"},
        {day:"Thu", start:"17:40", end:"18:10", label:"Dinner", cat:"meal"},
        {day:"Thu", start:"18:10", end:"21:30", label:"Study block", cat:"study"},
        {day:"Thu", start:"21:30", end:"22:30", label:"Wind-down", cat:"sleep"},
        // This week's actual Ultimate game: 7:30pm kickoff, 2x20min halves +
        // 2min halftime (42 min) + ~18 min social after, replacing the
        // placeholder block. Game time shifts week to week — update per-week.
        {day:"Sun", start:"19:30", end:"20:12", label:"Ultimate (Mixed Intermediate)", cat:"sport"},
        {day:"Sun", start:"20:12", end:"20:30", label:"Social time (post-game)", cat:"downtime"},
        {day:"Sun", start:"20:30", end:"20:45", label:"Walk home", cat:"commute"},
        {day:"Sun", start:"20:45", end:"21:30", label:"Protected downtime", cat:"downtime"},
        {day:"Sun", start:"21:30", end:"22:30", label:"Wind-down", cat:"sleep"},
      ],
      crunch:false },

    { id:"w4", label:"Wk 4 · Sep 28", range:"Sep 28–Oct 4", dates:weekDates(2026,8,28),
      note:"No classes Wednesday this week — that time's freed up for study. <b>MATH 112 Quiz 1</b> in class Thursday — shift extra review into Tue/Thu MATH 112 blocks. BIOL Pre-Lab Quiz #2 and the whole \"Stuff You Should Know\" bundle (Scavenger Hunt, Academics 101, Biosafety) are also due Thu — Biosafety needs ≥50% to unlock Labs 2B/2C.",
      due:{
        Mon:[
          {text:"PHYS 242 Problem Set 2 due", weight:2},
        ],
        Thu:[
          {text:"MATH 112 Quiz 1 (in class)", weight:15},
          {text:"BIOL Pre-Lab Quiz #2 due (Lab 2A)", weight:2},
          {text:"BIOL Scavenger Hunt due", weight:2},
          {text:"BIOL Academics 101 due", weight:1},
          {text:"BIOL Biosafety Quiz due (need ≥50% to unlock Labs 2B/2C)", weight:1},
        ],
        Fri:[
          {text:"MATH 225 Assignment 3 due (ungraded practice)", weight:5, graded:false},
          {text:"MATH 112 Homework 3 due (ungraded)", weight:5, graded:false},
        ],
      },
      overrides:[
        {day:"Thu", match:"MATH 112", flag:true, append:" — Quiz 1", weight:15},
        {day:"Wed", match:"PHYS 242 — Lecture", cancel:true},
        {day:"Wed", match:"MATH 225 — Lecture", cancel:true},
        {day:"Wed", match:"PHYS 242 — Tutorial", cancel:true},
        {day:"Wed", match:"BIOL 102 — Lecture", cancel:true},
        {day:"Thu", match:"BIOL 102 — Lab", cancel:true},
      ], crunch:false },

    { id:"w5", label:"Wk 5 · Oct 5", range:"Oct 5–11", dates:weekDates(2026,9,5),
      note:"<b>MATH 225 Quiz 2</b> (Oct 8) and <b>PHYS Quiz 1</b> (Oct 7) both land this week, plus BIOL Lab 2B in-person.",
      due:{
        Mon:[{text:"PHYS 242 Problem Set 3 due", weight:2}],
        Thu:[{text:"BIOL Lab 2B (in-person)", weight:4}],
        Fri:[
          {text:"MATH 225 Assignment 4 due (ungraded practice)", weight:5, graded:false},
          {text:"MATH 112 Homework 4 due (ungraded)", weight:5, graded:false},
        ],
        Sat:[{text:"BIOL DSMs 8–11 due", weight:1.52}],
      },
      overrides:[
        {day:"Wed", match:"PHYS 242 — Tutorial", flag:true, append:" — Quiz 1", weight:4},
        {day:"Thu", match:"MATH 225 — Tutorial", flag:true, append:" — Quiz 2", weight:10},
        {day:"Thu", match:"BIOL 102 — Lab", flag:true, append:" (Lab 2B)", weight:4},
      ],
      dayOverrides:[
        // This week's actual Volleyball game: 6:30-7:30pm, replacing the
        // wider placeholder block. Game time shifts week to week — update
        // per-week.
        {day:"Thu", start:"17:20", end:"18:20", label:"Study block", cat:"study"},
        {day:"Thu", start:"18:20", end:"18:30", label:"Walk to Volleyball", cat:"commute"},
        {day:"Thu", start:"18:30", end:"19:30", label:"Volleyball (Mixed Recreational)", cat:"sport"},
        {day:"Thu", start:"19:30", end:"19:45", label:"Walk home", cat:"commute"},
        {day:"Thu", start:"19:45", end:"20:15", label:"Dinner", cat:"meal"},
        {day:"Thu", start:"20:15", end:"21:30", label:"Study block", cat:"study"},
      ],
      crunch:false },

    { id:"rw", label:"Reading Week · Oct 12", range:"Oct 12–16", dates:weekDates(2026,9,12), noClasses:true,
      note:"No classes. Best week to fully catch up on BIOL DSMs/Anki, bank a PHYS problem set ahead, and start early review for the Week 6 crunch right after this.",
      due:{}, overrides:[], crunch:false },

    { id:"w6", label:"Wk 6 · Oct 19 ⚑", range:"Oct 19–25", dates:weekDates(2026,9,19),
      note:"<b>Worst single day of the term: three quizzes land Thu Oct 22</b> — MATH 225 Quiz 3, MATH 112 Quiz 2, and COGS 100 Quiz 1, all the same day. Plus BIOL Lecture Quiz 2 due Fri and BIOL Lab 2C in-person. Build slack into the weekend before, not the days of.",
      due:{
        Mon:[{text:"PHYS 242 Problem Set 4 due", weight:2}],
        Fri:[
          {text:"BIOL Lecture Quiz 2 due", weight:5},
          {text:"MATH 225 Assignment 5 due (ungraded practice)", weight:5, graded:false},
          {text:"MATH 112 Homework 5 due (ungraded)", weight:5, graded:false},
        ],
      },
      overrides:[
        {day:"Thu", match:"COGS 100", flag:true, append:" — Quiz 1", weight:20},
        {day:"Thu", match:"MATH 112", flag:true, append:" — Quiz 2", weight:15},
        {day:"Thu", match:"MATH 225 — Tutorial", flag:true, append:" — Quiz 3", weight:10},
        {day:"Thu", match:"BIOL 102 — Lab", flag:true, append:" (Lab 2C)", weight:4},
      ], crunch:true },

    { id:"w7", label:"Wk 7 · Oct 26 ⚑", range:"Oct 26–Nov 1", dates:weekDates(2026,9,26),
      note:"<b>PHYS 242 Midterm</b>, Wed Oct 28 — two 45-min parts, one in the lecture slot and one in the tutorial slot. Give Wednesday's long morning and the weekend before entirely to PHYS. BIOL DSMs due Sat.",
      due:{
        Sat:[{text:"BIOL DSMs 12,13,21 due", weight:1.14}],
        Thu:[{text:"BIOL Pre-Lab Quiz #3 due (Lab 3A)", weight:2}],
        Fri:[
          {text:"MATH 225 Assignment 6 due (ungraded practice)", weight:5, graded:false},
          {text:"MATH 112 Homework 6 due (ungraded)", weight:5, graded:false},
        ],
      },
      overrides:[
        {day:"Wed", match:"PHYS 242 — Lecture", exam:true, newLabel:"PHYS 242 — MIDTERM (Part 1)", weight:20},
        {day:"Wed", match:"PHYS 242 — Tutorial", exam:true, newLabel:"PHYS 242 — MIDTERM (Part 2)", weight:20},
        {day:"Thu", match:"BIOL 102 — Lab", cancel:true},
      ], crunch:true },

    { id:"w8", label:"Wk 8 · Nov 2 ⚑", range:"Nov 2–8", dates:weekDates(2026,10,2),
      note:"<b>Three graded items inside 3 days:</b> the COGS 100 Memory Test (Nov 2 — window's been open since Oct 26), MATH 225 Quiz 4 (Nov 5), and the <b>BIOL 102 Midterm (Sat Nov 7, 11am–1pm)</b>. Saturday afternoon is recovery, not study time.",
      due:{
        Mon:[{text:"COGS 100 Memory Test due (window open since Oct 26)", weight:5}],
        Sat:[{text:"BIOL 102 MIDTERM · 11am–1pm", weight:20}],
        Fri:[
          {text:"MATH 225 Assignment 7 due (ungraded practice)", weight:5, graded:false},
        ],
      },
      overrides:[
        {day:"Thu", match:"BIOL 102 — Lab", flag:true, append:" (Lab 3B)", weight:4},
        {day:"Thu", match:"MATH 225 — Tutorial", flag:true, append:" — Quiz 4", weight:10},
      ],
      satOverride:{start:"11:00", end:"13:00", label:"BIOL 102 — MIDTERM EXAM", cat:"exam", weight:20},
      crunch:true },

    { id:"w9", label:"Wk 9 · Nov 9", range:"Nov 9–15", dates:weekDates(2026,10,9),
      note:"PHYS Quiz 2 (Wed tutorial) falls this week.",
      due:{
        Mon:[{text:"PHYS 242 Problem Set 5 due", weight:2}],
        Fri:[
          {text:"MATH 225 Assignment 8 due (ungraded practice)", weight:5, graded:false},
        ],
        Sat:[{text:"BIOL DSMs 16–17 due", weight:0.76}],
      },
      overrides:[
        {day:"Wed", match:"PHYS 242 — Tutorial", flag:true, append:" — Quiz 2", weight:4},
        {day:"Thu", match:"BIOL 102 — Lab", cancel:true},
      ], crunch:false },

    { id:"w10", label:"Wk 10 · Nov 16", range:"Nov 16–22", dates:weekDates(2026,10,16),
      note:"MATH 225 Quiz 5 lands the same day (Thu Nov 19) as BIOL Pre-Lab Quiz #4 — a real collision even though the week looks light otherwise. BIOL Lecture Quiz 3 also opens this week (window Mon Nov 16 – Fri Nov 20).",
      due:{
        Mon:[{text:"PHYS 242 Problem Set 6 due", weight:2}],
        Thu:[{text:"BIOL Pre-Lab Quiz #4 due (Lab 4A)", weight:2}],
        Fri:[
          {text:"BIOL Lecture Quiz 3 due (window open since Nov 16)", weight:5},
          {text:"MATH 225 Assignment 9 due (ungraded practice)", weight:5, graded:false},
        ],
      },
      overrides:[
        {day:"Thu", match:"MATH 225 — Tutorial", flag:true, append:" — Quiz 5", weight:10},
        {day:"Thu", match:"BIOL 102 — Lab", cancel:true},
      ], crunch:false },

    { id:"w11", label:"Wk 11 · Nov 23 ⚑", range:"Nov 23–29", dates:weekDates(2026,10,23),
      note:"<b>Hardest week of the term.</b> PHYS Quiz 3 (Wed), MATH 112 Quiz 3 &amp; COGS 100 Quiz 2 both Thu, then Fri brings the COGS tutorial (time TBC) plus its Finite State Machine and Logical Models assignment due same-day (no separate window, unlike the Memory Test), BIOL Lab 4B in-person, BIOL DSMs due Sat. Start review for the Nov 25–26 assessments the weekend before — there isn't enough room inside this week alone.",
      due:{
        Mon:[{text:"PHYS 242 Problem Set 7 due", weight:2}],
        Fri:[
          {text:"COGS 100 tutorial (time TBC)", weight:0},
          {text:"COGS 100 Finite State Machine and Logical Models due (same day, no separate window)", weight:5},
          {text:"MATH 225 Assignment 10 due (ungraded practice)", weight:5, graded:false},
        ],
        Sat:[{text:"BIOL DSMs 18,20 due", weight:0.76}],
      },
      overrides:[
        {day:"Wed", match:"PHYS 242 — Tutorial", flag:true, append:" — Quiz 3", weight:4},
        {day:"Thu", match:"MATH 112", flag:true, append:" — Quiz 3", weight:15},
        {day:"Thu", match:"COGS 100", flag:true, append:" — Quiz 2", weight:20},
        {day:"Thu", match:"BIOL 102 — Lab", flag:true, append:" (Lab 4B)", weight:4},
      ], crunch:true },

    { id:"w12", label:"Wk 12 · Nov 30", range:"Nov 30–Dec 4", dates:weekDates(2026,10,30),
      note:"MATH 225 Quiz 6 (Dec 3, the last one — best 4 of 6 count) lands right before BIOL closes out its term work: Lecture Quiz 4 (Fri) and the final DSM batch (Sat). Final exam dates should be posted on SOLUS by now — once confirmed, come back and block review time in the Sunday planning slot.",
      due:{
        Mon:[{text:"PHYS 242 Problem Set 8 due", weight:2}],
        Fri:[
          {text:"BIOL Lecture Quiz 4 due", weight:5},
          {text:"MATH 225 Assignment 11 due (ungraded practice)", weight:5, graded:false},
        ],
        Sat:[{text:"BIOL DSMs 19,14,15 due", weight:1.14}],
      },
      overrides:[
        {day:"Thu", match:"MATH 225 — Tutorial", flag:true, append:" — Quiz 6", weight:10},
        {day:"Thu", match:"BIOL 102 — Lab", cancel:true},
      ], crunch:false },

    { id:"w13", label:"Study week · Dec 7", range:"Dec 7–13", dates:weekDates(2026,11,7), noClasses:true,
      note:"No classes except a <b>PHYS 242 extra review session</b> Tue Dec 8 — one hour in the lecture slot, one hour in the tutorial slot, run on the Wednesday schedule. Otherwise fully open for exam prep — see the catch-up plan for each day's focus.",
      due:{}, overrides:[],
      dayOverrides:[
        {day:"Tue", start:"12:20", end:"13:20", label:"PHYS 242 — Review Session (Lecture slot)", cat:"class", location:"Stirling Hall AUD"},
        {day:"Tue", start:"14:20", end:"15:20", label:"PHYS 242 — Review Session (Tutorial slot)", cat:"class", location:"Mackintosh-Corry Hall B201"},
      ],
      crunch:true },

    { id:"examwk1", label:"Exam Period · Dec 14", range:"Dec 14–20", dates:weekDates(2026,11,14), noClasses:true,
      note:"<b>BIOL 102 Final</b> Wed Dec 16, 9–11am. <b>MATH 225 Final</b> Fri Dec 18, 2–5pm (60% final weight — top priority). <b>MATH 112 Final</b> Sat Dec 19, 9am–12pm (55% final weight + the 38% pass floor).",
      due:{}, overrides:[],
      dayOverrides:[
        {day:"Wed", start:"09:00", end:"11:00", label:"BIOL 102 — FINAL EXAM", cat:"exam"},
        {day:"Fri", start:"14:00", end:"17:00", label:"MATH 225 — FINAL EXAM", cat:"exam"},
        {day:"Sat", start:"09:00", end:"12:00", label:"MATH 112 — FINAL EXAM", cat:"exam"},
      ],
      crunch:true },

    { id:"examwk2", label:"Exam Period · Dec 21", range:"Dec 21–27", dates:weekDates(2026,11,21), noClasses:true,
      note:"<b>COGS 100 Final</b> Tue Dec 22, 9am–12pm (50% final weight). <b>PHYS 242 Final</b> same day, Tue Dec 22, 2–5pm (45% final weight) — two finals, one day; plan the morning/afternoon split in advance.",
      due:{}, overrides:[],
      dayOverrides:[
        {day:"Tue", start:"09:00", end:"12:00", label:"COGS 100 — FINAL EXAM", cat:"exam"},
        {day:"Tue", start:"14:00", end:"17:00", label:"PHYS 242 — FINAL EXAM", cat:"exam"},
      ],
      crunch:true },
  ];

  // Real final exam dates/times from SOLUS:
  // BIOL102 Dec16 9-11am, MATH225 Dec18 2-5pm, MATH112 Dec19 9am-12pm,
  // COGS100 Dec22 9am-12pm, PHYS242 Dec22 2-5pm.
  const examDates = {
    BIOL102: new Date(2026,11,16),
    COGS100: new Date(2026,11,22),
    MATH112: new Date(2026,11,19),
    MATH225: new Date(2026,11,18),
    PHYS242: new Date(2026,11,22),
  };

  const COURSE_NAMES = { BIOL102:"BIOL 102", COGS100:"COGS 100", MATH112:"MATH 112", MATH225:"MATH 225", PHYS242:"PHYS 242" };
  const COURSE_COLOR = { BIOL102:"sport", COGS100:"commute", MATH112:"study", MATH225:"meal", PHYS242:"sleep" };
  // % of final grade each course's final exam is worth (per course syllabus).
  const FINAL_WEIGHT = { BIOL102:20, COGS100:50, MATH112:55, MATH225:60, PHYS242:45 };

  // ---- recurring weekly/daily habits ----
  // weekStart is a DAYS index (0=Mon..6=Sun): each course's "week" for habit
  // purposes resets on that weekday, not necessarily calendar Monday (PHYS 242's
  // runs Wed-to-Wed).
  const WEEKLY_HABITS = [
    { course:"BIOL102", weekStart:0, text:"Watch this week's pre-recorded lecture videos before the matching in-person lecture — the in-person session is built to review/expand on them, not introduce material cold", minutes:30 },
    { course:"BIOL102", weekStart:0, text:"On lab weeks: start the online pre-lab quiz (opens Mon 12:01am, due Thu 11:59pm, untimed) — budget under 2 hrs, don't leave it to Thursday night", minutes:45 },
    { course:"BIOL102", weekStart:0, text:"Clear any newly-landed DSM batch now rather than saving it up — untimed, retry-until-correct, meant to be low-stakes", minutes:20 },
    { course:"PHYS242", weekStart:2, text:"Read the matching section of course notes before each upcoming lecture (15–20 min per lecture, per the syllabus)", minutes:20 },
    { course:"PHYS242", weekStart:2, text:"After each lecture: turn your notes into 8–12 new Anki cards while it's fresh — writing them yourself is what makes them work", minutes:20 },
    { course:"PHYS242", weekStart:2, text:"Blank-page re-derive one of this week's key results, notes closed — the single highest-leverage PHYS habit, since exams test derivation/explanation over recall", minutes:40 },
    { course:"MATH225", weekStart:0, text:"Blank-page derivation practice on this week's main result, timed, then compare line-by-line against the source", minutes:30 },
    { course:"MATH225", weekStart:0, text:"Any new ungraded assignment: do it closed-book, timed to ~30 min, as quiz rehearsal rather than homework to just complete", minutes:30 },
    { course:"MATH225", weekStart:0, text:"Update the error log — for anything \"explain/prove/does this contradict\" style, write the full explanation in sentences (Anki can't touch this skill)", minutes:20 },
    { course:"MATH112", weekStart:0, text:"When new weekly notes post (the only required source — no recordings): read once for the throughline before anything else", minutes:20 },
    { course:"MATH112", weekStart:0, text:"Add new definitions, theorem statements, and worked-example results to Anki", minutes:15 },
    { course:"MATH112", weekStart:0, text:"Attempt this week's homework problems cold, in writing, before solutions post — quizzes mirror homework closely, this is the highest-leverage MATH 112 habit", minutes:60 },
    { course:"MATH112", weekStart:0, text:"Once solutions post: grade yourself honestly, then redo anything wrong from a blank page a few days later", minutes:30 },
    { course:"MATH112", weekStart:0, text:"Add to the \"proof techniques\" reference page — recurring argument patterns you keep running into", minutes:15 },
    { course:"COGS100", weekStart:0, text:"Read/watch new slides once, actively, then turn the material into that week's glossary section + Anki cards", minutes:25 },
    { course:"COGS100", weekStart:0, text:"Import new cards into this week's subdeck; bump new-cards/day briefly to clear them, then back to baseline", minutes:10 },
    { course:"COGS100", weekStart:0, text:"After a couple of review passes on this week's cards, do a quick explain-it-back check rather than trusting recognition alone", minutes:15 },
  ];
  const DAILY_HABITS = [
    { course:"BIOL102", text:"Anki review — BIOL 102 deck", minutes:12 },
    { course:"COGS100", text:"Anki review — COGS 100 deck", minutes:12 },
    { course:"MATH112", text:"Anki review — MATH 112 deck", minutes:12 },
    { course:"MATH225", text:"Anki review — MATH 225 deck", minutes:12 },
    { course:"PHYS242", text:"Anki review — PHYS 242 deck", minutes:12 },
  ];

  // ---- study-block task breakdown ----
  // Real, specific prep tasks per deadline id, as given directly. Anything not
  // listed here falls back to genericTasks() in engine.js.
  const PHYS_PS_TASKS = [
    { text:"Attempt every problem yourself first, before any AI help", minutes:60 },
    { text:"Work through remaining sticking points with AI as a tutor — ask it to explain steps, don't ask for the answer", minutes:40 },
    { text:"Save/submit the chat session per the course's format", minutes:10 },
  ];
  const TASKS = {
    "ov-w2|MATH225|quiz|MATH 225 — Tutorial — Quiz 1": [
      { text:"Review classification of ODEs (order, linearity, homogeneous vs. non-homogeneous)", minutes:20 },
      { text:"Practice separable first-order equations from Assignment 1 (and 2, if posted) — do them solo, not just read the solutions", minutes:40 },
      { text:"Skim Week 1–2 course notes for anything not covered above", minutes:15 },
    ],
    "due-w2-Thu-0": [
      { text:"Complete the online pre-lab activity for Lab 1A — not started as of the day before, don't leave it to the last minute", minutes:20 },
    ],
    "due-w2-Fri-0": [
      { text:"Complete MATH 225 Assignment 1 closed-book, timed to ~30 min, as quiz rehearsal rather than homework to just finish", minutes:30 },
    ],
    "due-w3-Fri-1": [
      { text:"Complete MATH 225 Assignment 2 closed-book, timed to ~30 min, as quiz rehearsal rather than homework to just finish", minutes:30 },
    ],
    "due-w3-Thu-0": [
      { text:"Review Lab 1A pre-lab notes on scientific inquiry / the experimental method", minutes:15 },
    ],
    "due-w3-Fri-0": [
      { text:"Watch/review lecture: An Introduction to Biology (hypothesis testing, experimental method)", minutes:30 },
      { text:"Watch/review lecture: Biological Chemistry (atomic/molecular structure, water, carbon chemistry)", minutes:30 },
      { text:"Review structure/function of the four macromolecule classes (lipids, carbs, nucleic acids, proteins) — densest part of the unit", minutes:30 },
      { text:"Practice questions on MasteringBiology if available — focus on why/how, not just definitions", minutes:20 },
    ],
    "due-w3-Sat-0": [
      { text:"MasteringBiology DSMs 1–3", minutes:30 },
      { text:"MasteringBiology DSMs 4–5", minutes:30 },
      { text:"MasteringBiology DSMs 6–7", minutes:30 },
    ],
    "due-w3-Mon-0": PHYS_PS_TASKS,
    "due-w4-Mon-0": PHYS_PS_TASKS,
    "due-w5-Mon-0": PHYS_PS_TASKS,
    "due-w6-Mon-0": PHYS_PS_TASKS,
    "due-w9-Mon-0": PHYS_PS_TASKS,
    "due-w10-Mon-0": PHYS_PS_TASKS,
    "due-w11-Mon-0": PHYS_PS_TASKS,
    "due-w12-Mon-0": PHYS_PS_TASKS,
    "due-w4-Thu-0": [
      { text:"Redo Homework Sets 1 and 2 fully on your own — quiz is \"mainly from homework sets 1 and 2\" per the syllabus", minutes:60 },
      { text:"Review Week 1–4 course notes", minutes:30 },
    ],
    "due-w4-Thu-1": [
      { text:"Complete the online pre-lab activity for Lab 2A", minutes:15 },
    ],
    "due-w4-Thu-2": [
      { text:"Complete the Scavenger Hunt", minutes:20 },
    ],
    "due-w4-Thu-3": [
      { text:"Complete Academics 101 — the Academic Integrity portion specifically reappears on the final", minutes:15 },
    ],
    "due-w4-Thu-4": [
      { text:"Attempt the Biosafety Quiz — need ≥50% to unlock Labs 2B/2C, retry if you don't clear it", minutes:15 },
    ],
    "ov-w5|MATH225|quiz|MATH 225 — Tutorial — Quiz 2": [
      { text:"Review exact equations and integrating factors (next technique after separable equations) — inferred sequencing, confirm against your actual notes", minutes:30 },
      { text:"Redo the relevant assignment(s) posted since Quiz 1", minutes:40 },
      { text:"Quick review of Quiz 1 topics, since the rolling-window rule means some overlap", minutes:15 },
    ],
    "ov-w6|MATH225|quiz|MATH 225 — Tutorial — Quiz 3": [
      { text:"Review exact equations and integrating factors", minutes:25 },
      { text:"Review constant-coefficient homogeneous ODEs with distinct real roots", minutes:25 },
      { text:"Redo the relevant assignment(s) posted since Quiz 2", minutes:30 },
    ],
    "ov-w8|MATH225|quiz|MATH 225 — Tutorial — Quiz 4": [
      { text:"Review complex numbers", minutes:15 },
      { text:"Review general constant-coefficient homogeneous ODEs", minutes:25 },
      { text:"Review the method of undetermined coefficients", minutes:25 },
      { text:"Redo the relevant assignment(s) posted since Quiz 3", minutes:30 },
    ],
    "ov-w10|MATH225|quiz|MATH 225 — Tutorial — Quiz 5": [
      { text:"Laplace transform: definition and basic properties", minutes:25 },
      { text:"Solving homogeneous and inhomogeneous constant-coefficient ODEs via Laplace transform, partial fractions (not repeated complex roots)", minutes:40 },
      { text:"Memorise the formula list from the onQ announcement \"What you are expected to memorise about the Laplace transform\" (Nov 5)", minutes:20 },
      { text:"Practice: Assignments 8 and 9, textbook 7.3–7.5", minutes:40 },
    ],
    "ov-w12|MATH225|quiz|MATH 225 — Tutorial — Quiz 6": [
      { text:"Review systems of linear ODEs: definitions and basic properties", minutes:25 },
      { text:"Review eigenvalues and eigenvectors", minutes:30 },
      { text:"Practice: Assignments 9–11, textbook 9.4", minutes:40 },
    ],
    "ov-w5|PHYS242|quiz|PHYS 242 — Tutorial — Quiz 1": [
      { text:"Review Einstein's Postulates, time dilation, length contraction, simultaneity (Week 3)", minutes:25 },
      { text:"Review Lorentz Transformation properties, spacetime intervals, causality, Doppler shift (Week 4)", minutes:25 },
      { text:"Practice 2–3 spacetime-diagram problems", minutes:30 },
    ],
    "due-w5-Thu-0": [
      { text:"Review the Lab 2A online pre-lab activity on \"Conducting an Experiment\" before your session", minutes:15 },
    ],
    "due-w5-Sat-0": [
      { text:"MasteringBiology DSMs 8–9", minutes:30 },
      { text:"MasteringBiology DSMs 10–11", minutes:30 },
    ],
    "ov-w6|MATH112|quiz|MATH 112 — Quiz 2": [
      { text:"Review Week 5–6 course notes (newest material since Quiz 1)", minutes:30 },
      { text:"Redo Homework Sets 3–4", minutes:50 },
      { text:"Quick cumulative review of Weeks 1–4 — quiz isn't cumulative per the syllabus, but the underlying skills build on each other", minutes:20 },
    ],
    "ov-w6|COGS100|quiz|COGS 100 — Quiz 1": [
      { text:"Review Unit 1: Cognitive Science as a multidisciplinary field, cognitive theory, the Turing Machine / mind-as-computation", minutes:20 },
      { text:"Review Unit 2: perspectives on mind from philosophy, psychology, neuroscience, linguistics, anthropology, and AI", minutes:30 },
      { text:"Review Unit 3 (started): mental representations — logic/rule-based systems, concepts, analogy", minutes:30 },
    ],
    "due-w6-Fri-0": [
      { text:"Review cell structure/organization: prokaryotic vs. eukaryotic cells, organelle structure/function", minutes:30 },
      { text:"Review membrane structure/function: transport mechanisms, tonicity, diffusion, osmosis, active vs. passive transport, endo/exocytosis", minutes:30 },
      { text:"Review enzymology and metabolism: cellular respiration (glycolysis, citric acid cycle, electron transport), fermentation", minutes:30 },
      { text:"Practice questions on MasteringBiology", minutes:20 },
    ],
    "ov-w6|BIOL102|lab|BIOL 102 — Lab (Lab 2C)": [
      { text:"Review your Lab 2B results/notes before this session", minutes:10 },
    ],
    "ov-w7|PHYS242|exam|PHYS 242 — MIDTERM": [
      { text:"Full relativity review: reference frames, Galilean relativity, spacetime diagrams (Wk1)", minutes:25 },
      { text:"Classical waves, speed of light (Wk2)", minutes:15 },
      { text:"Einstein's postulates, time dilation, length contraction, simultaneity (Wk3)", minutes:25 },
      { text:"Lorentz transformation, spacetime intervals, causality, Doppler shift (Wk4)", minutes:25 },
      { text:"Relativistic momentum, energy, dynamics (Wk5)", minutes:25 },
      { text:"Waves, EM waves, wave nature of light (Wk6)", minutes:20 },
      { text:"Redo 2–3 problems from each weekly problem set so far under timed conditions", minutes:60 },
      { text:"Formula sheet drill — one is provided on the exam, know where everything is on it", minutes:20 },
    ],
    "due-w7-Thu-0": [
      { text:"Complete the pre-lab activity/quiz for \"Working with Data\"", minutes:40 },
    ],
    "due-w7-Sat-0": [
      { text:"Work through DSMs 12, 13, 21", minutes:40 },
    ],
    "due-w8-Sat-0": [
      { text:"Section 1 review: intro to biology + biological chemistry (atoms, water, carbon, macromolecules)", minutes:30 },
      { text:"Section 2 review: cell structure/organization", minutes:25 },
      { text:"Membranes and transport", minutes:25 },
      { text:"Enzymology, metabolism, cellular respiration", minutes:30 },
      { text:"Photosynthesis: chloroplast structure, light reactions, Calvin cycle, C3/C4/CAM variations", minutes:30 },
      { text:"Cell communication: receptors, signal transduction, hormone signalling, apoptosis", minutes:25 },
      { text:"Practice applied (not just recall) questions — this exam emphasizes application over memorization per the syllabus", minutes:40 },
    ],
    "ov-w8|BIOL102|lab|BIOL 102 — Lab (Lab 3B)": [
      { text:"Review your Lab 3A pre-lab notes before this session", minutes:15 },
    ],
    "due-w8-Mon-0": [
      { text:"Review the mental-representations / memory material this test builds on", minutes:25 },
      { text:"Complete the Memory Test — window's been open since Oct 26, don't leave it to the deadline", minutes:45 },
    ],
    "ov-w9|PHYS242|quiz|PHYS 242 — Tutorial — Quiz 2": [
      { text:"Relativistic momentum, energy, dynamics (Wk5)", minutes:20 },
      { text:"Waves, EM waves (Wk6)", minutes:15 },
      { text:"Blackbody radiation, Planck's Law (Wk7)", minutes:25 },
      { text:"Particle nature of light, Compton scattering (Wk8)", minutes:25 },
    ],
    "due-w10-Fri-0": [
      { text:"Review DNA structure and replication (Ch 16): nucleotides, the double helix, replication, telomeres", minutes:30 },
      { text:"Review transcription and translation (Ch 17): central dogma, RNA types, the genetic code", minutes:35 },
      { text:"Practice questions on MasteringBiology", minutes:20 },
    ],
    "due-w9-Sat-0": [
      { text:"Work through DSMs 16–17", minutes:25 },
    ],
    "due-w10-Thu-0": [
      { text:"Complete the pre-lab activity/quiz for \"Biotech Applications\"", minutes:40 },
    ],
    "ov-w11|PHYS242|quiz|PHYS 242 — Tutorial — Quiz 3": [
      { text:"Particle nature of matter, atomic spectra, Bohr model (Wk9)", minutes:25 },
      { text:"Matter waves, wave-particle duality, Heisenberg Uncertainty (Wk10)", minutes:25 },
      { text:"Quantum mechanics postulates (Wk11)", minutes:25 },
    ],
    "ov-w11|MATH112|quiz|MATH 112 — Quiz 3": [
      { text:"Get a head start during Week 10 if you can: skim Homework Sets 5–6", minutes:30 },
      { text:"Redo Homework Sets 5 and 6 fully — mainly covers kernel/image, rank–nullity, composition, matrix multiplication", minutes:60 },
      { text:"Review Week 9–11 course notes on the above topics", minutes:30 },
    ],
    "ov-w11|COGS100|quiz|COGS 100 — Quiz 2": [
      { text:"Unit 3: logic, rules, concepts, analogy, imagery, connections, mental models", minutes:35 },
      { text:"Unit 4 so far: vision / object recognition / attention", minutes:25 },
      { text:"Unit 4 so far: memory", minutes:25 },
    ],
    "ov-w11|BIOL102|lab|BIOL 102 — Lab (Lab 4B)": [
      { text:"Review your Lab 4A pre-lab notes before this session", minutes:15 },
    ],
    "due-w11-Fri-1": [
      { text:"Review Weeks 8–11 mental-models/cognitive-modeling material this assignment builds on", minutes:20 },
      { text:"Complete the Finite State Machine and Logical Models assignment — no separate window, due same day as the tutorial", minutes:60 },
    ],
    "due-w11-Sat-0": [
      { text:"Work through DSMs 18, 20", minutes:25 },
    ],
    "due-w12-Fri-0": [
      { text:"Gene regulation: transcription factors, operons, eukaryotic transcription, epigenetics", minutes:30 },
      { text:"Mutation and cell cycle regulation: DNA repair, checkpoints, cancer, oncogenes", minutes:25 },
      { text:"Chromosomes, cell division, meiosis", minutes:25 },
      { text:"Inheritance: Mendel's laws, gene linkage, epigenetic effects", minutes:25 },
      { text:"Developmental genetics + genetic technology (cloning, PCR, DNA fingerprinting, gene therapy)", minutes:25 },
      { text:"Practice questions on MasteringBiology", minutes:20 },
    ],
    "due-w12-Sat-0": [
      { text:"Work through the last three DSMs (19, 14, 15)", minutes:20 },
    ],
    "final-MATH112": [
      { text:"Comprehensive review of all course notes and Homework Sets 1–6 — this is your highest-risk exam: 55% weight plus a 38% pass floor regardless of quiz grades", minutes:90 },
      { text:"Extra focus on Weeks 7–12 material, per the syllabus's own emphasis", minutes:60 },
    ],
    "final-MATH225": [
      { text:"Review first-order ODEs: linear, separable, exact, integrating factors", minutes:40 },
      { text:"Review complex numbers and constant-coefficient linear ODEs, including undetermined coefficients", minutes:40 },
      { text:"Review the Laplace transform and partial fractions", minutes:40 },
      { text:"Review systems of linear ODEs, eigenvalues, and the matrix exponential", minutes:40 },
    ],
    "final-COGS100": [
      { text:"Full pass on Units 1–2 (60% of the final is multiple choice/fill-in across the whole course — Quiz 1's 72.5% showed these are the weak spot)", minutes:50 },
      { text:"Comprehensive review across all 12 weeks / 5 units for the multiple-choice/fill-in portion", minutes:60 },
      { text:"Short-answer and long-answer practice (40% of the final combined) — both drawn from Units 3–5 specifically", minutes:60 },
    ],
    "final-PHYS242": [
      { text:"Comprehensive review of relativity (Weeks 1–6)", minutes:60 },
      { text:"Comprehensive review of quantum theory (Weeks 7–12) — the midterm already tested relativity once, don't under-review it just because it's \"done\"", minutes:60 },
      { text:"Note: the photoelectric effect is NOT assessed. For Compton scattering, understand the derivation method rather than memorising it", minutes:15 },
    ],
    "final-BIOL102": [
      { text:"Review all of Dr. Regan's material — Weeks 7–12, genetics (Dr. Yates's Weeks 1–6 material was the midterm and isn't retested)", minutes:90 },
      { text:"Review the Academic Integrity portion of Academics 101 — it reappears on the final", minutes:15 },
    ],
  };

  // ---- grade tracker: per-course categories of gradeable items. Most items
  // link to an existing deadline (dueId) so their weight/date come from one
  // source of truth; a few (Participation) have no due date and carry their
  // own weight. An item's `grade` field is the real, already-known mark from
  // the student's actual gradebook — baked in here (not localStorage) so it
  // shows the same on every device. Anything still grey/estimated in her
  // gradebook (not yet officially graded back) is left without a `grade`
  // here; the Grades tab's localStorage entry (per-device) is for the
  // student to fill in once a real mark comes back, and always overrides
  // this default if both are present.
  const GRADES = {
    BIOL102: [
      { name:"Lab Quizzes", items:[
        { label:"Pre-Lab Quiz #1", dueId:"due-w2-Thu-0", grade:100 },
        { label:"Pre-Lab Quiz #2", dueId:"due-w4-Thu-1", grade:87.5 },
        { label:"Pre-Lab Quiz #3", dueId:"due-w7-Thu-0", grade:100 },
        { label:"Pre-Lab Quiz #4", dueId:"due-w10-Thu-0" },
        { label:"Scavenger Hunt", dueId:"due-w4-Thu-2", grade:86 },
        { label:"Academics 101", dueId:"due-w4-Thu-3", grade:100 },
        { label:"Biosafety Quiz", dueId:"due-w4-Thu-4", grade:100 },
      ]},
      { name:"Lab Assignments", items:[
        { label:"Lab 1B", dueId:"due-w3-Thu-0", grade:87.5 },
        { label:"Lab 2B", dueId:"due-w5-Thu-0", grade:100 },
        { label:"Lab 2C", dueId:"ov-w6|BIOL102|lab|BIOL 102 — Lab (Lab 2C)", grade:100 },
        { label:"Lab 3B", dueId:"ov-w8|BIOL102|lab|BIOL 102 — Lab (Lab 3B)" },
        { label:"Lab 4B", dueId:"ov-w11|BIOL102|lab|BIOL 102 — Lab (Lab 4B)" },
      ]},
      { name:"Lecture Quizzes", items:[
        { label:"Lecture Quiz 1", dueId:"due-w3-Fri-0", grade:95 },
        { label:"Lecture Quiz 2", dueId:"due-w6-Fri-0", grade:100 },
        { label:"Lecture Quiz 3", dueId:"due-w10-Fri-0" },
        { label:"Lecture Quiz 4", dueId:"due-w12-Fri-0" },
      ]},
      { name:"DSMs", items:[
        { label:"DSMs 1–7", dueId:"due-w3-Sat-0", grade:100 },
        { label:"DSMs 8–11", dueId:"due-w5-Sat-0", grade:100 },
        { label:"DSMs 12,13,21", dueId:"due-w7-Sat-0", grade:100 },
        { label:"DSMs 16–17", dueId:"due-w9-Sat-0" },
        { label:"DSMs 18,20", dueId:"due-w11-Sat-0" },
        { label:"DSMs 19,14,15", dueId:"due-w12-Sat-0" },
      ]},
      { name:"Exams", items:[
        { label:"Midterm", dueId:"due-w8-Sat-0" },
        { label:"Final Exam", dueId:"final-BIOL102" },
      ]},
    ],
    COGS100: [
      { name:"Quizzes", items:[
        { label:"Quiz 1", dueId:"ov-w6|COGS100|quiz|COGS 100 — Quiz 1", grade:72.5 },
        { label:"Quiz 2", dueId:"ov-w11|COGS100|quiz|COGS 100 — Quiz 2" },
      ]},
      { name:"Assignments/Tutorial", items:[
        { label:"Memory Test", dueId:"due-w8-Mon-0" },
        { label:"Finite State Machine and Logical Models", dueId:"due-w11-Fri-1" },
      ]},
      { name:"Final Exam", items:[
        { label:"Final Exam", dueId:"final-COGS100" },
      ]},
    ],
    MATH112: [
      { name:"Quizzes", items:[
        { label:"Quiz 1", dueId:"due-w4-Thu-0", grade:90.83 },
        { label:"Quiz 2", dueId:"ov-w6|MATH112|quiz|MATH 112 — Quiz 2", grade:81.67 },
        { label:"Quiz 3", dueId:"ov-w11|MATH112|quiz|MATH 112 — Quiz 3" },
      ]},
      { name:"Final Exam", items:[
        { label:"Final Exam", dueId:"final-MATH112" },
      ]},
    ],
    MATH225: [
      // Best 4 of 6 quizzes count — the two lowest are dropped.
      { name:"Quizzes", bestOf:{count:4, of:6}, items:[
        { label:"Quiz 1", dueId:"ov-w2|MATH225|quiz|MATH 225 — Tutorial — Quiz 1", grade:100 },
        { label:"Quiz 2", dueId:"ov-w5|MATH225|quiz|MATH 225 — Tutorial — Quiz 2", grade:91.67 },
        { label:"Quiz 3", dueId:"ov-w6|MATH225|quiz|MATH 225 — Tutorial — Quiz 3" },
        { label:"Quiz 4", dueId:"ov-w8|MATH225|quiz|MATH 225 — Tutorial — Quiz 4" },
        { label:"Quiz 5", dueId:"ov-w10|MATH225|quiz|MATH 225 — Tutorial — Quiz 5" },
        { label:"Quiz 6", dueId:"ov-w12|MATH225|quiz|MATH 225 — Tutorial — Quiz 6" },
      ]},
      { name:"Final Exam", items:[
        { label:"Final Exam", dueId:"final-MATH225" },
      ]},
    ],
    PHYS242: [
      { name:"Quizzes", items:[
        { label:"Tutorial Quiz 1", dueId:"ov-w5|PHYS242|quiz|PHYS 242 — Tutorial — Quiz 1", grade:90.83 },
        { label:"Tutorial Quiz 2", dueId:"ov-w9|PHYS242|quiz|PHYS 242 — Tutorial — Quiz 2" },
        { label:"Tutorial Quiz 3", dueId:"ov-w11|PHYS242|quiz|PHYS 242 — Tutorial — Quiz 3" },
      ]},
      { name:"Problem Sets", items:[
        { label:"Problem Set 1", dueId:"due-w3-Mon-0", grade:100 },
        { label:"Problem Set 2", dueId:"due-w4-Mon-0", grade:75 },
        { label:"Problem Set 3", dueId:"due-w5-Mon-0", grade:0 },
        { label:"Problem Set 4", dueId:"due-w6-Mon-0", grade:75 },
        { label:"Problem Set 5", dueId:"due-w9-Mon-0" },
        { label:"Problem Set 6", dueId:"due-w10-Mon-0" },
        { label:"Problem Set 7", dueId:"due-w11-Mon-0" },
        { label:"Problem Set 8", dueId:"due-w12-Mon-0" },
      ]},
      { name:"Participation", items:[
        { label:"Participation", weight:5 },
      ]},
      { name:"Exams", items:[
        { label:"Midterm", dueId:"ov-w7|PHYS242|exam|PHYS 242 — MIDTERM" },
        { label:"Final Exam", dueId:"final-PHYS242" },
      ]},
    ],
  };

  // ---- catch-up study plan: assigns a course + task to specific calendar
  // dates' open study blocks (buildDayBlocks splices these in — see
  // applyStudyPlan() in engine.js). Keyed by "YYYY-MM-DD". Each date holds up
  // to three slots (am/pm/eve), mapped onto that day's "study"-category
  // blocks in time order. Cells that just restate an exam/quiz/class event
  // already on the calendar (e.g. "MATH 225 FINAL 2-5", "Rest") are
  // deliberately left out — nothing to assign there.
  const STUDY_PLAN = {
    // Phase A: Nov 14-19 — MATH 225 Quiz 5 + BIOL Lecture Quiz 3
    "2026-11-14": {
      am:{course:"MATH225", task:"Laplace basics, transform table, Assignment 8"},
      pm:{course:"BIOL102", task:"DNA structure + replication (Ch 16, Regan slides)"},
    },
    "2026-11-15": {
      am:{course:"BIOL102", task:"DSMs 16–17 (grace ends Tue Nov 17)"},
      pm:{course:"PHYS242", task:"Problem Set 6 (due Mon)"},
      eve:{course:"MATH225", task:"Partial fractions, Assignment 9"},
    },
    "2026-11-16": {
      am:{course:"MATH225", task:"Laplace IVPs, mixed practice"},
      pm:{course:"BIOL102", task:"Transcription + translation (Ch 17)"},
      eve:{course:"COGS100", task:"U03 logic + rules slides"},
    },
    "2026-11-17": {
      am:{course:"MATH225", task:"Timed practice: textbook 7.5 problems"},
      pm:{course:"BIOL102", task:"Write Lecture Quiz 3"},
      eve:{course:"PHYS242", task:"W8 blackbody + Planck"},
    },
    "2026-11-18": {
      am:{course:"MATH225", task:"Formula list drill + quick redo of Quiz 4"},
      eve:{course:"MATH225", task:"Light final check"},
    },
    "2026-11-19": {
      am:{course:"COGS100", task:"U03 concepts + analogy"},
    },
    // Phase B: Nov 20-26 — PHYS Quiz 3, MATH 112 Quiz 3, COGS Quiz 2
    "2026-11-20": {
      am:{course:"COGS100", task:"U03 imagery, connections, mental models"},
    },
    "2026-11-21": {
      am:{course:"MATH112", task:"HW5 cold, in writing"},
      pm:{course:"MATH112", task:"HW6 cold, check vs solutions"},
    },
    "2026-11-22": {
      am:{course:"BIOL102", task:"Pre-lab/DSM catch-up"},
      pm:{course:"PHYS242", task:"W9 Compton + Bohr; Problem Set 7"},
      eve:{course:"COGS100", task:"U04 vision/attention"},
    },
    "2026-11-23": {
      am:{course:"PHYS242", task:"W10 matter waves + uncertainty"},
      pm:{course:"COGS100", task:"U04 memory"},
      eve:{course:"MATH112", task:"Ch 8 notes: kernel, image, rank–nullity"},
    },
    "2026-11-24": {
      am:{course:"PHYS242", task:"Quiz-style problems W8–W10"},
      pm:{course:"MATH112", task:"Redo HW5/6 mistakes"},
      eve:{course:"COGS100", task:"Explain-it-back on all Unit 3"},
    },
    "2026-11-25": {
      am:{course:"MATH112", task:"Timed mock quiz"},
      eve:{course:"COGS100", task:"Full Quiz 2 review"},
    },
    // Phase C: Nov 27-Dec 6 — rebuild MATH 225, Quiz 6, early reviews
    "2026-11-28": {
      am:{course:"MATH225", task:"First-order ODEs: linear, separable (text 5.2–5.4, A1–A2)"},
      pm:{course:"MATH225", task:"Exact + integrating factors (5.5, A3–A4)"},
    },
    "2026-11-29": {
      am:{course:"BIOL102", task:"DSMs 18, 20"},
      pm:{course:"PHYS242", task:"Problem Set 8"},
      eve:{course:"MATH225", task:"Complex numbers + char. polynomial (1.2, 6.4, A5)"},
    },
    "2026-11-30": {
      am:{course:"MATH225", task:"Undetermined coefficients (6.5, A6–A7)"},
      pm:{course:"BIOL102", task:"Latest Regan lectures"},
      eve:{course:"MATH225", task:"Systems + eigenvalues (9.4)"},
    },
    "2026-12-01": {
      am:{course:"MATH225", task:"Assignments 10–11"},
      pm:{course:"BIOL102", task:"Practice questions"},
      eve:{course:"PHYS242", task:"W11 Schrödinger intro"},
    },
    "2026-12-02": {
      am:{course:"MATH225", task:"Quiz 6 timed practice"},
      eve:{course:"BIOL102", task:"Lecture Quiz 4 prep"},
    },
    "2026-12-03": {
      am:{course:"COGS100", task:"Catch up latest slides"},
    },
    "2026-12-04": {
      am:{course:"BIOL102", task:"Write Lecture Quiz 4"},
    },
    "2026-12-05": {
      am:{course:"COGS100", task:"Units 1–2 full pass"},
      pm:{course:"PHYS242", task:"Relativity W1–5 review"},
    },
    "2026-12-06": {
      am:{course:"PHYS242", task:"Redo midterm under time"},
      pm:{course:"MATH112", task:"Ch 1–5 quiz-style redo"},
      eve:{course:"BIOL102", task:"DSMs 19, 14, 15"},
    },
    // Phase D: Dec 7-22 — finals
    "2026-12-07": {
      am:{course:"MATH225", task:"All past quizzes, timed"},
      pm:{course:"MATH112", task:"Ch 6–8"},
    },
    "2026-12-08": {
      am:{course:"MATH112", task:"Proof-writing drill"},
      pm:{course:"PHYS242", task:"Extra-day lecture + review"},
      eve:{course:"BIOL102", task:"Regan slides pass 1"},
    },
    "2026-12-09": {
      am:{course:"BIOL102", task:"Regan slides pass 2 + all practice Qs"},
      pm:{course:"MATH225", task:"Mixed assignment problems"},
    },
    "2026-12-10": {
      am:{course:"MATH112", task:"Full mock exam (3 h)"},
      pm:{course:"COGS100", task:"Units 3–5"},
    },
    "2026-12-11": {
      am:{course:"MATH225", task:"Full mock exam (3 h)"},
      pm:{course:"PHYS242", task:"Quantum W7–12"},
    },
    "2026-12-12": {
      am:{course:"BIOL102", task:"Weak spots"},
      pm:{course:"MATH112", task:"Weak spots"},
    },
    "2026-12-13": {
      am:{course:"COGS100", task:"Long-answer practice (Units 3–5)"},
      pm:{course:"MATH225", task:"Weak spots"},
    },
    "2026-12-14": {
      am:{course:"BIOL102", task:"Full review + Academic Integrity material"},
      pm:{course:"MATH225", task:"Laplace + systems"},
    },
    "2026-12-15": {
      am:{course:"BIOL102", task:"Light review only"},
      pm:{course:"MATH225", task:"First-order + higher-order"},
    },
    "2026-12-16": {
      pm:{course:"MATH225", task:"Review"},
      eve:{course:"MATH225", task:"Review"},
    },
    "2026-12-17": {
      am:{course:"MATH225", task:"Mock exam"},
      pm:{course:"MATH225", task:"Review errors"},
      eve:{course:"MATH112", task:"Light"},
    },
    "2026-12-18": {
      am:{course:"MATH225", task:"Formula drill"},
      eve:{course:"MATH112", task:"Light"},
    },
    "2026-12-19": {
      eve:{course:"COGS100", task:"Flash review"},
    },
    "2026-12-20": {
      am:{course:"COGS100", task:"Full review"},
      pm:{course:"PHYS242", task:"Relativity"},
    },
    "2026-12-21": {
      am:{course:"PHYS242", task:"Quantum + formula sheet"},
      pm:{course:"COGS100", task:"Long answers"},
      eve:{course:"PHYS242", task:"Light"},
    },
  };

  // Rough catch-up hour totals per course (from the Nov 14 update brief),
  // shown as a target on the Progress tab — not derived from STUDY_PLAN,
  // just the planning estimate behind it.
  const STUDY_PLAN_TARGETS = { MATH225:22, PHYS242:16, COGS100:14, MATH112:11, BIOL102:9 };

  const data = { base, noClassDay, weeks, examDates, COURSE_NAMES, COURSE_COLOR, FINAL_WEIGHT, WEEKLY_HABITS, DAILY_HABITS, TASKS, GRADES, STUDY_PLAN, STUDY_PLAN_TARGETS };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.SCHEDULE_DATA = data;

})(typeof window !== "undefined" ? window : globalThis);
