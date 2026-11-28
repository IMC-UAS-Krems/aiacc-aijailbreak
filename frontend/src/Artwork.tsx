/** Original lightweight SVG adaptations of the supplied woodland references. */
export function Robin({ face = false, className = '' }: { face?: boolean; className?: string }) {
  return <svg className={className} viewBox={face ? '45 8 210 230' : '0 0 300 430'} role="img" aria-label="Robin Hoodie in patched early-level clothes">
    <g stroke="#48321f" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round">
      {!face && <><ellipse cx="150" cy="410" rx="107" ry="10" fill="#cab68c" stroke="none" />
        <path d="M94 314 89 386Q58 382 61 411L126 411 133 319M163 319 173 411 237 411Q240 384 210 385L204 310" fill="#77553a" />
        <path d="m94 335 37 5m42 1 33-5M87 368l39 3m51 0 33-4" fill="none" />
        <path d="M75 235Q55 248 48 303q-6 27 17 32 18 1 24-27M224 235q20 15 27 68 5 28-19 32-18-2-21-27" fill="#f4ce9b" />
        <path d="M91 211Q70 230 56 289l17-7 5 16 19-10-14 61 21-4 13 12 22-8 17 10 25-12 19 6 20-9-15-57 18 11 6-17 17 8q-13-57-42-78" fill="#ad8861" />
        <path d="m96 286 108 0 4 21q-56 12-115-1Z" fill="#80593a" />
        <path d="M166 292q-25-15-17 6 6 12 17-6 21-15 21 2-3 18-21-2m-5 10-10 37m18-35 13 29" fill="none" stroke="#503923" />
        <path d="m106 231-4 23 12 6-1 15m73-28 2 29m-13-21 24-4m-23 17 22-3" fill="none" strokeWidth="4" />
        <path d="m185 329 24-4 5 27-28 3Z" fill="#d5b184" strokeWidth="4" />
      </>}
      <path d="M150 16C109 19 53 89 40 169q-8 41 67 67l42 20 44-21q77-30 68-67C245 88 193 20 150 16Z" fill="#956b48" />
      <path d="M150 46q-55 28-80 108l38-27-15 24 51-40-22 2Z" fill="#795237" stroke="none" />
      <path d="M64 178q22-20 52-30l34-24q58 17 86 56-29 38-85 65-61-25-87-67Z" fill="#3d291a" />
      <path d="M111 183q40 14 80 0-4 48-41 49-34-2-39-49" fill="#ffdbac" stroke="none" />
      <path d="M137 205q13 15 27-1" fill="none" strokeWidth="6" />
      <path d="m71 82 24 12-13 32-26-13Z" fill="#d8b58a" strokeWidth="4" />
      <path d="m65 86 12 8m3-13 12 9m-33 13 12 7m3 7 13 8m106-16 20 21m-19 0 17-20" fill="none" strokeWidth="4" />
    </g>
  </svg>;
}

export function Castle({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 250 230" role="img" aria-label="Castle tower">
    <path d="M128 64V9" stroke="#80674c" strokeWidth="6" strokeLinecap="round" />
    <path d="M131 10q27-17 48 3-23 23-48 8" fill="#bd8758" />
    <path d="M26 123h198v100H26Z" fill="#dfc7a3" />
    <path d="M89 72h74v151H89Z" fill="#ead6b5" />
    <path d="M79 57h17v15h16V54h20v18h16V57h24v34H79ZM9 101h18v15h17v-15h18v15h17v-15h17v36H9Zm153 0h17v15h17v-15h18v15h17v-15h17v36h-86Z" fill="#cbb08c" />
    <path d="M103 223v-34a23 23 0 0 1 46 0v34" fill="#94775c" />
    <path d="M41 157v-14a7 7 0 0 1 14 0v14m142 0v-14a7 7 0 0 1 14 0v14" fill="#a58a6c" />
    <path d="M109 95h36v52l-18-10-18 10" fill="#b87942" />
    <path d="M119 116v-7a8 8 0 0 1 16 0v7" fill="none" stroke="#fff1ce" strokeWidth="4" />
    <rect x="116" y="114" width="22" height="17" rx="3" fill="#fff1ce" />
  </svg>;
}

export function Watchtower() {
  return <svg viewBox="0 0 100 100" role="img" aria-label="Watchtower">
    <g fill="none" stroke="#94775c" strokeWidth="6" strokeLinejoin="round">
      <path d="m38 54-9 40m33-40 9 40M36 62l33 28m-5-28L31 90" />
    </g>
    <path d="M28 32h44v20H28Z" fill="#755c45" />
    <path d="M28 32h6v19h-6zm19 0h6v19h-6zm19 0h6v19h-6z" fill="#dfc7a3" />
    <path d="M20 48h60v11H20Z" fill="#cbb08c" />
    <path d="M17 33 50 7l33 26Z" fill="#bd8758" />
    <path d="M50 7 83 33H55Z" fill="#a57550" />
  </svg>;
}

export function TreasurySeal() {
  return <svg viewBox="0 0 100 100" role="img" aria-label="Treasury wax seal">
    <path d="m32 55-9 39 17-9 10 10 7-40" fill="#ac7542" />
    <path d="m60 55 14 37-17-7-8 9-9-39" fill="#cf9452" />
    <circle cx="50" cy="40" r="31" fill="#a6563a" stroke="#813f2c" strokeWidth="4" />
    <circle cx="50" cy="40" r="23" fill="none" stroke="#e49c70" strokeWidth="3" />
    <path d="m36 34 8 6 6-13 6 13 8-6-4 18H40Z" fill="#ffe0a3" />
  </svg>;
}

export function Scenery() {
  return <div className="scenery" aria-hidden="true">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
      <path d="M0 684Q160 620 376 759T841 735Q1160 434 1440 580V900H0" fill="#d5d3a5" />
      <path d="M0 779Q300 658 591 830T1100 744Q1310 675 1440 708V900H0" fill="#bdc28e" />
      <path d="M1254 608Q1114 633 1196 676T1140 760L983 849l-101 21q174-137 248-145 94-19 12-55t112-62" fill="#eee1b9" />
      <path d="M0 691Q27 271 132 98l56 5Q74 293 67 708Z" fill="#a17c56" />
      <path d="M55 388Q162 282 226 149l24 8Q210 306 75 431" fill="#a17c56" />
      <path d="M0 0h356q26 82-62 90-12 89-104 56-19 70-88 30Q55 253 0 211Z" fill="#929e64" />
      <path d="M0 0h291q12 44-54 62-5 60-79 32Q95 151 40 97 19 127 0 124Z" fill="#a5ad73" />
      <g fill="#eddbba"><path d="M1073 139q-4-24 31-22 17-47 56-20 41-21 59 20 42 2 30 25Z" /><path d="M222 242q-4-22 28-19 12-31 42-19 26-10 40 22 35-3 28 19Z" /></g>
      <g fill="#89965e"><path d="M0 900v-51q16-50 51-10-6-62 44-52 52 11 30 59 53-36 72 54Z" /><path d="M1209 900q5-52 43-42-13-62 38-58 32-2 39 35 57-47 85 16 19-27 26-11v60Z" /></g>
      <g fill="#8d9b62"><ellipse cx="358" cy="817" rx="8" ry="20" transform="rotate(-30 358 817)" /><ellipse cx="381" cy="814" rx="7" ry="20" transform="rotate(25 381 814)" /><ellipse cx="1055" cy="840" rx="8" ry="20" transform="rotate(-30 1055 840)" /></g>
    </svg><Castle className="distant-castle" />
  </div>;
}
