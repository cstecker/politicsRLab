(() => {
  let selected = 'all';
  const cards = [...document.querySelectorAll('.card')];
  const search = document.querySelector('#search');
  const normalize = value => value.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const update = () => {
    const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const card of cards) {
      const match = (selected === 'all' || card.dataset.kind === selected) && words.every(word => normalize(card.textContent).includes(word));
      card.hidden = !match;
      if (match) count++;
    }
    document.querySelector('#count').textContent = `${count} ${count === 1 ? 'Angebot' : 'Angebote'}`;
    document.querySelector('#empty').hidden = count > 0;
  };
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other => {
      const active = selected === other.dataset.filter;
      other.classList.toggle('active', active);
      other.setAttribute('aria-pressed', String(active));
    });
    update();
  }));
  search.addEventListener('input', update);
  update();
})();
