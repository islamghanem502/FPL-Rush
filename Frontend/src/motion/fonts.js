// Remotion scenes should start with the display face, not swap into it mid-way.
// Google Fonts ships Arabic as its own subset, so ask for Arabic text explicitly.
// Never waits longer than 1.5s.
export const displayFontReady = () =>
  Promise.race([
    Promise.all([
      document.fonts?.load('900 100px Alexandria', 'جمعت كام نقطة؟'),
      document.fonts?.load('800 100px Alexandria', 'GW 0123456789'),
    ]),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]).catch(() => {});
