(() => {
  const dialog = document.getElementById('course-dialog');
  const heading = document.getElementById('course-dialog-title');
  const body = dialog.querySelector('.course-dialog-body');
  const panels = [...body.querySelectorAll('[data-detail]')];
  let trigger;
  const scratchCards = new Map(panels.map(panel => [
    panel.dataset.detail, initScratchCard(panel.querySelector('.course-price')),
  ]));

  document.querySelectorAll('[data-program]').forEach(button => {
    button.addEventListener('click', () => {
      trigger = button;
      heading.textContent = button.querySelector('.row-title').textContent;
      for (const panel of panels) panel.hidden = panel.dataset.detail !== button.dataset.program;
      document.documentElement.classList.add('course-dialog-open');
      scratchCards.get(button.dataset.program)?.();
      dialog.showModal();
      body.scrollTop = 0;
    });
  });

  let pressedBackdrop = false;
  dialog.addEventListener('pointerdown', event => { pressedBackdrop = event.target === dialog; });
  dialog.addEventListener('click', event => {
    if (pressedBackdrop && event.target === dialog) dialog.close();
    pressedBackdrop = false;
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('course-dialog-open');
    trigger?.focus({ preventScroll: true });
  });

  function initScratchCard(ticket) {
    if (!ticket) return;
    const foil = ticket.querySelector('.scratch-foil');
    const surface = foil.parentElement;
    const skip = ticket.querySelector('.scratch-skip');
    const status = ticket.querySelector('.scratch-status');
    const value = ticket.querySelector('.tuition-value');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const context = foil.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const width = 640;
    const height = 250;
    foil.width = width;
    foil.height = height;
    const metal = context.createLinearGradient(0, 0, width, height);
    metal.addColorStop(0, '#909caf');
    metal.addColorStop(.24, '#d3dce4');
    metal.addColorStop(.45, '#f2f3f4');
    metal.addColorStop(.57, '#b8c5d8');
    metal.addColorStop(.76, '#dbe4ee');
    metal.addColorStop(1, '#92a0b7');

    let activePointer;
    let previous;
    let revealed = false;
    let revealAnimation;

    function release() {
      activePointer = undefined;
      previous = undefined;
      surface.style.removeProperty('--foil-tilt');
    }

    function resetScratch() {
      revealAnimation?.cancel();
      release();
      revealed = false;
      status.textContent = '';
      foil.style.removeProperty('pointer-events');
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = metal;
      context.fillRect(0, 0, width, height);
      for (let y = 0; y < height; y++) {
        context.fillStyle = y % 2 ? '#fff' : '#516581';
        context.globalAlpha = Math.random() * .17;
        context.fillRect(0, y, width, 1);
      }
      context.globalAlpha = 1;
      context.strokeStyle = '#ffffffaa';
      context.strokeRect(4, 4, width - 8, height - 8);
      drawFoilLabel();
      foil.hidden = false;
      skip.hidden = false;
    }

    function drawFoilLabel() {
      context.save();
      context.translate(width / 2, 76);
      context.rotate(-Math.PI / 9);
      context.strokeStyle = '#223651';
      context.lineWidth = 2.5;

      // The scraper and blade are drawn on the foil so the mark erases with it.
      context.beginPath();
      context.moveTo(-22, 11);
      context.lineTo(-15, -3);
      context.lineTo(-7, -3);
      context.lineTo(-7, -20);
      context.quadraticCurveTo(-7, -24, -3, -24);
      context.lineTo(3, -24);
      context.quadraticCurveTo(7, -24, 7, -20);
      context.lineTo(7, -3);
      context.lineTo(15, -3);
      context.lineTo(22, 11);
      context.closePath();
      context.stroke();
      context.beginPath();
      context.moveTo(-18, 16);
      context.lineTo(18, 16);
      context.stroke();
      context.restore();

      context.fillStyle = '#223651';
      context.font = 'italic 48px Georgia, serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Scratch to reveal', width / 2, 150);
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      release();
      if (document.activeElement === skip) value.focus({ preventScroll: true });
      skip.hidden = true;
      status.textContent = [...value.children].map(part => part.textContent).reverse().join(' ');
      foil.style.pointerEvents = 'none';
      if (reducedMotion.matches || !foil.animate) {
        foil.hidden = true;
        return;
      }
      revealAnimation = foil.animate([
        { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
        { opacity: 0, filter: 'blur(7px)', transform: 'scale(1.055)' },
      ], { duration: 420, easing: 'ease-out' });
      revealAnimation.onfinish = () => { foil.hidden = true; };
    }

    function scratch(event) {
      if (event.pointerId !== activePointer || revealed) return;
      const rect = surface.getBoundingClientRect();
      const x = (event.clientX - rect.left) * width / rect.width;
      const y = (event.clientY - rect.top) * height / rect.height;
      if (!reducedMotion.matches) surface.style.setProperty('--foil-tilt', `${(x / width - .5) * 7}deg`);

      context.globalCompositeOperation = 'destination-out';
      context.lineCap = 'round';
      context.lineWidth = 54;
      context.beginPath();
      context.moveTo(previous?.x ?? x, previous?.y ?? y);
      context.lineTo(x + .01, y);
      context.stroke();
      for (let i = 0; i < 7; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 23 + Math.random() * 10;
        context.beginPath();
        context.arc(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 1 + Math.random() * 3, 0, Math.PI * 2);
        context.fill();
      }
      previous = { x, y };
    }

    function checkCoverage() {
      if (revealed) return;
      const pixels = context.getImageData(0, 0, width, height).data;
      let cleared = 0;
      let samples = 0;
      for (let y = 4; y < height; y += 8) {
        for (let x = 4; x < width; x += 8) {
          samples++;
          if (pixels[(y * width + x) * 4 + 3] < 32) cleared++;
        }
      }
      if (cleared / samples >= .52) reveal();
    }

    foil.addEventListener('pointerdown', event => {
      if (activePointer !== undefined || event.button !== 0) return;
      activePointer = event.pointerId;
      foil.setPointerCapture(activePointer);
      scratch(event);
    });
    foil.addEventListener('pointermove', scratch);
    foil.addEventListener('pointerup', event => {
      if (event.pointerId !== activePointer) return;
      release();
      checkCoverage();
    });
    foil.addEventListener('lostpointercapture', release);
    skip.addEventListener('click', reveal);
    return resetScratch;
  }
})();
