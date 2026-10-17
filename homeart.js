/* Math Wizard: the Home room's item art (spec 13 §9). Drawn on demand: the game loads this file only when the Home or the shop's Home section opens.
   HA.draw(kind, v) → { svg, ar } : the picture of the tier 0 item `v` (0 to 2) of a kind, and its width / height ratio. Pictures are plain and simple (tier 0);
   the higher tiers will be added in later art batches. Everything is drawn with the same outline and soft colours as the rest of the room. */
(function (root) {
  'use strict';
  const OL = 'stroke="#2b1a0e" stroke-width="1.2" stroke-linejoin="round"';
  // a colour made lighter (a > 0) or darker (a < 0)
  const sh = (hex, a) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, c + a)); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, '0')).join(''); };
  const S = (w, h, body) => ({ svg: `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${body}</svg>`, ar: w / h });
  const flame = (x, y, s = 1) => `<g class="hFlame"><path d="M${x} ${y} C${x - 5 * s} ${y - 4 * s} ${x - 4 * s} ${y - 10 * s} ${x} ${y - 15 * s} C${x + 4 * s} ${y - 10 * s} ${x + 5 * s} ${y - 4 * s} ${x} ${y}Z" fill="#ff8a2e"/><path d="M${x} ${y} C${x - 2.5 * s} ${y - 2 * s} ${x - 2 * s} ${y - 6 * s} ${x} ${y - 8 * s} C${x + 2 * s} ${y - 6 * s} ${x + 2.5 * s} ${y - 2 * s} ${x} ${y}Z" fill="#ffd166"/></g>`;

  const ART = {
    sofa: v => { const c = ['#b07a46', '#4d7cc0', '#4d9c6c'][v], d = sh(c, -40), l = sh(c, 26);
      return S(120, 66, `<rect x="6" y="10" width="108" height="36" rx="11" fill="${d}" ${OL}/><rect x="2" y="28" width="20" height="32" rx="8" fill="${c}" ${OL}/><rect x="98" y="28" width="20" height="32" rx="8" fill="${c}" ${OL}/>
        <rect x="18" y="30" width="84" height="26" rx="7" fill="${l}" ${OL}/><path d="M60 32V54" stroke="${d}" stroke-width="1.2"/><rect x="12" y="58" width="8" height="7" rx="1.5" fill="#4a2c16"/><rect x="100" y="58" width="8" height="7" rx="1.5" fill="#4a2c16"/>`); },
    table: v => v === 1
      ? S(100, 58, `<ellipse cx="50" cy="16" rx="46" ry="11" fill="#c28a52" ${OL}/><ellipse cx="50" cy="14" rx="40" ry="8" fill="#d9a36a"/><rect x="44" y="26" width="12" height="26" fill="#8a5a2b" ${OL}/><ellipse cx="50" cy="53" rx="24" ry="4" fill="#6b4220" ${OL}/>`)
      : v === 2 ? S(110, 52, `<rect x="2" y="8" width="106" height="9" rx="2" fill="#b98550" ${OL}/><rect x="2" y="8" width="106" height="3" fill="#d9a36a"/><rect x="8" y="17" width="7" height="32" fill="#8a5a2b" ${OL}/><rect x="95" y="17" width="7" height="32" fill="#8a5a2b" ${OL}/><rect x="15" y="30" width="80" height="4" fill="#8a5a2b" ${OL}/>`)
      : S(100, 54, `<rect x="4" y="8" width="92" height="9" rx="2" fill="#b98550" ${OL}/><rect x="4" y="8" width="92" height="3" fill="#d9a36a"/><rect x="10" y="17" width="7" height="34" fill="#8a5a2b" ${OL}/><rect x="83" y="17" width="7" height="34" fill="#8a5a2b" ${OL}/>`),
    chair: v => v === 2
      ? S(36, 52, `<ellipse cx="18" cy="14" rx="15" ry="5.5" fill="#c28a52" ${OL}/><rect x="14" y="19" width="8" height="4" fill="#8a5a2b"/><path d="M8 19 L4 49 M28 19 L32 49 M18 22 V50" stroke="#6b4220" stroke-width="3.2" stroke-linecap="round" fill="none"/>`)
      : (() => { const c = v === 1 ? '#c0504a' : '#b98550';
        return S(36, 58, `<rect x="7" y="2" width="22" height="28" rx="3" fill="${c}" ${OL}/><rect x="3" y="30" width="30" height="9" rx="3" fill="${v === 1 ? '#d86a62' : '#d9a36a'}" ${OL}/><rect x="5" y="39" width="5" height="17" fill="#6b4220" ${OL}/><rect x="26" y="39" width="5" height="17" fill="#6b4220" ${OL}/>`); })(),
    desk: v => v === 1
      ? S(108, 66, `<rect x="2" y="6" width="104" height="9" rx="2" fill="#b98550" ${OL}/><rect x="6" y="15" width="34" height="46" fill="#8a5a2b" ${OL}/><rect x="9" y="19" width="28" height="18" fill="#a8743a"/><rect x="9" y="40" width="28" height="18" fill="#a8743a"/><circle cx="23" cy="28" r="1.6" fill="#ffd166"/><circle cx="23" cy="49" r="1.6" fill="#ffd166"/><rect x="94" y="15" width="7" height="46" fill="#8a5a2b" ${OL}/>`)
      : v === 2 ? S(86, 62, `<rect x="2" y="8" width="82" height="9" rx="2" fill="#b98550" ${OL}/><rect x="8" y="17" width="7" height="42" fill="#8a5a2b" ${OL}/><rect x="71" y="17" width="7" height="42" fill="#8a5a2b" ${OL}/>`)
      : S(108, 66, `<rect x="2" y="6" width="104" height="9" rx="2" fill="#b98550" ${OL}/><rect x="2" y="6" width="104" height="3" fill="#d9a36a"/><rect x="8" y="15" width="7" height="46" fill="#8a5a2b" ${OL}/><rect x="93" y="15" width="7" height="46" fill="#8a5a2b" ${OL}/><rect x="15" y="15" width="78" height="14" fill="#a8743a" ${OL}/>`),
    bed: v => { const b = ['#c9d2e4', '#4d7cc0', '#c0392b'][v];
      return S(130, 66, `<rect x="4" y="8" width="10" height="52" rx="2" fill="#8a5a2b" ${OL}/><rect x="116" y="22" width="10" height="38" rx="2" fill="#8a5a2b" ${OL}/><rect x="8" y="34" width="116" height="16" rx="3" fill="#a8743a" ${OL}/>
        <rect x="12" y="24" width="106" height="16" rx="6" fill="#f6efe0" ${OL}/><rect x="14" y="19" width="26" height="12" rx="5" fill="#fff" ${OL}/><rect x="40" y="26" width="76" height="14" rx="5" fill="${b}" ${OL}/><path d="M50 27V40M64 27V40M78 27V40" stroke="${sh(b, -30)}" stroke-width=".8"/>
        <rect x="8" y="50" width="6" height="12" fill="#6b4220"/><rect x="116" y="50" width="6" height="12" fill="#6b4220"/>`); },
    fireplace: v => { const c = ['#a84a3a', '#8e8e98', '#9a6a4a'][v], d = sh(c, -40), big = v !== 2, w = big ? 100 : 80;
      return S(w, 86, `<rect x="2" y="${big ? 8 : 24}" width="${w - 4}" height="${big ? 76 : 60}" rx="3" fill="${c}" ${OL}/>${[0, 1, 2, 3].map(i => `<path d="M2 ${(big ? 20 : 34) + i * 14}H${w - 2}" stroke="${d}" stroke-width=".9"/>`).join('')}
        <rect x="0" y="${big ? 2 : 18}" width="${w}" height="9" rx="2" fill="${sh(c, 30)}" ${OL}/><rect x="${w / 2 - 20}" y="${big ? 38 : 44}" width="40" height="${big ? 46 : 40}" rx="3" fill="#1a1020" ${OL}/>${flame(w / 2 - 6, big ? 80 : 80, 1.1)}${flame(w / 2 + 7, big ? 80 : 80, .9)}<rect x="${w / 2 - 22}" y="${big ? 80 : 80}" width="44" height="5" fill="#4a2c16"/>`); },
    rug: v => v === 2 ? S(100, 56, `<ellipse cx="50" cy="28" rx="48" ry="26" fill="#2f6aa8" ${OL}/><ellipse cx="50" cy="28" rx="36" ry="19" fill="#5a8ec8"/><ellipse cx="50" cy="28" rx="22" ry="11" fill="#2f6aa8"/><ellipse cx="50" cy="28" rx="9" ry="4.5" fill="#e8c98a"/>`)
      : v === 1 ? S(120, 44, `<ellipse cx="60" cy="22" rx="58" ry="20" fill="#b3474d" ${OL}/><ellipse cx="60" cy="22" rx="46" ry="15" fill="#e0b36c"/><ellipse cx="60" cy="22" rx="34" ry="11" fill="#b3474d"/><ellipse cx="60" cy="22" rx="22" ry="7" fill="#e0b36c"/><ellipse cx="60" cy="22" rx="10" ry="3.4" fill="#6e3a7a"/>`)
      : S(120, 44, `<ellipse cx="60" cy="22" rx="58" ry="20" fill="#9a6a3f" ${OL}/><ellipse cx="60" cy="22" rx="50" ry="16" fill="#c9a06a"/><ellipse cx="60" cy="22" rx="40" ry="12" fill="#b88a55"/>`),
    window: v => { const sky = `<defs><linearGradient id="hwS${v}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1b4c"/><stop offset="1" stop-color="#3a4f9a"/></linearGradient></defs>`;
      const stars = '<g fill="#fff" opacity=".85"><circle cx="20" cy="22" r=".9"/><circle cx="40" cy="34" r=".8"/><circle cx="26" cy="46" r=".8"/><circle cx="44" cy="18" r=".7"/></g><circle cx="42" cy="26" r="4.4" fill="#fff6c9"/>';
      return v === 1 ? S(64, 64, `${sky}<circle cx="32" cy="32" r="30" fill="#2a1a3d" ${OL}/><circle cx="32" cy="32" r="25" fill="url(#hwS1)"/>${stars}<path d="M32 7V57M7 32H57" stroke="#2a1a3d" stroke-width="2.4"/>`)
        : v === 2 ? S(60, 80, `${sky}<path d="M3 78V30a27 27 0 0 1 54 0V78Z" fill="#2a1a3d" ${OL}/><path d="M8 74V30a22 22 0 0 1 44 0V74Z" fill="url(#hwS2)"/>${stars}<path d="M30 8V74M8 44H52" stroke="#2a1a3d" stroke-width="2.4"/>`)
        : S(60, 72, `${sky}<rect x="2" y="2" width="56" height="64" rx="2" fill="#2a1a3d" ${OL}/><rect x="7" y="7" width="46" height="54" fill="url(#hwS0)"/>${stars}<rect x="29" y="7" width="3" height="54" fill="#2a1a3d"/><rect x="7" y="32" width="46" height="3" fill="#2a1a3d"/><rect x="0" y="66" width="60" height="5" rx="1.5" fill="#4a2f66"/>`); },
    curtains: v => { const c = ['#d8c8a0', '#b03a3a', '#3a8a5a'][v], d = sh(c, -40);
      return S(120, 90, `<rect x="2" y="2" width="116" height="5" rx="2.5" fill="#6b4220" ${OL}/><path d="M8 7H34C32 40 36 62 28 86H6Z" fill="${c}" ${OL}/><path d="M86 7H112V86H92C84 62 88 40 86 7Z" fill="${c}" ${OL}/>
        <path d="M14 8C13 36 15 60 12 84M22 8C21 36 23 60 20 84M98 8C97 36 99 60 96 84M105 8C104 36 106 60 103 84" stroke="${d}" stroke-width=".9" fill="none"/><path d="M8 52Q20 56 32 52" stroke="#e8c98a" stroke-width="2.4" fill="none"/><path d="M88 52Q100 56 112 52" stroke="#e8c98a" stroke-width="2.4" fill="none"/>`); },
    picture: v => { const frame = `<rect x="2" y="2" width="48" height="48" rx="2" fill="#8a5a2b" ${OL}/><rect x="6" y="6" width="40" height="40" fill="#cfe6ff"/>`;
      return S(52, 52, v === 1 ? `${frame}<rect x="6" y="6" width="40" height="40" fill="#fbe9d0"/><path d="M26 44V28" stroke="#3a8a5a" stroke-width="2"/><g fill="#e8527a"><circle cx="26" cy="22" r="4"/><circle cx="21" cy="26" r="4"/><circle cx="31" cy="26" r="4"/></g><circle cx="26" cy="25" r="2.4" fill="#ffd166"/>`
        : v === 2 ? `${frame}<rect x="6" y="6" width="40" height="40" fill="#1d2a6a"/><path d="M26 12l2.4 6 6.4.4-5 4 1.8 6.2-5.6-3.6-5.6 3.6 1.8-6.2-5-4 6.4-.4z" fill="#ffd166"/><circle cx="12" cy="14" r="1" fill="#fff"/><circle cx="40" cy="36" r="1.2" fill="#fff"/><circle cx="14" cy="38" r="1" fill="#fff"/>`
        : `${frame}<circle cx="36" cy="16" r="5" fill="#ffd166"/><path d="M6 36Q16 24 26 34T46 30V46H6Z" fill="#5fbf6f"/><path d="M6 42Q20 34 30 42T46 38V46H6Z" fill="#3a9a55"/>`); },
    clock: v => { const hands = (cx, cy) => `<path d="M${cx} ${cy}V${cy - 14}M${cx} ${cy}L${cx + 9} ${cy + 4}" stroke="#2b1a0e" stroke-width="2.4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="2" fill="#b3261e"/>`;
      return v === 1 ? S(52, 52, `<circle cx="26" cy="26" r="24" fill="#c9a96a" ${OL}/><circle cx="26" cy="26" r="19" fill="#fffaf0"/>${[0, 1, 2, 3].map(i => `<circle cx="${26 + 15 * Math.sin(i * Math.PI / 2)}" cy="${26 - 15 * Math.cos(i * Math.PI / 2)}" r="1.4" fill="#2b1a0e"/>`).join('')}${hands(26, 26)}`)
        : v === 2 ? S(46, 70, `<path d="M6 2H40L44 30H2Z" fill="#8a5a2b" ${OL}/><circle cx="23" cy="17" r="12" fill="#fffaf0" ${OL}/>${hands(23, 17)}<rect x="8" y="32" width="30" height="34" rx="3" fill="#a8743a" ${OL}/><path d="M23 34V54" stroke="#e8c98a" stroke-width="1.6"/><circle cx="23" cy="56" r="5" fill="#e0b84a" ${OL}/>`)
        : S(52, 52, `<rect x="2" y="2" width="48" height="48" rx="6" fill="#8a5a2b" ${OL}/><rect x="7" y="7" width="38" height="38" rx="3" fill="#fffaf0"/>${[0, 1, 2, 3].map(i => `<circle cx="${26 + 15 * Math.sin(i * Math.PI / 2)}" cy="${26 - 15 * Math.cos(i * Math.PI / 2)}" r="1.3" fill="#2b1a0e"/>`).join('')}${hands(26, 26)}`); },
    banner: v => { const c = ['#c63a2e', '#2f6aa8', '#3a9a55'][v];
      return S(46, 68, `<rect x="2" y="2" width="42" height="5" rx="2" fill="#6b4220" ${OL}/><path d="M6 7H40V54L23 64L6 54Z" fill="${c}" ${OL}/><path d="M23 18l3 7 7.4.6-5.6 4.8 1.8 7.2-6.6-4-6.6 4 1.8-7.2-5.6-4.8 7.4-.6z" fill="#ffd166"/>`); },
    mirror: v => v === 1 ? S(48, 48, `<circle cx="24" cy="24" r="22" fill="#c9a96a" ${OL}/><circle cx="24" cy="24" r="17.5" fill="#cfe6f5"/><path d="M12 30Q16 18 28 14" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`)
      : v === 2 ? S(40, 62, `<ellipse cx="20" cy="31" rx="18" ry="29" fill="#c9a96a" ${OL}/><ellipse cx="20" cy="31" rx="14" ry="25" fill="#cfe6f5"/><path d="M10 40Q10 20 18 12" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`)
      : S(40, 60, `<rect x="2" y="2" width="36" height="56" rx="3" fill="#8a5a2b" ${OL}/><rect x="6" y="6" width="28" height="48" fill="#cfe6f5"/><path d="M10 38V16L26 8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`),
    lamp: v => v === 1 ? S(26, 64, `<ellipse cx="13" cy="60" rx="11" ry="3.4" fill="#c9a96a" ${OL}/><rect x="10" y="30" width="6" height="30" fill="#e0b84a" ${OL}/><rect x="6" y="26" width="14" height="6" rx="2" fill="#e0b84a" ${OL}/><rect x="9" y="12" width="8" height="15" rx="1.5" fill="#fff3d6" ${OL}/>${flame(13, 12, .9)}<circle cx="13" cy="8" r="9" fill="#ffd166" opacity=".16"/>`)
      : v === 2 ? S(40, 50, `<ellipse cx="20" cy="46" rx="15" ry="3.4" fill="#8a5a2b" ${OL}/><path d="M6 44Q4 28 20 24Q36 28 34 44Z" fill="#c28a52" ${OL}/><rect x="18" y="14" width="4" height="10" fill="#8a5a2b" ${OL}/>${flame(20, 14, .8)}<path d="M34 34Q42 34 38 44" stroke="#8a5a2b" stroke-width="3" fill="none"/>`)
      : S(36, 84, `<ellipse cx="18" cy="80" rx="13" ry="3.6" fill="#4a2f1a" ${OL}/><rect x="16" y="34" width="4" height="46" fill="#8a5a2b" ${OL}/><path d="M5 34L9 8H27L31 34Z" fill="#ffe3a0" ${OL}/><circle cx="18" cy="24" r="14" fill="#ffd166" opacity=".18"/>`),
    plant: v => v === 1 ? S(38, 62, `<path d="M8 40H30L27 60H11Z" fill="#b4603a" ${OL}/><rect x="6" y="36" width="26" height="6" rx="2" fill="#c97a50" ${OL}/><path d="M13 36V16Q13 10 19 10Q25 10 25 16V36Z" fill="#4aa35a" ${OL}/><path d="M13 28Q6 26 6 20Q6 16 10 18V28Z M25 26Q32 24 32 18Q32 14 28 16V26Z" fill="#4aa35a" ${OL}/><path d="M19 12V34M16 20h-3M22 24h3" stroke="#2d7a3a" stroke-width="1"/>`)
      : v === 2 ? S(46, 60, `<path d="M11 40H35L32 58H14Z" fill="#7a5a4a" ${OL}/><rect x="9" y="36" width="28" height="6" rx="2" fill="#94725f" ${OL}/><path d="M23 38Q4 30 4 8Q18 14 23 38Q28 14 42 8Q42 30 23 38Q23 20 23 4Q23 20 23 38" fill="#3a9a55" ${OL}/>`)
      : S(40, 60, `<path d="M10 38H30L27 58H13Z" fill="#b4603a" ${OL}/><rect x="8" y="34" width="24" height="6" rx="2" fill="#c97a50" ${OL}/><path d="M20 34Q8 28 8 14Q18 18 20 34Q22 12 32 6Q32 24 20 34Z" fill="#5fbf6f" ${OL}/><path d="M20 34Q14 22 18 8Q24 20 20 34Z" fill="#3a9a55"/>`),
    pet: v => v === 1 ? S(52, 56, `<ellipse cx="26" cy="52" rx="19" ry="3.8" fill="#0003"/><path d="M12 50C8 36 14 26 26 24C38 26 44 36 40 50Z" fill="#e8a24a" ${OL}/><circle cx="26" cy="20" r="11" fill="#e8a24a" ${OL}/><path d="M17 12L18 4L24 10M35 12L34 4L28 10" fill="#e8a24a" ${OL}/><circle cx="22" cy="19" r="1.6" fill="#2b1a0e"/><circle cx="30" cy="19" r="1.6" fill="#2b1a0e"/><path d="M24 24Q26 26 28 24" stroke="#2b1a0e" fill="none"/><path d="M40 46Q50 44 48 34" stroke="#e8a24a" stroke-width="4" fill="none" stroke-linecap="round" class="hTail"/>`)
      : v === 2 ? S(56, 36, `<ellipse cx="28" cy="33" rx="22" ry="3" fill="#0003"/><path d="M8 30C8 12 48 12 48 30Z" fill="#5a9a4a" ${OL}/><path d="M16 26Q28 14 40 26M28 15V28" stroke="#3a7a3a" stroke-width="1.2" fill="none"/><circle cx="52" cy="26" r="5" fill="#8abf6a" ${OL}/><circle cx="53.5" cy="24.6" r="1" fill="#2b1a0e"/><rect x="12" y="29" width="6" height="5" rx="2" fill="#8abf6a" ${OL}/><rect x="38" y="29" width="6" height="5" rx="2" fill="#8abf6a" ${OL}/>`)
      : S(60, 30, `<ellipse cx="30" cy="22" rx="28" ry="7" fill="#b3474d" ${OL}/><ellipse cx="30" cy="19" rx="24" ry="5" fill="#d86a62"/><path d="M12 19Q30 12 48 19" stroke="#e8c98a" stroke-width="1.2" fill="none"/>`),
    trinket: v => v === 1 ? S(40, 36, `<rect x="3" y="24" width="34" height="9" rx="1.5" fill="#6a4bd0" ${OL}/><rect x="6" y="15" width="30" height="9" rx="1.5" fill="#c0392b" ${OL}/><rect x="4" y="6" width="28" height="9" rx="1.5" fill="#2f9e6a" ${OL}/><path d="M8 28.5H32M10 19.5H32M8 10.5H28" stroke="#fff6" stroke-width=".8"/>`)
      : v === 2 ? S(34, 26, `<path d="M3 22Q2 8 14 5Q30 4 32 18Q33 24 26 24H8Q3 24 3 22Z" fill="#a0a0aa" ${OL}/><path d="M10 14Q16 9 24 12" stroke="#fff" stroke-width="1.4" fill="none" opacity=".7"/>`)
      : S(30, 44, `<path d="M8 42Q3 30 8 20L11 14H19L22 20Q27 30 22 42Z" fill="#6a9fd0" ${OL}/><rect x="10" y="6" width="10" height="8" rx="1.5" fill="#8fbce0" ${OL}/><path d="M12 24Q10 32 13 38" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>`),
    light: v => v === 1 ? S(44, 60, `<path d="M22 0V10" stroke="#2b1a0e" stroke-width="1.6"/><path d="M10 10H34L38 44Q22 54 6 44Z" fill="#e8527a" ${OL}/><path d="M12 24H32M11 34H33" stroke="#fff5" stroke-width="1"/><circle cx="22" cy="30" r="9" fill="#ffd166" opacity=".35"/>`)
      : v === 2 ? S(50, 52, `<path d="M25 0V12" stroke="#2b1a0e" stroke-width="1.6"/><circle cx="25" cy="30" r="17" fill="#fff6c9" ${OL}/><circle cx="25" cy="30" r="22" fill="#ffd166" opacity=".16"/><path d="M15 24Q18 16 26 14" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`)
      : S(52, 52, `<path d="M26 0V14" stroke="#2b1a0e" stroke-width="1.6"/><path d="M8 38Q10 18 26 14Q42 18 44 38Z" fill="#c28a52" ${OL}/><rect x="22" y="38" width="8" height="5" fill="#ffd166"/><circle cx="26" cy="44" r="7" fill="#ffd166" opacity=".25"/>`)
  };

  /* ---- tiers 1 to 5 (spec 13 §4): the tier 0 drawing in the tier's colours, with the tier's mark (a rune, a bolt, stars, an eclipse, a golden glow) ---- */
  // theme per tier and per item (j): hue, saturation, lightness shift. Tier 0 stays as drawn.
  const THEME = [null,
    [{ h: 22, s: .62, l: .04 }, { h: 135, s: .5, l: .02 }],      // 1: cosy, warm and green, a rune
    [{ h: 214, s: .6, l: .0 }, { h: 192, s: .45, l: -.02 }],     // 2: storm blue and grey-teal, a bolt
    [{ h: 270, s: .5, l: .04 }, { h: 245, s: .16, l: .12 }],     // 3: starry violet and silver, stars
    [{ h: 268, s: .35, l: -.2 }, { h: 12, s: .4, l: -.2 }],      // 4: dark and gold, an eclipse
    [{ h: 44, s: .72, l: .1 }, { h: 282, s: .5, l: .06 }]];      // 5: grand gold and royal purple, a glow
  const toHsl = n => { const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, s, l]; };
  const fromHsl = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join(''); };
  const retint = (svg, th) => svg.replace(/#([0-9a-f]{6})\b/gi, (m, hex) => {
    const [h, s, l] = toHsl(parseInt(hex, 16));
    if (hex.toLowerCase() === '2b1a0e' || s < .08 || l > .86 || (l > .62 && h > 25 && h < 65) || (h > 15 && h < 40 && s > .9)) return m;   // outlines, greys, glass, glowing yellows and flames stay
    return fromHsl(th.h, Math.min(1, s * .5 + th.s * .5), Math.max(.06, Math.min(.92, l + th.l)));
  });
  const markOf = (t, j, cx, cy, r) => {   // the tier's mark, drawn small in a corner of the picture
    const G = '#ffd166', st = `stroke="#2b1a0e" stroke-width="${(r * .12).toFixed(2)}" stroke-linejoin="round"`;
    const star = (x, y, q) => `<path d="M${[...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? q * .45 : q; return (x + d * Math.cos(a)).toFixed(2) + ' ' + (y + d * Math.sin(a)).toFixed(2); }).join('L')}Z" fill="#fff6c9" ${st}/>`;
    if (t === 1) return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#2b1a0ecc"/><path d="M${cx - r * .3} ${cy - r * .6}V${cy + r * .6}M${cx - r * .3} ${cy - r * .5}L${cx + r * .45} ${cy - r * .05}L${cx - r * .3} ${cy + r * .25}" stroke="${G}" stroke-width="${(r * .22).toFixed(2)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    if (t === 2) return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#2b1a0ecc"/><path d="M${cx + r * .15} ${cy - r * .7}L${cx - r * .4} ${cy + r * .1}H${cx} L${cx - r * .15} ${cy + r * .7}L${cx + r * .45} ${cy - r * .15}H${cx + r * .05}Z" fill="${G}"/></g>`;
    if (t === 3) return `<g>${star(cx, cy, r)}${j ? '' : star(cx - r * 1.5, cy + r * .9, r * .55)}</g>`;
    if (t === 4) return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#17141f" stroke="${G}" stroke-width="${(r * .25).toFixed(2)}"/><circle cx="${cx + r * .22}" cy="${cy - r * .1}" r="${r * .78}" fill="#17141f"/></g>`;
    return `<g><circle cx="${cx}" cy="${cy}" r="${r * 1.5}" fill="${G}" opacity=".3"/>${star(cx, cy, r * 1.1)}${star(cx - r * 1.4, cy + r * 1.1, r * .5)}</g>`;
  };
  const draw = (kind, v, tier, j) => {
    const a = (ART[kind] || ART.trinket)(v || 0);
    if (!tier) return a;
    const m = /^<svg viewBox="0 0 ([\d.]+) ([\d.]+)"([^>]*)>([\s\S]*)<\/svg>$/.exec(a.svg), w = +m[1], h = +m[2], th = THEME[tier][j || 0];
    const r = Math.max(3.4, Math.min(w, h) * .13), cx = j ? w * .22 : w * .78, cy = Math.max(r * 1.15, h * .2), glow = tier >= 4 ? `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * .58}" ry="${h * .58}" fill="#ffd166" opacity="${tier === 5 ? .22 : .1}"/>` : '';
    return { svg: `<svg viewBox="0 0 ${w} ${h}"${m[3]}>${glow}${retint(m[4], th)}${markOf(tier, j || 0, cx, cy, r)}</svg>`, ar: a.ar };
  };
  const HA = { draw, kinds: Object.keys(ART) };
  if (typeof module === 'object' && module.exports) module.exports = HA; else root.HA = HA;
})(typeof globalThis !== 'undefined' ? globalThis : this);
