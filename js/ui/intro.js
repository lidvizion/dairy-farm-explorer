// Video owns its lifecycle; a stalled or unavailable WebGL loop must never
// prevent playback, skipping, or reaching the learning experience.
export function playIntro({ video, root, playButton, skipButton, beginButton, status, onFinish, reducedMotion = false }) {
  let disposed = false;
  let finished = false;
  const listeners = new AbortController();
  const listen = (target, event, fn) => target.addEventListener(event, fn, { signal: listeners.signal });
  const finish = () => {
    if (disposed || finished) return;
    finished = true;
    onFinish();
  };
  const showPaused = (message) => {
    if (disposed) return;
    playButton.textContent = 'Play film';
    status.textContent = message;
  };
  const play = async () => {
    try {
      await video.play();
      if (disposed) return;
      playButton.textContent = 'Pause film';
      status.textContent = 'A journey from farm to flavor';
    } catch (_) {
      showPaused('Press Play film, or enter the journey whenever you’re ready.');
    }
  };
  root.classList.remove('hidden');
  video.classList.remove('hidden');
  skipButton.classList.remove('hidden');
  video.currentTime = 0;
  listen(video, 'ended', finish);
  listen(video, 'error', () => showPaused('The film couldn’t load. You can still enter the full journey.'));
  listen(video, 'waiting', () => { status.textContent = 'Loading film… You can enter the journey at any time.'; });
  listen(video, 'playing', () => { status.textContent = 'A journey from farm to flavor'; playButton.textContent = 'Pause film'; });
  listen(playButton, 'click', () => {
    if (video.paused) void play();
    else { video.pause(); showPaused('Film paused. Continue when you’re ready.'); }
  });
  listen(skipButton, 'click', finish);
  listen(beginButton, 'click', finish);
  if (reducedMotion) {
    video.pause();
    showPaused('Motion is paused to match your device preference. Play the film or enter the journey.');
  } else void play();
  return () => {
    disposed = true;
    listeners.abort();
    video.pause();
    video.classList.add('hidden');
    root.classList.add('hidden');
    skipButton.classList.add('hidden');
  };
}
