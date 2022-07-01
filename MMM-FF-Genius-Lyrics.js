/* Magic Mirror
 * Module: MMM-FF-Genius-Lyrics
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

Module.register("MMM-FF-Genius-Lyrics", {
  defaults: {
    header: "Genius Lyrics",
    showTitle: true,
    animationSpeed: 1000,
    lyricsClasses: ["medium", "thin"],
    apiKey: null,
    events: {
      SPOTIFY_UPDATE_SONG_INFO: "SPOTIFY_UPDATE_SONG_INFO"
    }
  },

  init: function () {
    this.error = null;
    this.title = null;
    this.artist = null;
    this.lyrics = "";
    this.progress = 0;
    this._t = 0;
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.config.moduleId = this.identifier;
    this.sendSocketNotification("", { config: this.config });

    let efh = (t) => {
      window.requestAnimationFrame(efh);
      this.updateProgress(t);
    };

    efh(0);
  },

  updateProgress: function (t) {
    if (!this.lyrics || this.lyrics === "") return;

    let spotifyWrapper = document.getElementById("SPOTIFY");
    if (!spotifyWrapper) return;
    let isPlaying = spotifyWrapper.classList.contains("playing");
    if (!isPlaying) return;

    let progressBar = document.getElementById("SPOTIFY_PROGRESS_BAR");
    if (progressBar) {
      let val = parseInt(progressBar.getAttribute("value")) ?? 1;
      let max = parseInt(progressBar.getAttribute("max")) ?? 1;
      let progress = val / max;

      const lyricsWrapper = document.querySelector(
        `#${this.identifier} .lyrics-wrapper`
      );
      if (!lyricsWrapper) return;
      if (progress !== this.progress) {
        this.progress = progress;
        this._t = t;
        lyricsWrapper.scrollTop =
          (lyricsWrapper.scrollHeight - lyricsWrapper.clientHeight) *
          this.progress;
      } else {
        let p = (val + (t - this._t)) / max;
        lyricsWrapper.scrollTop =
          (lyricsWrapper.scrollHeight - lyricsWrapper.clientHeight) * p;
      }
    }
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return [this.file("./styles/MMM-FF-Genius-Lyrics.css")];
  },

  getHeader: function () {
    if (!this.config.showTitle) return null;

    if (!this.artist) return this.data.header;

    return `${this.artist} "${this.title}"`;
  },

  getDom: function () {
    var wrapper = document.createElement("div");

    if (this.error) {
      wrapper.innerHTML = "ERROR<br>" + JSON.stringify(this.error);
      wrapper.className = "light small error";
      return wrapper;
    }

    let loaded = this.lyrics !== "";
    if (!loaded) {
      var loader = document.createElement("div");
      loader.classList.add("lyrics-wrapper");
      loader.innerHTML = this.translate("LOADING");
      loader.className = "loading light small dimmed";
      wrapper.appendChild(loader);
      return wrapper;
    }

    var lyricsWrapper = document.createElement("div");
    lyricsWrapper.classList.add("lyrics-wrapper");

    var lyricsElement = document.createElement("div");
    lyricsElement.classList.add("lyrics");
    lyricsElement.classList.add(...this.config.lyricsClasses);
    lyricsElement.innerText = this.lyrics;
    lyricsWrapper.appendChild(lyricsElement);

    wrapper.appendChild(lyricsWrapper);

    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (!payload.config || payload.config.moduleId !== this.config.moduleId)
      return;

    switch (notification) {
      case "ERROR":
        this.error = payload;
        this.updateDom(this.config.animationSpeed);
        break;
      case "UPDATE_LYRICS":
        this.error = null;
        this.lyrics = payload.config.lyrics;
        this.title = payload.config.title;
        this.artist = payload.config.artist;
        this.updateDom(this.config.animationSpeed);
        break;
      default:
        break;
    }
  },

  isAcceptableSender(sender) {
    if (!sender) return false;
    const acceptableSender = this.config.events.sender;
    return (
      !acceptableSender ||
      acceptableSender === sender.name ||
      acceptableSender === sender.identifier ||
      (Array.isArray(acceptableSender) &&
        (acceptableSender.includes(sender.name) ||
          acceptableSender.includes(sender.identifier)))
    );
  },

  showLoader: function () {
    this.init();
    this.updateDom(this.config.animationSpeed);
  },

  notificationReceived: function (notification, payload, sender) {
    if (!this.isAcceptableSender(sender)) return;

    this.config.events[notification]?.split(" ").forEach((e) => {
      switch (e) {
        case "SPOTIFY_UPDATE_SONG_INFO":
          if (!this.hidden) {
            this.title = payload?.name;
            this.artist = payload?.artists?.[0]?.name;
            this.showLoader();
            this.sendSocketNotification("GET_LYRICS", {
              config: this.config,
              songInfo: payload
            });
          }
          break;
        default:
          break;
      }
    });
  },

  suspend: function () {
    this.suspended = true;
    this.sendSocketNotification("SUSPEND", { config: this.config });
  },

  resume: function () {
    if (this.suspended === false) return;
    this.suspended = false;
    this.sendSocketNotification("RESUME", { config: this.config });
  }
});
