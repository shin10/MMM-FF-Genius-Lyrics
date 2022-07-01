/* Magic Mirror
 * Module: MMM-FF-Genius-Lyrics
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

const NodeHelper = require("node_helper");
const LyricFetcher = require("./lyricsFetcher.js");

module.exports = NodeHelper.create({
  fetcherInstances: [],

  start: function () {
    console.log("Starting node helper: " + this.name);
  },

  getFetcher: function (config) {
    let instance = this.fetcherInstances.filter(
      (instance) => instance.moduleId === config.moduleId
    )[0];
    if (!instance) {
      instance = new LyricFetcher(this, config);
      this.fetcherInstances.push(instance);
    }
    return instance;
  },

  socketNotificationReceived: function (notification, payload) {
    if (!payload.config) return;

    const fetcher = this.getFetcher(payload.config);

    switch (notification) {
      case "GET_LYRICS":
        fetcher.getLyrics(payload.songInfo);
        break;
      case "SUSPEND":
        fetcher.suspend();
        break;
      case "RESUME":
        fetcher.resume();
        break;
      default:
        break;
    }
  }
});
