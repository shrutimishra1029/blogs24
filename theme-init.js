try {
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.documentElement.dataset.theme = 'dark';
  }
} catch (error) {
  console.error('Unable to read the saved theme preference:', error);
}

document.addEventListener('DOMContentLoaded', () => {
  const dateElement = document.querySelector('.header-top .date');
  if (!dateElement) return;

  const updateDate = () => {
    dateElement.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  };

  updateDate();
  window.setInterval(updateDate, 60_000);
});
