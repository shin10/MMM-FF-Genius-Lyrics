/* Magic Mirror
 * Module: MMM-FF-Genius-Lyrics
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

const geniusLyrics = require("./node_modules/genius-lyrics-api/index.js");

const LyricFetcher = function (nodeHelper, config) {
  var { moduleId } = config;

  // public for filtering
  this.moduleId = moduleId;

  var lyrics = null;
  var artist = null;
  var title = null;
  var status = null;

  var hidden;

  this.suspend = () => {
    hidden = true;
  };

  this.resume = () => {
    hidden = false;
  };

  const prepareNotificationConfig = () => {
    const copy = Object.assign({ lyrics: lyrics }, config);
    copy.artist = artist;
    copy.title = title;
    copy.status = status;
    return copy;
  };

  const updateLyrics = (lyricsData) => {
    lyrics = lyricsData;
    nodeHelper.sendSocketNotification("UPDATE_LYRICS", {
      config: prepareNotificationConfig()
    });
  };

  this.getLyrics = (songInfo) => {
    config.artist = null;
    config.title = null;

    let _title = songInfo.name;
    let _artist = songInfo.artists[0].name;

    if (title === _title && artist === _artist) {
      return updateLyrics(lyrics);
    }

    title = _title;
    artist = _artist;

    const options = {
      apiKey: config.apiKey,
      title: songInfo.name,
      artist: songInfo.artists[0].name,
      optimizeQuery: true,
      text_format: "html"
    };

    status = "LOADING";
    geniusLyrics.getLyrics(options).then((lyrics) => {
      status = lyrics ? "OK" : "GENIUS_LYRICS_NOT_FOUND";
      updateLyrics(lyrics);
    });
  };
};

module.exports = LyricFetcher;
