import { loadWellPath, saveWellPath } from './storage.js';

const state = loadWellPath();
const $ = (id) => document.getElementById(id);
const todayMinutes = () => state.exercises.reduce((sum, item) => sum + Number(item.minutes || 0), 0);

function refreshStats() {
  $('activeMinutes').textContent = todayMinutes();
  $('mealCount').textContent = state.meals.length;
}

async function ask(message) {
  const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || 'The AI could not answer.');
    error.fix = data.error?.fix;
    throw error;
  }
  return data.answer;
}

$('mealForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('mealInput');
  const button = event.submitter;
  const meal = input.value.trim();
  button.disabled = true; button.textContent = 'Thinking…';
  $('mealFeedback').hidden = false; $('mealFeedback').textContent = 'Thinking about your win…';
  try {
    const answer = await ask(`The student logged this meal: “${meal}”. Give a few sentences of encouraging, student-friendly feedback. Mention one helpful food or movement idea and ask gently if they are feeling okay. Never shame food or make medical claims.`);
    $('mealFeedback').textContent = answer;
    state.meals.push({ id: crypto.randomUUID(), name: meal, createdAt: new Date().toISOString() }); saveWellPath(state); refreshStats(); input.value = '';
  } catch (error) { $('mealFeedback').textContent = error.message; }
  button.disabled = false; button.textContent = 'Get feedback';
});

$('exerciseForm').addEventListener('submit', (event) => {
  event.preventDefault(); const name = $('exerciseInput').value.trim(); const minutes = Number($('minutesInput').value);
  if (!name || !minutes) return; state.exercises.push({ id: crypto.randomUUID(), name, minutes, createdAt: new Date().toISOString() }); saveWellPath(state); refreshStats(); $('exerciseNotice').hidden = false; $('exerciseNotice').textContent = `${minutes} active minutes added — nice work choosing movement that works for you.`; event.target.reset();
});

$('planButton').addEventListener('click', async (event) => {
  const button = event.currentTarget; button.disabled = true; button.textContent = 'Thinking…'; $('planOutput').innerHTML = '<div class="plan-placeholder">Making a flexible plan for your week…</div>';
  try {
    const answer = await ask('Make a simple, student-friendly 7-day plan with one encouraging meal idea and one gentle movement idea for each day. Keep it flexible, do not prescribe calories, and include a reminder to rest and ask a trusted adult for help if someone feels faint or very weak. Format each day as: Day: Meal — Movement.');
    $('planOutput').innerHTML = `<div class="answer plan-answer">${answer.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</div>`;
  } catch (error) { $('planOutput').innerHTML = `<div class="plan-placeholder">${error.message}</div>`; }
  button.disabled = false; button.textContent = 'Make my plan';
});

$('askForm').addEventListener('submit', async (event) => {
  event.preventDefault(); const input = $('askInput'); const button = $('askButton'); const status = $('askStatus'); const output = $('askOutput');
  button.disabled = true; button.textContent = 'Thinking…'; status.textContent = 'WellPath is thinking…'; output.hidden = true;
  try { output.textContent = await ask(input.value.trim()); output.hidden = false; status.textContent = ''; } catch (error) { status.textContent = error.message; }
  button.disabled = false; button.textContent = 'Ask WellPath AI';
});

refreshStats();
