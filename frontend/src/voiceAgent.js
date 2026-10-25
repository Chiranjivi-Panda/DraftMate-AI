/**
 * DraftMate Voice Agent (browser)
 * Uses Web Speech API (SpeechRecognition + SpeechSynthesis)
 * + backend intent parser / confirm gate / action queue.
 */
(function (global) {
  "use strict";

  const API_BASE = global.DRAFTMATE_API || "http://127.0.0.1:8000";

  class VoiceAgent {
    constructor(options = {}) {
      this.apiBase = options.apiBase || API_BASE;
      this.lang = options.lang || "en-US";
      this.continuous = options.continuous || false;
      this.onResult = options.onResult || (() => {});
      this.onSpeech = options.onSpeech || (() => {});
      this.onState = options.onState || (() => {});
      this.onError = options.onError || console.error;

      this._recognition = null;
      this._listening = false;
      this._supported = this._checkSupport();
    }

    _checkSupport() {
      const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
      const SS = global.speechSynthesis;
      return Boolean(SR && SS);
    }

    get supported() {
      return this._supported;
    }

    get listening() {
      return this._listening;
    }

    _createRecognition() {
      const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = this.lang;
      rec.continuous = this.continuous;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this._listening = true;
        this.onState({ listening: true });
      };
      rec.onend = () => {
        this._listening = false;
        this.onState({ listening: false });
      };
      rec.onerror = (e) => {
        this._listening = false;
        this.onError(e.error || e);
        this.onState({ listening: false, error: e.error });
      };
      rec.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        if (final) {
          this._handleFinal(final.trim());
        } else if (interim) {
          this.onResult({ interim, final: null });
        }
      };
      return rec;
    }

    async _handleFinal(utterance) {
      this.onResult({ interim: null, final: utterance });
      try {
        const res = await fetch(`${this.apiBase}/voice/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ utterance }),
        });
        const data = await res.json();
        this.onResult({ interim: null, final: utterance, backend: data });
        if (data.speech) {
          this.speak(data.speech);
        }
        this.onState({ lastAction: data });
        return data;
      } catch (err) {
        this.onError(err);
        this.speak("Sorry, I could not reach the server.");
        return null;
      }
    }

    start() {
      if (!this._supported) {
        this.onError("Web Speech API not supported in this browser.");
        return false;
      }
      if (this._listening) return true;
      this._recognition = this._createRecognition();
      try {
        this._recognition.start();
        return true;
      } catch (e) {
        this.onError(e);
        return false;
      }
    }

    stop() {
      if (this._recognition && this._listening) {
        this._recognition.stop();
      }
    }

    abort() {
      if (this._recognition) {
        this._recognition.abort();
        this._listening = false;
      }
    }

    speak(text, options = {}) {
      if (!global.speechSynthesis) return;
      global.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = options.lang || this.lang;
      u.rate = options.rate || 1.0;
      u.pitch = options.pitch || 1.0;
      u.onend = () => this.onSpeech({ done: true, text });
      global.speechSynthesis.speak(u);
      this.onSpeech({ started: true, text });
    }

    /** Push-to-talk helper: start, wait for silence / timeout, then stop */
    async listenOnce(timeoutMs = 8000) {
      return new Promise((resolve) => {
        const prevOnResult = this.onResult;
        const timer = setTimeout(() => {
          this.stop();
          this.onResult = prevOnResult;
          resolve(null);
        }, timeoutMs);

        this.onResult = (payload) => {
          prevOnResult(payload);
          if (payload.final) {
            clearTimeout(timer);
            this.stop();
            this.onResult = prevOnResult;
            resolve(payload);
          }
        };
        this.start();
      });
    }
  }

  // Minimal UI helper
  function createVoiceButton(container, agent) {
    const btn = document.createElement("button");
    btn.textContent = "🎤 Voice";
    btn.setAttribute("aria-label", "Toggle voice input");
    btn.style.cssText =
      "padding:8px 16px;border-radius:20px;border:1px solid #1A56DB;background:#1A56DB;color:#fff;cursor:pointer;font-weight:600;";
    btn.addEventListener("click", () => {
      if (agent.listening) {
        agent.stop();
        btn.textContent = "🎤 Voice";
        btn.style.background = "#1A56DB";
      } else {
        agent.start();
        btn.textContent = "⏹ Listening…";
        btn.style.background = "#E02424";
      }
    });
    agent.onState = (s) => {
      if (!s.listening) {
        btn.textContent = "🎤 Voice";
        btn.style.background = "#1A56DB";
      }
    };
    (container || document.body).appendChild(btn);
    return btn;
  }

  global.DraftMateVoice = { VoiceAgent, createVoiceButton };
})(typeof window !== "undefined" ? window : globalThis);
