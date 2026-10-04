// Pipe Design Calculator
// This file builds the calculator UI, reads user input, computes fluid-flow results,
// and draws the Moody chart for the current values.

// Gravity constant in m/s²
const G = 9.81;

// Unit metadata: each input field can be shown in several common units,
// but the internal calculator state always stays in SI base units.
const unitMeta = {
  rho: {
    defaultUnit: 'kg/m³',
    minSI: 500,
    maxSI: 2000,
    stepSI: 10,
    units: {
      'kg/m³': { toSI: 1, fromSI: 1 },
      'g/cm³': { toSI: 1000, fromSI: 1 / 1000 },
      'lb/ft³': { toSI: 16.018463, fromSI: 1 / 16.018463 }
    }
  },
  mu: {
    defaultUnit: 'Pa·s',
    minSI: 1e-4,
    maxSI: 0.1,
    stepSI: 1e-5,
    units: {
      'Pa·s': { toSI: 1, fromSI: 1 },
      'cP': { toSI: 0.001, fromSI: 1000 },
      'lb/(ft·s)': { toSI: 1.488164, fromSI: 1 / 1.488164 }
    }
  },
  D: {
    defaultUnit: 'm',
    minSI: 0.01,
    maxSI: 1,
    stepSI: 0.01,
    units: {
      m: { toSI: 1, fromSI: 1 },
      cm: { toSI: 0.01, fromSI: 100 },
      mm: { toSI: 0.001, fromSI: 1000 },
      in: { toSI: 0.0254, fromSI: 1 / 0.0254 },
      ft: { toSI: 0.3048, fromSI: 1 / 0.3048 }
    }
  },
  L: {
    defaultUnit: 'm',
    minSI: 10,
    maxSI: 1000,
    stepSI: 10,
    units: {
      m: { toSI: 1, fromSI: 1 },
      cm: { toSI: 0.01, fromSI: 100 },
      ft: { toSI: 0.3048, fromSI: 1 / 0.3048 },
      km: { toSI: 1000, fromSI: 1 / 1000 }
    }
  },
  eps: {
    defaultUnit: 'm',
    minSI: 1e-6,
    maxSI: 5e-4,
    stepSI: 1e-6,
    units: {
      m: { toSI: 1, fromSI: 1 },
      mm: { toSI: 0.001, fromSI: 1000 },
      'μm': { toSI: 1e-6, fromSI: 1e6 }
    }
  },
  P1: {
    defaultUnit: 'Pa',
    minSI: 0,
    maxSI: 1e7,
    stepSI: 1e4,
    units: {
      Pa: { toSI: 1, fromSI: 1 },
      kPa: { toSI: 1000, fromSI: 1 / 1000 },
      bar: { toSI: 100000, fromSI: 1 / 100000 },
      atm: { toSI: 101325, fromSI: 1 / 101325 },
      psi: { toSI: 6894.76, fromSI: 1 / 6894.76 }
    }
  },
  V1: {
    defaultUnit: 'm/s',
    minSI: 0.1,
    maxSI: 20,
    stepSI: 0.1,
    units: {
      'm/s': { toSI: 1, fromSI: 1 },
      'cm/s': { toSI: 0.01, fromSI: 100 },
      'ft/s': { toSI: 0.3048, fromSI: 1 / 0.3048 },
      'km/h': { toSI: 0.2777777778, fromSI: 3.6 }
    }
  },
  Z1: {
    defaultUnit: 'm',
    minSI: -10,
    maxSI: 100,
    stepSI: 1,
    units: {
      m: { toSI: 1, fromSI: 1 },
      cm: { toSI: 0.01, fromSI: 100 },
      ft: { toSI: 0.3048, fromSI: 1 / 0.3048 }
    }
  },
  P2: {
    defaultUnit: 'Pa',
    minSI: 0,
    maxSI: 1e7,
    stepSI: 1e4,
    units: {
      Pa: { toSI: 1, fromSI: 1 },
      kPa: { toSI: 1000, fromSI: 1 / 1000 },
      bar: { toSI: 100000, fromSI: 1 / 100000 },
      atm: { toSI: 101325, fromSI: 1 / 101325 },
      psi: { toSI: 6894.76, fromSI: 1 / 6894.76 }
    }
  },
  V2: {
    defaultUnit: 'm/s',
    minSI: 0.1,
    maxSI: 20,
    stepSI: 0.1,
    units: {
      'm/s': { toSI: 1, fromSI: 1 },
      'cm/s': { toSI: 0.01, fromSI: 100 },
      'ft/s': { toSI: 0.3048, fromSI: 1 / 0.3048 },
      'km/h': { toSI: 0.2777777778, fromSI: 3.6 }
    }
  },
  Z2: {
    defaultUnit: 'm',
    minSI: -10,
    maxSI: 100,
    stepSI: 1,
    units: {
      m: { toSI: 1, fromSI: 1 },
      cm: { toSI: 0.01, fromSI: 100 },
      ft: { toSI: 0.3048, fromSI: 1 / 0.3048 }
    }
  },
  K: {
    defaultUnit: '',
    minSI: 0,
    maxSI: 20,
    stepSI: 0.1,
    units: {
      '': { toSI: 1, fromSI: 1 }
    }
  },
  eta: {
    defaultUnit: '',
    minSI: 0.1,
    maxSI: 1,
    stepSI: 0.01,
    units: {
      '': { toSI: 1, fromSI: 1 }
    }
  }
};

const selectedUnits = {};
Object.keys(unitMeta).forEach(id => {
  selectedUnits[id] = unitMeta[id].defaultUnit;
});

function toSI(value, id) {
  const unit = selectedUnits[id];
  const meta = unitMeta[id];
  if (!meta || !meta.units || !meta.units[unit]) return Number(value);
  const conversion = meta.units[unit];
  return Number(value) * conversion.toSI;
}

function fromSI(value, id) {
  const unit = selectedUnits[id];
  const meta = unitMeta[id];
  if (!meta || !meta.units || !meta.units[unit]) return Number(value);
  const conversion = meta.units[unit];
  return Number(value) * conversion.fromSI;
}

function getRangeLimits(id) {
  const meta = unitMeta[id];
  if (!meta) return { min: 0, max: 1, step: 1 };
  return {
    min: fromSI(meta.minSI, id),
    max: fromSI(meta.maxSI, id),
    step: fromSI(meta.stepSI, id)
  };
}

// Each group holds a section of the calculator,
// such as Fluid, Pipe, Inlet, Outlet, and Pump.
// Each item: [id, label, unit, min, max, step, defaultValue]
const groups = [
  ['Fluid', [
    ['rho', 'Fluid density', 'kg/m³', 500, 2000, 10, 1000],
    ['mu', 'Dynamic viscosity', 'Pa·s', 1e-4, 0.1, 1e-5, 0.001]
  ]],
  ['Pipe', [
    ['D', 'Pipe diameter', 'm', 0.01, 1, 0.01, 0.1],
    ['L', 'Pipe length', 'm', 10, 1000, 10, 100],
    ['eps', 'Pipe roughness ε', 'm', 1e-6, 5e-4, 1e-6, 4.5e-5],
    ['K', 'Total minor loss coeff. K', '', 0, 20, 0.1, 0]
  ]],
  ['Inlet (1)', [
    ['P1', 'Pressure', 'Pa', 0, 1e7, 1e4, 101325],
    ['V1', 'Velocity', 'm/s', 0.1, 20, 0.1, 1],
    ['Z1', 'Height', 'm', -10, 100, 1, 0]
  ]],
  ['Outlet (2)', [
    ['P2', 'Pressure', 'Pa', 0, 1e7, 1e4, 101325],
    ['V2', 'Velocity', 'm/s', 0.1, 20, 0.1, 1],
    ['Z2', 'Height', 'm', -10, 100, 1, 0]
  ]],
  ['Pump', [
    ['eta', 'Pump efficiency (0–1)', '', 0.1, 1, 0.01, 0.7]
  ]]
];

// S stores all current input values in SI units.
// Example: S.rho = 1000, S.D = 0.1
const S = {};

// ------------------------------------------------------------
// Step 1: Build the input form dynamically from the groups array
// ------------------------------------------------------------
const p0 = document.getElementById('p0');

groups.forEach(([groupTitle, items]) => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<h2>' + groupTitle + '</h2>';

  items.forEach(([id, label, unit, minVal, maxVal, stepVal, defaultVal]) => {
    S[id] = defaultVal;

    const field = document.createElement('div');
    field.className = 'fld';

    const unitOptions = unitMeta[id] ? Object.keys(unitMeta[id].units) : [];
    const rangeLimits = getRangeLimits(id);
    const displayValue = fromSI(S[id], id);

    const unitSelectorHTML = unitOptions.length > 1
      ? '<select class="unit-select" id="u_' + id + '">' +
          unitOptions.map(u => '<option value="' + u + '"' + (selectedUnits[id] === u ? ' selected' : '') + '>' + u + '</option>').join('') +
        '</select>'
      : '<span class="unit-label">' + (unit || selectedUnits[id]) + '</span>';

    field.innerHTML =
      '<div class="top">' +
      '<span>' + label + '</span>' +
      '<div class="unit-input-group">' +
      unitSelectorHTML +
      '<input type="number" step="any" inputmode="decimal" id="n_' + id + '" value="' + Number(displayValue).toPrecision(8) + '">' +
      '</div>' +
      '</div>' +
      '<input type="range" id="r_' + id + '" min="' + rangeLimits.min + '" max="' + rangeLimits.max + '" step="' + rangeLimits.step + '" value="' + displayValue + '">';

    card.appendChild(field);

    const numberInput = field.querySelector('#n_' + id);
    const rangeInput = field.querySelector('#r_' + id);
    const unitSelect = field.querySelector('#u_' + id);

    const syncRange = () => {
      const lim = getRangeLimits(id);
      rangeInput.min = lim.min;
      rangeInput.max = lim.max;
      rangeInput.step = lim.step;
      const v = fromSI(S[id], id);
      rangeInput.value = v;
      numberInput.value = Number(v).toPrecision(8);
    };

    if (unitSelect) {
      unitSelect.onchange = () => {
        selectedUnits[id] = unitSelect.value;
        syncRange();
        update();
      };
    }

    rangeInput.oninput = () => {
      const v = Number(rangeInput.value);
      if (!Number.isFinite(v)) return;
      const lim = getRangeLimits(id);
      const clamped = Math.min(lim.max, Math.max(lim.min, v));
      rangeInput.value = clamped;
      numberInput.value = Number(clamped).toPrecision(8);
      S[id] = toSI(clamped, id);
      update();
    };

    numberInput.oninput = () => {
      const v = parseFloat(numberInput.value);
      if (!Number.isFinite(v)) return;
      const lim = getRangeLimits(id);
      const clamped = Math.min(lim.max, Math.max(lim.min, v));
      numberInput.value = clamped;
      rangeInput.value = clamped;
      S[id] = toSI(clamped, id);
      update();
    };
  });

  p0.appendChild(card);
});

// ------------------------------------------------------------
// Step 2: Flow equations
// ------------------------------------------------------------

// Darcy friction factor approximation for laminar or turbulent flow.
// Re = Reynolds number, rr = relative roughness = eps / D
function friction(Re, rr) {
  // Laminar flow: f = 64 / Re
  if (Re <= 2300) return 64 / Re;

  // For turbulent flow, use the Colebrook-style approximation.
  const e = Math.max(rr, 1e-10);
  return 0.25 / Math.pow(Math.log10(e / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
}

// This function calculates the hydraulic results from the current inputs.
// It returns null when the inputs are not valid for calculation.
function calc() {
  const { rho, mu, D, L, eps, P1, P2, V1, V2, Z1, Z2, K, eta } = S;

  // Minimum required values to do a calculation
  if (!(D > 0 && L > 0 && rho > 0 && mu > 0 && eta > 0)) return null;

  // Flow rate through a circular pipe using inlet velocity
  const Q = V1 * Math.PI * Math.pow(D / 2, 2);

  // Reynolds number to tell if flow is laminar or turbulent
  const Re = rho * V1 * D / mu;

  // Relative roughness of pipe wall
  const rr = eps / D;

  // Friction factor from the selected flow regime
  const f = friction(Re, rr);

  // Major and minor head losses in the pipe system
  const hMaj = f * (L / D) * V1 * V1 / (2 * G);
  const hMin = K * V1 * V1 / (2 * G);
  const hLoss = hMaj + hMin;

  // Pump head required from energy equation
  const hp = (P2 - P1) / (rho * G) +
              (V2 * V2 - V1 * V1) / (2 * G) +
              (Z2 - Z1) + hLoss;

  // Pump power required, assuming efficiency eta
  const Pp = hp > 0 ? rho * G * Q * hp / eta : 0;

  return { Q, Re, rr, f, hMaj, hMin, hLoss, hp, Pp };
}

// ------------------------------------------------------------
// Step 3: Display the calculation results in the Results tab
// ------------------------------------------------------------
const p1 = document.getElementById('p1');
let R = null;

function renderResults() {
  // If values are invalid, show an error message
  if (!R) {
    p1.innerHTML = '<div class="card err">Error: D, L, ρ, μ and pump efficiency must all be positive.</div>';
    return;
  }

  // Decide whether flow is laminar, transition, or turbulent
  const regime = R.Re <= 2300 ? 'Laminar' : R.Re <= 4000 ? 'Transition' : 'Turbulent';

  // Build a table-like list of result rows
  const rows = [
    ['Volumetric flow rate Q', R.Q.toFixed(4) + ' m³/s'],
    ['Reynolds number Re', R.Re.toExponential(2)],
    ['Relative roughness ε/D', R.rr.toFixed(6)],
    ['Friction factor f', R.f.toFixed(6)],
    ['Major losses h_maj', R.hMaj.toFixed(4) + ' m'],
    ['Minor losses h_min', R.hMin.toFixed(4) + ' m'],
    ['Total losses h_loss', R.hLoss.toFixed(4) + ' m'],
    ['Pump head h_p', R.hp.toFixed(4) + ' m']
  ];

  // Write the HTML for the result section
  p1.innerHTML =
    '<div class="card">' +
    '<h2>Results</h2>' +
    '<span class="badge">' + regime + ' flow</span>' +
    rows.map(r => '<div class="row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') +
    '<div class="msg">' +
    (R.hp > 0
      ? '<b>Required pump power: ' + R.Pp.toFixed(2) + ' W</b> (' + (R.Pp / 1000).toFixed(3) + ' kW)'
      : 'No pump power required. Flow can occur naturally, or a turbine could be considered.') +
    '</div>' +
    '</div>';
}

// ------------------------------------------------------------
// Step 4: Moody chart drawing
// ------------------------------------------------------------
const cv = document.getElementById('cv');

// Roughness values to draw on the Moody chart
const eds = [0, 1e-5, 1e-4, 1e-3, 5e-3, 1e-2, 5e-2];
const cols = eds.map((_, i) => 'hsl(' + (i * 47 + 200) % 360 + ',70%,52%)');

document.getElementById('lg').innerHTML =
  '<span><i style="background:#888"></i>Laminar 64/Re</span>' +
  eds.map((e, i) => '<span><i style="background:' + cols[i] + '"></i>e/D = ' + e.toExponential(0) + '</span>').join('');

// Draw the Moody chart on the canvas.
function moody() {
  if (!R) return;

  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth;
  const H = cv.clientHeight;

  if (!W) return;

  // Set canvas resolution for crisp drawing on high-DPI screens
  cv.width = W * dpr;
  cv.height = H * dpr;

  const c = cv.getContext('2d');
  c.scale(dpr, dpr);

  // Read theme colors from CSS so chart matches dark/light mode
  const cs = getComputedStyle(document.documentElement);
  const ln = cs.getPropertyValue('--ln').trim();
  const mut = cs.getPropertyValue('--mut').trim();

  // Axis bounds based on current Reynolds number and friction factor
  const xa = Math.min(1e3, R.Re * 0.5);
  const xb = Math.max(1e9, R.Re * 2);
  const ya = Math.min(0.005, R.f * 0.5);
  const yb = Math.max(0.1, R.f * 2);

  // Chart margins and size
  const ml = 44, mr = 8, mt = 8, mb = 26;
  const pw = W - ml - mr;
  const ph = H - mt - mb;

  // Map data values to screen coordinates
  const X = x => ml + (Math.log10(x) - Math.log10(xa)) / (Math.log10(xb) - Math.log10(xa)) * pw;
  const Y = y => mt + ph - (Math.log10(y) - Math.log10(ya)) / (Math.log10(yb) - Math.log10(ya)) * ph;

  c.font = '10px system-ui';
  c.lineWidth = 1;

  // Draw vertical grid lines for Reynolds number
  for (let e = Math.floor(Math.log10(xa)); e <= Math.ceil(Math.log10(xb)); e++) {
    const x = Math.pow(10, e);
    if (x < xa || x > xb) continue;

    c.strokeStyle = ln;
    c.beginPath();
    c.moveTo(X(x), mt);
    c.lineTo(X(x), mt + ph);
    c.stroke();

    c.fillStyle = mut;
    c.textAlign = 'center';
    c.fillText(e, X(x), mt + ph + 14);
  }

  // Draw horizontal grid lines for friction factor
  for (let e = Math.floor(Math.log10(ya)) - 1; e <= Math.ceil(Math.log10(yb)); e++) {
    for (let m = 1; m < 10; m++) {
      const y = m * Math.pow(10, e);
      if (y < ya || y > yb) continue;

      c.strokeStyle = ln;
      c.globalAlpha = m === 1 ? 1 : 0.45;
      c.beginPath();
      c.moveTo(ml, Y(y));
      c.lineTo(ml + pw, Y(y));
      c.stroke();

      if (m === 1) {
        c.globalAlpha = 1;
        c.fillStyle = mut;
        c.textAlign = 'right';
        c.fillText(y.toExponential(0), ml - 6, Y(y) + 3);
      }
    }
  }

  c.globalAlpha = 1;
  c.fillStyle = mut;
  c.textAlign = 'center';
  c.fillText('Reynolds number', ml + pw / 2, H - 0);

  // Rotate the Y-axis title vertically
  c.save();
  c.translate(10, mt + ph / 2);
  c.rotate(-Math.PI / 2);
  c.fillText('Friction factor f', 0, 0);
  c.restore();

  // Draw the chart curves
  c.save();
  c.beginPath();
  c.rect(ml, mt, pw, ph);
  c.clip();

  const N = 400;
  const pts = [];
  for (let i = 0; i < N; i++) pts.push(Math.pow(10, 3 + 6 * i / (N - 1)));

  // Laminar line: 64 / Re
  c.strokeStyle = '#888';
  c.setLineDash([5, 4]);
  c.lineWidth = 1.8;
  c.beginPath();
  let first = true;
  pts.filter(r => r <= 2300).forEach(r => {
    first ? c.moveTo(X(r), Y(64 / r)) : c.lineTo(X(r), Y(64 / r));
    first = false;
  });
  c.stroke();
  c.setLineDash([]);

  // Turbulent roughness curves for different e/D values
  eds.forEach((e, i) => {
    c.strokeStyle = cols[i];
    c.lineWidth = 1.8;
    c.beginPath();
    pts.forEach((r, j) => {
      const y = friction(r, e);
      j ? c.lineTo(X(r), Y(y)) : c.moveTo(X(r), Y(y));
    });
    c.stroke();
  });

  // Mark the current operating point on the chart
  c.fillStyle = '#e11d48';
  c.beginPath();
  c.arc(X(R.Re), Y(R.f), 6, 0, 7);
  c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = 1.5;
  c.stroke();

  c.restore();
}

// ------------------------------------------------------------
// Step 5: Recalculate when something changes and update the UI
// ------------------------------------------------------------
function update() {
  R = calc();
  renderResults();

  // Only draw the Moody chart when the Moody tab is visible
  if (!document.getElementById('p2').classList.contains('hide')) {
    moody();
  }
}

// Tabs for Inputs / Results / Moody
const tabs = [0, 1, 2].map(i => document.getElementById('b' + i));
const pans = [0, 1, 2].map(i => document.getElementById('p' + i));

tabs.forEach((button, index) => {
  button.onclick = () => {
    tabs.forEach((tab, j) => {
      tab.className = j === index ? 'on' : '';
      pans[j].classList.toggle('hide', j !== index);
    });

    if (index === 2) moody();
    window.scrollTo(0, 0);
  };
});

// If the window changes size, redraw the Moody chart if it is open
window.addEventListener('resize', () => {
  if (!pans[2].classList.contains('hide')) moody();
});

// Initial run on page load
update();

// Register a service worker for offline support if available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
