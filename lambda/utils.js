'use strict';

const DEFAULT_VOICE = 'Mizuki';

function getInJapanese(string) {
    return `<lang xml:lang="ja-JP">${string}</lang>`;
}

function getInOtherVoice(string, voice = DEFAULT_VOICE) {
    return `<voice name="${voice}">${string}</voice>`;
}

function getInOtherVoiceInJapanese(string, voice) {
    return getInOtherVoice(getInJapanese(string), voice);
}

module.exports = {
    getInJapanese,
    getInOtherVoice,
    getInOtherVoiceInJapanese,
};
