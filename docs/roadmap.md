flowchart TD
    A["Oct 31 – Nov 6<br/>SET UP<br/>Agree scope · Install tools · Test model"]
    B["Nov 7 – 13<br/>FIRST PLAYABLE LEVEL<br/>Chat · Submit password · Save progress"]
    C["Nov 14 – 20<br/>COMPLETE REQUIRED FEATURES<br/>Five levels · Guard · Filters · Deployment"]
    D["Nov 21 – 27<br/>EVALUATE AND FIX<br/>Playtest · Measure defenses · Draft report"]
    E["Nov 28 – Dec 3<br/>FINAL REVIEW<br/>Fresh install · Documentation · Rehearsal"]
    F(["Dec 4<br/>SUBMIT"])
    
    A --> B --> C --> D --> E --> F

    K["ONGOING THROUGHOUT<br/>Team reviews · AI-assisted development<br/>Tests · Documentation · Weekly planning"]
    K -.- A
    K -.- B
    K -.- C
    K -.- D
    K -.- E

    B -. "Early deployment trial" .-> C
    C -. "Feature cutoff: Nov 20" .-> D