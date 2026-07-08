const AXIS_LIMITS = [0, 100];
const ONE_D_PALETTE = {
  A1: "#33658A",
  A2: "#86BBD8",
  A3: "#758E4F",
  A4: "#F6AE2D",
  A5: "#F26419"
};

const DEFAULT_STATE = {
  sq: 65,
  ideals: { A1: 15, A2: 35, A3: 50, A4: 70, A5: 85 },
  ruleSize: 3,
  showWinset: true
};

const state = structuredClone(DEFAULT_STATE);

const controls = {
  showWinset: document.getElementById("show-winset"),
  decisionRule: document.getElementById("decision-rule"),
  sq: document.getElementById("control-sq"),
  A1: document.getElementById("control-a1"),
  A2: document.getElementById("control-a2"),
  A3: document.getElementById("control-a3"),
  A4: document.getElementById("control-a4"),
  A5: document.getElementById("control-a5"),
  presetDefault: document.getElementById("preset-default"),
  presetMedian: document.getElementById("preset-median"),
  svgHost: document.getElementById("svg-host"),
  explanation: document.getElementById("explanation-text")
};

let distanceChart;
let dragState = null;

function clampToLimits(value) {
  return Math.min(AXIS_LIMITS[1], Math.max(AXIS_LIMITS[0], value));
}

function formatPolicyValue(value) {
  return String(Math.round(value));
}

function decisionRuleLabel(ruleSize, actorCount) {
  if (ruleSize === Math.floor(actorCount / 2) + 1) {
    return `Absolute Mehrheit (${ruleSize}/${actorCount})`;
  }
  if (ruleSize === actorCount - 1) {
    return `Supermajorität (${ruleSize}/${actorCount})`;
  }
  if (ruleSize === actorCount) {
    return "Einstimmigkeit";
  }
  return `${ruleSize}/${actorCount}`;
}

function makeActors() {
  const labels = Object.keys(state.ideals);
  return labels.map((actor, index) => ({
    actor,
    ideal: state.ideals[actor],
    row: labels.length - index
  }));
}

function preferredInterval(ideal, statusQuo) {
  const radius = Math.abs(statusQuo - ideal);
  if (radius <= 0) {
    return null;
  }
  return {
    xmin: Math.max(AXIS_LIMITS[0], ideal - radius),
    xmax: Math.min(AXIS_LIMITS[1], ideal + radius)
  };
}

function preferredIntervals(actors, statusQuo) {
  return actors
    .map((actor) => {
      const interval = preferredInterval(actor.ideal, statusQuo);
      return interval ? { ...actor, ...interval } : null;
    })
    .filter(Boolean);
}

function supporters1d(points, ideals, statusQuo) {
  return points.map((point) =>
    ideals.reduce(
      (count, ideal) => count + ((Math.abs(point - ideal) + 1e-9 < Math.abs(statusQuo - ideal)) ? 1 : 0),
      0
    )
  );
}

function booleanRuns(values, keep) {
  const segments = [];
  let startIndex = null;

  for (let index = 0; index < keep.length; index += 1) {
    if (keep[index] && startIndex === null) {
      startIndex = index;
    }
    if ((!keep[index] || index === keep.length - 1) && startIndex !== null) {
      const endIndex = keep[index] && index === keep.length - 1 ? index : index - 1;
      segments.push({
        xmin: values[startIndex],
        xmax: values[endIndex]
      });
      startIndex = null;
    }
  }

  return segments;
}

function computeWinset1d(ideals, statusQuo, ruleSize, resolution = 401) {
  const step = (AXIS_LIMITS[1] - AXIS_LIMITS[0]) / (resolution - 1);
  const grid = Array.from({ length: resolution }, (_, index) => AXIS_LIMITS[0] + index * step);
  const supporters = supporters1d(grid, ideals, statusQuo);
  const inWinset = supporters.map((count) => count >= ruleSize);

  return {
    grid,
    supporters,
    majorityRule: ruleSize,
    inWinset,
    segments: booleanRuns(grid, inWinset)
  };
}

function sumAbsoluteDistance(ideals, statusQuo) {
  return ideals.reduce((sum, ideal) => sum + Math.abs(ideal - statusQuo), 0);
}

function medianActorLabel(actors) {
  const ordered = [...actors].sort((left, right) => left.ideal - right.ideal);
  return ordered[Math.floor(ordered.length / 2)].actor;
}

function medianPosition(actors) {
  const ordered = [...actors].map((actor) => actor.ideal).sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
}

function policyToSvg(value, left, right) {
  return left + ((value - AXIS_LIMITS[0]) / (AXIS_LIMITS[1] - AXIS_LIMITS[0])) * (right - left);
}

function createSvgMarkup() {
  const actors = makeActors();
  const intervals = preferredIntervals(actors, state.sq);
  const winset = computeWinset1d(actors.map((actor) => actor.ideal), state.sq, state.ruleSize);

  const svgWidth = 920;
  const svgHeight = 390;
  const left = 115;
  const right = 865;
  const axisY = 315;
  const intervalRows = [255, 225, 195, 165, 135];
  const winsetY = 90;
  const guideTop = 55;

  const ticks = Array.from({ length: 11 }, (_, index) => index * 10);
  const sqX = policyToSvg(state.sq, left, right);
  const ruleLabel = decisionRuleLabel(state.ruleSize, actors.length);

  const intervalMarkup = intervals.map((interval) => {
    const intervalY = intervalRows[Number(interval.actor.slice(1)) - 1];
    return `
      <line
        x1="${policyToSvg(interval.xmin, left, right)}"
        x2="${policyToSvg(interval.xmax, left, right)}"
        y1="${intervalY}"
        y2="${intervalY}"
        stroke="${ONE_D_PALETTE[interval.actor]}"
        stroke-width="12"
        stroke-linecap="round"
        opacity="0.6"
      />
    `;
  }).join("");

  const winsetMarkup = state.showWinset
    ? (winset.segments.length > 0
        ? winset.segments.map((segment) => `
            <line
              x1="${policyToSvg(segment.xmin, left, right)}"
              x2="${policyToSvg(segment.xmax, left, right)}"
              y1="${winsetY}"
              y2="${winsetY}"
              stroke="#C1121F"
              stroke-width="16"
              stroke-linecap="round"
              opacity="0.9"
            />
          `).join("")
        : `
          <text x="${left + 2}" y="${winsetY + 4}" fill="#C1121F" style="font-size: 13px; font-family: sans-serif;">
            leer
          </text>
        `)
    : "";

  const actorLabelMarkup = actors.map((actor, index) => `
    <text
      x="24"
      y="${intervalRows[index] + 5}"
      fill="${ONE_D_PALETTE[actor.actor]}"
      style="font-size: 14px; font-weight: 600; font-family: sans-serif;"
    >
      P${index + 1}(y)
    </text>
  `).join("");

  const tickMarkup = ticks.map((tick) => {
    const tickX = policyToSvg(tick, left, right);
    return `
      <line x1="${tickX}" x2="${tickX}" y1="${axisY - 8}" y2="${axisY + 8}" stroke="#333333" stroke-width="1.2" />
      <text x="${tickX}" y="${axisY + 28}" text-anchor="middle" fill="#4F4F4F" style="font-size: 12px; font-family: sans-serif;">
        ${tick}
      </text>
    `;
  }).join("");

  const actorPointMarkup = actors.map((actor) => {
    const pointX = policyToSvg(actor.ideal, left, right);
    return `
      <circle
        cx="${pointX}"
        cy="${axisY}"
        r="10"
        fill="${ONE_D_PALETTE[actor.actor]}"
        stroke="white"
        stroke-width="2.5"
        class="spatial-1d-handle"
        data-drag-id="${actor.actor}"
        style="cursor: ew-resize;"
      />
      <text
        x="${pointX}"
        y="${axisY - 18}"
        text-anchor="middle"
        fill="${ONE_D_PALETTE[actor.actor]}"
        style="font-size: 13px; font-weight: 600; font-family: sans-serif;"
      >
        ${actor.actor}
      </text>
      <text
        x="${pointX}"
        y="${axisY + 52}"
        text-anchor="middle"
        fill="#4F4F4F"
        style="font-size: 12px; font-family: sans-serif;"
      >
        ${formatPolicyValue(actor.ideal)}
      </text>
    `;
  }).join("");

  return `
    <svg
      viewBox="0 0 ${svgWidth} ${svgHeight}"
      data-spatial-1d="true"
      data-left="${left}"
      data-right="${right}"
      data-min="${AXIS_LIMITS[0]}"
      data-max="${AXIS_LIMITS[1]}"
      style="touch-action: none; user-select: none;"
    >
      <rect x="1" y="1" width="${svgWidth - 2}" height="${svgHeight - 2}" rx="18" ry="18" fill="#FAFAF7" stroke="#D8D8D2" stroke-width="1" />
      <text x="${left}" y="28" fill="#1F1F1F" style="font-size: 22px; font-weight: 600; font-family: sans-serif;">
        Eindimensionales Modell: Idealpunkte, Präferenzmengen und Winset
      </text>
      <text x="${left}" y="48" fill="#555555" style="font-size: 13px; font-family: sans-serif;">
        Idealpunkte und Status quo lassen sich direkt mit der Maus horizontal verschieben. Regel: ${ruleLabel}.
      </text>
      <line x1="${sqX}" x2="${sqX}" y1="${guideTop}" y2="${axisY + 20}" stroke="#444444" stroke-width="2" stroke-dasharray="7 6" />
      <text x="${sqX}" y="68" text-anchor="middle" fill="#333333" style="font-size: 12px; font-family: sans-serif;">Status quo y</text>
      <line x1="${left}" x2="${right}" y1="${axisY}" y2="${axisY}" stroke="#333333" stroke-width="2.4" />
      <text x="28" y="${winsetY + 5}" fill="#C1121F" style="font-size: 14px; font-weight: 600; font-family: sans-serif;">W(y)</text>
      ${tickMarkup}
      ${actorLabelMarkup}
      ${intervalMarkup}
      ${winsetMarkup}
      ${actorPointMarkup}
      <polygon
        points="${sqX},${axisY - 18} ${sqX + 12},${axisY - 6} ${sqX},${axisY + 6} ${sqX - 12},${axisY - 6}"
        fill="#2F2F2F"
        stroke="white"
        stroke-width="2"
        class="spatial-1d-handle"
        data-drag-id="sq"
        style="cursor: ew-resize;"
      />
      <text x="${sqX}" y="${axisY + 68}" text-anchor="middle" fill="#2F2F2F" style="font-size: 12px; font-family: sans-serif;">
        y = ${formatPolicyValue(state.sq)}
      </text>
    </svg>
  `;
}

function buildExplanation() {
  const actors = makeActors();
  const winset = computeWinset1d(actors.map((actor) => actor.ideal), state.sq, state.ruleSize);
  const ruleLabel = decisionRuleLabel(state.ruleSize, actors.length);
  const medianActor = medianActorLabel(actors);
  const medianPoint = state.ideals[medianActor];

  if (winset.segments.length === 0) {
    return `Die Gewinnmenge ist leer. Unter ${ruleLabel} findet sich kein Punkt, der den Status quo y = ${state.sq} schlägt. Der Medianakteur ist ${medianActor} bei ${medianPoint}.`;
  }

  const ranges = winset.segments
    .map((segment) => `[${segment.xmin.toFixed(1)}, ${segment.xmax.toFixed(1)}]`)
    .join(" und ");

  return `${ruleLabel}: mindestens ${winset.majorityRule} zustimmende Akteure. Aktuell liegt W(y) ungefähr in ${ranges}. Der Medianakteur ist ${medianActor} bei ${medianPoint}.`;
}

function updateControlsFromState() {
  controls.showWinset.checked = state.showWinset;
  controls.decisionRule.value = String(state.ruleSize);
  controls.sq.value = state.sq;
  controls.A1.value = state.ideals.A1;
  controls.A2.value = state.ideals.A2;
  controls.A3.value = state.ideals.A3;
  controls.A4.value = state.ideals.A4;
  controls.A5.value = state.ideals.A5;
}

function renderSvg() {
  controls.svgHost.innerHTML = createSvgMarkup();
}

function renderDistanceChart() {
  const actors = makeActors();
  const medianPoint = medianPosition(actors);
  const totalDistance = sumAbsoluteDistance(actors.map((actor) => actor.ideal), state.sq);

  if (!distanceChart) {
    distanceChart = new Chart(document.getElementById("distance-chart"), {
      type: "bar",
      data: {
        labels: ["Aktueller SQ"],
        datasets: [{
          data: [totalDistance],
          backgroundColor: ["#C1121F"],
          borderRadius: 8,
          maxBarThickness: 90
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Summe der absoluten Abweichungen aller Idealpunkte vom Status quo",
            color: "#1F1F1F",
            font: { size: 16, weight: "600" },
            padding: { bottom: 8 }
          },
          subtitle: {
            display: true,
            text: `Diese Summe wird im eindimensionalen Raum durch den Median minimiert. Medianposition: ${medianPoint}.`,
            color: "#5E5E57",
            font: { size: 12 }
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `Summe |Idealpunkt - SQ|: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#444444", font: { weight: "600" } }
          },
          y: {
            min: 0,
            max: 300,
            ticks: {
              stepSize: 50,
              color: "#555555"
            },
            title: {
              display: true,
              text: "Summe |Idealpunkt - SQ|",
              color: "#444444"
            }
          }
        }
      },
      plugins: [{
        id: "valueLabel",
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);
          const value = chart.data.datasets[0].data[0];
          const bar = meta.data[0];
          if (!bar) {
            return;
          }
          ctx.save();
          ctx.fillStyle = "#1F1F1F";
          ctx.font = "600 14px Segoe UI";
          ctx.textAlign = "center";
          ctx.fillText(String(value), bar.x, bar.y - 10);
          ctx.restore();
        }
      }]
    });
    return;
  }

  distanceChart.data.datasets[0].data[0] = totalDistance;
  distanceChart.options.plugins.subtitle.text =
    `Diese Summe wird im eindimensionalen Raum durch den Median minimiert. Medianposition: ${medianPoint}.`;
  distanceChart.update();
}

function renderExplanation() {
  controls.explanation.textContent = buildExplanation();
}

function renderAll() {
  updateControlsFromState();
  renderSvg();
  renderDistanceChart();
  renderExplanation();
}

function setStateValue(key, value) {
  const rounded = Math.round(clampToLimits(Number(value)));
  if (Number.isNaN(rounded)) {
    return;
  }

  if (key === "sq") {
    state.sq = rounded;
    return;
  }

  state.ideals[key] = rounded;
}

function bindControls() {
  controls.showWinset.addEventListener("change", () => {
    state.showWinset = controls.showWinset.checked;
    renderAll();
  });

  controls.decisionRule.addEventListener("change", () => {
    state.ruleSize = Number(controls.decisionRule.value);
    renderAll();
  });

  controls.sq.addEventListener("input", () => {
    setStateValue("sq", controls.sq.value);
    renderAll();
  });

  ["A1", "A2", "A3", "A4", "A5"].forEach((actor) => {
    controls[actor].addEventListener("input", () => {
      setStateValue(actor, controls[actor].value);
      renderAll();
    });
  });

  controls.presetDefault.addEventListener("click", () => {
    state.sq = DEFAULT_STATE.sq;
    state.ideals = structuredClone(DEFAULT_STATE.ideals);
    state.ruleSize = DEFAULT_STATE.ruleSize;
    state.showWinset = DEFAULT_STATE.showWinset;
    renderAll();
  });

  controls.presetMedian.addEventListener("click", () => {
    const ordered = Object.values(state.ideals).slice().sort((left, right) => left - right);
    state.sq = ordered[Math.floor(ordered.length / 2)];
    renderAll();
  });
}

function currentSvg() {
  return document.querySelector("svg[data-spatial-1d='true']");
}

function valueFromPointer(event, svg) {
  if (!svg) {
    return null;
  }

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return null;
  }

  const local = point.matrixTransform(ctm.inverse());
  const left = Number(svg.dataset.left);
  const right = Number(svg.dataset.right);
  const min = Number(svg.dataset.min);
  const max = Number(svg.dataset.max);
  const x = Math.min(right, Math.max(left, local.x));

  return min + ((x - left) / (right - left)) * (max - min);
}

function bindDragging() {
  document.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".spatial-1d-handle");
    if (!handle) {
      return;
    }

    const svg = handle.closest("svg[data-spatial-1d='true']");
    if (!svg) {
      return;
    }

    dragState = {
      target: handle.dataset.dragId,
      svg
    };

    const value = valueFromPointer(event, svg);
    if (value !== null) {
      if (dragState.target === "sq") {
        setStateValue("sq", value);
      } else {
        setStateValue(dragState.target, value);
      }
      renderAll();
    }

    event.preventDefault();
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState) {
      return;
    }

    const value = valueFromPointer(event, currentSvg() || dragState.svg);
    if (value === null) {
      return;
    }

    if (dragState.target === "sq") {
      setStateValue("sq", value);
    } else {
      setStateValue(dragState.target, value);
    }
    renderAll();
    event.preventDefault();
  });

  document.addEventListener("pointerup", () => {
    dragState = null;
  });
}

bindControls();
bindDragging();
renderAll();
