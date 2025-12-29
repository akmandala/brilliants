document.addEventListener('click', (e) => {
  const details = document.querySelector('.nav-mobile');
  if (!details) return;

  // Close the mobile menu after tapping a link
  const link = e.target.closest('.nav-mobile-panel a');
  if (link && details.open) details.open = false;
});