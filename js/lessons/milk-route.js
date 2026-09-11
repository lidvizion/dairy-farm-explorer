import { el } from '../ui/dom.js';
import { shuffled, feedbackRegion } from './presentation.js';

export function renderMilkRoute(host, game, onSolved) {
  const order = [], steps = game.steps.map((step, index) => ({ ...step, index }));
  const pool = shuffled(steps);
  const route = el('div', 'milk-route'); route.setAttribute('aria-label', game.routeLabel || 'Your route');
  const counter = el('p', 'activity-counter', '0 of 4 steps placed');
  const choices = el('div', 'route-choices');
  const tank = el('div', 'cooling-demo');
  tank.innerHTML = game.cool?.html || ''; tank.hidden=!game.cool;
  host.append(counter, route, choices, tank);
  const feedback = feedbackRegion(host), actions = el('div', 'btnrow activity-actions');
  const undo = el('button', 'btn btn-ghost', 'Undo last step');
  const clear = el('button', 'btn btn-ghost', 'Clear route');
  const run = el('button', 'btn btn-primary', game.cool?.start || 'Check order');
  const pause = el('button', 'btn btn-ghost hidden', 'Pause demonstration');
  actions.append(undo, clear, run, pause); host.append(actions);
  let running = false, paused = false, frame = null;
  const lifecycle = new AbortController();
  function dispose() { cancelAnimationFrame(frame); lifecycle.abort(); }
  document.addEventListener('rcm:modalclose', dispose, { signal: lifecycle.signal });
  document.addEventListener('rcm:modalopen', dispose, { signal: lifecycle.signal });
  function redraw(placedIndex = -1) {
    route.replaceChildren(); choices.replaceChildren();
    const firstWrong = order.findIndex((step, index) => step.index !== index);
    const connected = firstWrong === -1 ? order.length : firstWrong;
    steps.forEach((_, index) => {
      const step = order[index];
      const node = el('div', 'route-step' + (step ? ' filled' : ''));
      node.innerHTML = `<span class="route-number">0${index + 1}</span><span class="route-icon" aria-hidden="true">${step ? step.ic : '+'}</span><span>${step ? step.t : 'Choose a step'}</span>`;
      if (index < connected) {
        node.classList.add('connected');
        node.append(el('span', 'route-confirmation', '✓ Connected'));
        if (index === placedIndex) node.classList.add('just-connected');
      }
      route.append(node);
    });
    for (const step of pool.filter(step => !order.includes(step))) {
      const button = el('button', 'pick', `<span aria-hidden="true">${step.ic}</span><span>${step.t}</span>`);
      button.onclick = () => {
        order.push(step);
        const correct = order.every((item, index) => item.index === index);
        feedback.dataset.state = correct ? 'success' : 'retry';
        feedback.textContent = correct
          ? `Step ${order.length} connected: ${step.t}.${order.length === steps.length ? ` Route ready—select ${game.cool?.start || 'Check order'} to continue.` : ' Choose the next step.'}`
          : `Not quite—check step ${order.findIndex((item, index) => item.index !== index) + 1}. Use Undo last step or Clear route to adjust your plan.`;
        redraw(order.length - 1);
      };
      choices.append(button);
    }
    counter.textContent = `${order.length} of ${steps.length} steps placed`;
    undo.disabled = clear.disabled = !order.length || running;
    run.disabled = order.length !== steps.length || running;
  }
  undo.onclick = () => { order.pop(); feedback.textContent = ''; redraw(); };
  clear.onclick = () => { order.length = 0; feedback.textContent = ''; redraw(); };
  pause.onclick = () => {
    paused = !paused;
    pause.textContent = paused ? 'Resume demonstration' : 'Pause demonstration';
    route.classList.toggle('paused', paused);
    tank.querySelector('#coolTemp').textContent = paused ? 'Demonstration paused' : game.cool.running;
  };
  run.onclick = () => {
    const wrong = order.findIndex((step, index) => step.index !== index);
    if (wrong !== -1) {
      feedback.dataset.state = 'retry';
      feedback.textContent = `Not quite—check step ${wrong + 1}. ${steps[wrong].t}. Use Undo last step or Clear route to adjust your plan.`;
      return;
    }
    if(!game.cool){feedback.textContent=game.success;actions.remove();dispose();onSolved();return;}
    running = true; redraw();
    route.classList.add('flowing'); run.classList.add('hidden'); pause.classList.remove('hidden');
    feedback.textContent = game.cool.connected;
    tank.querySelector('#coolTemp').textContent = game.cool.running;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let elapsed = 0, last = performance.now();
    const duration = reduced ? 0 : 2200;
    const tick = now => {
      if (lifecycle.signal.aborted || !host.isConnected) { dispose(); return; }
      if (!paused) elapsed += now - last;
      last = now;
      const progress = duration ? Math.min(1, elapsed / duration) : 1;
      tank.style.setProperty('--cool-progress', progress);
      if (progress < 1) { frame = requestAnimationFrame(tick); return; }
      route.classList.remove('flowing'); route.classList.add('delivered');
      tank.classList.add('cold'); tank.querySelector('#coolTemp').textContent = game.cool.finished;
      feedback.dataset.state = 'success'; feedback.textContent = game.success;
      actions.remove(); dispose(); onSolved();
    };
    frame = requestAnimationFrame(tick);
  };
  redraw();
}
