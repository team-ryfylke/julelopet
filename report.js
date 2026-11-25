const data = window.julelopet;
const summary = document.querySelector('#summary');

if (!data) {
  summary.textContent = 'Deltakerdata kunne ikke lastes.';
} else {
  renderReport(data);
}

function renderReport(data) {
  const search = document.querySelector('#search');
  const start = document.querySelector('#start');
  const participants = document.querySelector('#participants');
  const count = document.querySelector('#count');
  const collator = new Intl.Collator('nb-NO');
  const number = new Intl.NumberFormat('nb-NO');
  const timestamp = new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Oslo',
  }).format(new Date(data.updatedAt));

  summary.textContent = `${number.format(data.participants.length)} påmeldte · Oppdatert ${timestamp}`;

  const sorted = data.participants.map(person => ({
    ...person,
    name: person.name.replace(/\p{L}+/gu, word =>
      /^(?:Mc|Mac|De|Di|Du|La|Le|Van|Von)\p{Lu}/u.test(word)
        ? word
        : word.replace(/(\p{Ll}{2})(?=\p{Lu}\p{Ll})/gu, '$1 ')),
  })).sort((a, b) =>
    collator.compare(b.start || '', a.start || '') || collator.compare(a.name, b.name));
  const startTimes = [...new Set(sorted.map(person => person.start || 'ukjent'))];
  const colors = ['#dbeaff', '#f0f6ff'];
  const groupColors = new Map(startTimes.map((time, index) => [time, colors[index % colors.length]]));
  const finishMinutes = 11 * 60 + 40;
  for (const time of startTimes) {
    start.add(new Option(time === 'ukjent' ? 'Ikke oppgitt' : time, time));
  }

  function showParticipants() {
    const query = search.value.trim().toLocaleLowerCase('nb-NO');
    const matching = sorted.filter(person =>
      person.name.toLocaleLowerCase('nb-NO').includes(query) &&
      (!start.value || (person.start || 'ukjent') === start.value));
    count.textContent = matching.length
      ? `Viser ${matching.length} av ${sorted.length} påmeldte`
      : 'Ingen påmeldte samsvarer med søket.';
    participants.replaceChildren(...matching.map((person, index) => {
      const row = document.createElement('tr');
      const firstInGroup = index === 0 || person.start !== matching[index - 1].start;
      row.classList.toggle('group-first', firstInGroup);
      row.style.setProperty('--group-color', groupColors.get(person.start || 'ukjent'));
      row.insertCell().textContent = person.name;
      const [hours, minutes] = (person.start || '').split(':').map(Number);
      const duration = finishMinutes - hours * 60 - minutes;
      const times = [person.start || '–', duration > 0 ? `${duration} min` : '–'];
      for (const time of times) {
        const cell = row.insertCell();
        cell.className = 'time';
        const label = document.createElement('span');
        label.textContent = time;
        if (!firstInGroup) label.className = 'sr-only';
        cell.append(label);
      }
      return row;
    }));
  }

  search.addEventListener('input', showParticipants);
  start.addEventListener('change', showParticipants);
  showParticipants();

  const chart = document.querySelector('#donations');
  const maximum = Math.max(1, ...data.donations.map(entry => entry.total));
  for (const entry of data.donations) {
    const column = document.createElement('div');
    column.className = entry.year === data.year ? 'column current' : 'column';
    const plot = document.createElement('div');
    plot.className = 'plot';
    const amount = document.createElement('div');
    amount.className = 'amount';
    amount.textContent = `${number.format(entry.total)} kr`;
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.setProperty('--height', `${80 * entry.total / maximum}%`);
    const year = document.createElement('div');
    year.className = 'year';
    year.textContent = entry.year;
    plot.append(amount, bar);
    column.append(plot, year);
    chart.append(column);
  }
}
