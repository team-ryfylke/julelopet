(() => {
  const results = window.julelopetResults ?? {};
  const names = new Map();
  const nameKey = name => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('nb-NO');
  const displayName = name => name.replace(/\p{L}+/gu, word =>
    /^(?:Mc|Mac|De|Di|Du|La|Le|Van|Von)\p{Lu}/u.test(word)
      ? word
      : word.replace(/(\p{Ll}{2})(?=\p{Lu}\p{Ll})/gu, '$1 '));

  for (const year of Object.keys(results).sort().reverse()) {
    for (const entry of results[year]) {
      const key = nameKey(displayName(entry.name));
      if (!names.has(key)) names.set(key, []);
      names.get(key).push({ ...entry, year });
    }
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'result-dialog';
  dialog.setAttribute('aria-labelledby', 'history-title');
  dialog.innerHTML = '<form method="dialog"><button type="submit">Lukk</button></form><h2 id="history-title"></h2><table class="results-table"><thead><tr><th scope="col">År</th><th scope="col">Tid</th><th scope="col">Pace</th></tr></thead><tbody></tbody></table>';
  document.body.append(dialog);
  const heading = dialog.querySelector('h2');
  const historyRows = dialog.querySelector('tbody');
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });

  function rowFor(values) {
    const row = document.createElement('tr');
    for (const value of values) row.insertCell().textContent = value;
    return row;
  }

  function renderName(cell, name, minimumResults = 1) {
    const entries = names.get(nameKey(displayName(name)));
    if (!entries || entries.length < minimumResults) {
      cell.textContent = name;
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'result-name';
    button.textContent = name;
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      heading.textContent = name;
      historyRows.replaceChildren(...entries.map(entry =>
        rowFor([entry.year, entry.time, entry.pace])));
      dialog.showModal();
    });
    cell.append(button);
  }

  window.julelopetHistory = { displayName, renderName };

  const table = document.querySelector('[data-results-year]');
  if (!table) return;
  const rows = results[table.dataset.resultsYear] ?? [];
  const body = table.querySelector('tbody');
  const search = document.querySelector('#results-search');
  const count = document.querySelector('#results-count');

  function renderResults() {
    const query = nameKey(search.value);
    const matching = rows.filter(entry => nameKey(displayName(entry.name)).includes(query));
    count.textContent = matching.length ? `Viser ${matching.length} av ${rows.length} resultater`
      : 'Ingen resultater samsvarer med søket.';
    body.replaceChildren(...matching.map(entry => {
      const row = rowFor([entry.place ?? '–', '', entry.time, entry.pace]);
      renderName(row.cells[1], displayName(entry.name), 2);
      return row;
    }));
  }

  search.addEventListener('input', renderResults);
  renderResults();
})();
