export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02; u.lang = "en-IN";
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}
