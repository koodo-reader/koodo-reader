class VoiceList {
  static addVoice(name: string, url: string, type: string) {
    let voiceList =
      localStorage.getItem("voiceList") !== "{}" &&
      localStorage.getItem("voiceList")
        ? JSON.parse(localStorage.getItem("voiceList") || "")
        : [];

    voiceList.push({ name, url, type });

    localStorage.setItem("voiceList", JSON.stringify(voiceList));
  }
  static getAllVoices() {
    let voiceList =
      localStorage.getItem("voiceList") !== "{}" &&
      localStorage.getItem("voiceList")
        ? JSON.parse(localStorage.getItem("voiceList") || "")
        : [];
    return voiceList || [];
  }
}

export default VoiceList;
