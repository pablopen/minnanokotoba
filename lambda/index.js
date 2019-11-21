/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const utils = require('./utils');

const lessons = require('./lessons');
const translationsES = require('./translations/es');

const JAPANESE_VOICES = ['Mizuki', 'Takumi'];

const languageStrings = {
  /* 'en': {
    translation: {
      LESSONS: lessons,
      ERROR_PROMPT: 'Sorry, I can\'t understand the command. Please say again.'
      SKILL_NAME: 'Minna no kotoba',
      WELCOME_MESSAGE: 'Welcome to %s. You can ask a question like, what\'s the recipe for a %s? ... Now, what can I help you with?',
      WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
      DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
      HELP_MESSAGE: 'You can ask questions such as, what\'s the recipe for a %s, or, you can say exit...Now, what can I help you with?',
      HELP_REPROMPT: 'You can say things like, what\'s the recipe for a %s, or you can say exit...Now, what can I help you with?',
      STOP_MESSAGE: 'Goodbye!',
      RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
      RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'I\'m sorry, I currently do not know the recipe for %s. ',
      RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'I\'m sorry, I currently do not know that recipe. ',
      RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?',
    },
  }, */
  'es': {
    translation: {
      END_PLAYING_LESSON: 'Fin del vocabulario del tema %s',
      ERROR_PROMPT: 'Lo siento, no he podido entender la orden. ¿Me la podrías repetir?',
      LESSONS: lessons,
      LESSON_NOT_FOUND_WITH_LESSON_NUMBER: 'Lo siento, actualmente no conozco el tema %s',
      LESSON_NOT_FOUND_WITHOUT_LESSON_NUMBER: 'Lo siento, no conozco ese tema',
      LESSON_NOT_FOUND_REPROMPT: '¿Que más puedo hacer por ti?',
      PLAYING_LESSON: 'Reproduciendo el vocabulario del tema %s',
      REPEAT_MESSE: 'Prueba a decir repetir',
      SKILL_NAME: '<lang xml:lang="ja-JP">Minna no kotoba</lang>',
      STOP_MESSAGE: '¡Hasta la próxima!',
      TRANSLATIONS: translationsES,
      WELCOME_MESSAGE: 'Bienvenido a %s. Puedes preguntar por el vocabulario de los diferentes temas como por ejemplo, tema 1... ¿Que lección quieres escuchar?',
      WELCOME_REPROMPT: 'Para obtener ayuda puedes decir, ayuda',
      HELP_MESSAGE: 'Puedes preguntar cosas como tema 1, capítulo 5, vocabulario del tema 2... ¿En que puedo ayudarte?',
      HELP_REPROMPT: 'Puedes preguntar cosas como tema 1, capítulo 5, vocabulario del tema 2... ¿En que puedo ayudarte?',
    },
  },
};

function getSpeech(words, translations) {
  let speech = '';

  for (let i = 0; i < words.length; i++) {
    const wordObj = words[i];
    const translation  = translations[wordObj.id];
    const japaneseVoice = getRandomItem(JAPANESE_VOICES);
    const japaneseWord = utils.getInOtherVoiceInJapanese(wordObj.word, japaneseVoice);
    speech += japaneseWord + translation + '<break time="1s"/>';
  }

  return speech;
}

function launchErrorMessage(params) {
  console.log('Error message');
  const {
    requestAttributes,
    lessonNumber,
    sessionAttributes,
    handlerInput
  } = params;
  const repromptSpeech = requestAttributes.t('LESSON_NOT_FOUND_REPROMPT');
  let speakOutput = '';
  if (lessonNumber) {
    speakOutput += requestAttributes.t('LESSON_NOT_FOUND_WITH_LESSON_NUMBER', lessonNumber);
  } else {
    speakOutput += requestAttributes.t('LESSON_NOT_FOUND_WITHOUT_LESSON_NUMBER');
  }
  speakOutput += repromptSpeech;

  // save outputs to attributes, so we can use it to repeat
  sessionAttributes.speakOutput = speakOutput;
  sessionAttributes.repromptSpeech = repromptSpeech;

  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  return handlerInput.responseBuilder
    .speak(sessionAttributes.speakOutput)
    .reprompt(sessionAttributes.repromptSpeech)
    .getResponse();
}

/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const speakOutput = requestAttributes.t('WELCOME_MESSAGE', requestAttributes.t('SKILL_NAME'));
    const repromptOutput = requestAttributes.t('WELCOME_REPROMPT');

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

const PlayLessonHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayLesson';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const lessonSlot = handlerInput.requestEnvelope.request.intent.slots.lessonNumber;
    let lessonNumber;
    if (!lessonSlot || !lessonSlot.value) {
      const paramErrorMsg = {
        requestAttributes,
        lessonNumber,
        sessionAttributes,
        handlerInput
      };
      return launchErrorMessage(paramErrorMsg);
    }
    
    lessonNumber =  parseInt(lessonSlot.value, 10);
    //const cardTitle = requestAttributes.t('DISPLAY_CARD_TITLE', requestAttributes.t('SKILL_NAME'), itemName);
    
    const lesson = lessons[lessonNumber -1];
    if (!lesson) {
      const paramErrorMsg = {
        requestAttributes,
        lessonNumber,
        sessionAttributes,
        handlerInput
      };

      return launchErrorMessage(paramErrorMsg);
    }
    
    const myTranslations = requestAttributes.t('TRANSLATIONS');
    const translation = myTranslations[lessonNumber -1];
    let speechOutput = requestAttributes.t('PLAYING_LESSON', lessonNumber);
    speechOutput += getSpeech(lesson, translation);
    speechOutput += requestAttributes.t('END_PLAYING_LESSON', lessonNumber);

    sessionAttributes.speakOutput = speechOutput;
    
    // uncomment the _2_ reprompt lines if you want to repeat the info
    // and prompt for a subsequent action
    // sessionAttributes.repromptSpeech = requestAttributes.t('RECIPE_REPEAT_MESSAGE');
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      // .reprompt(sessionAttributes.repromptSpeech)
      //.withSimpleCard(cardTitle, recipe)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    //const item = requestAttributes.t(getRandomItem(Object.keys(recipes.RECIPE_EN_US)));

    sessionAttributes.speakOutput = requestAttributes.t('HELP_MESSAGE');
    sessionAttributes.repromptSpeech = requestAttributes.t('HELP_REPROMPT');

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .reprompt(sessionAttributes.repromptSpeech)
      .getResponse();
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .reprompt(sessionAttributes.repromptSpeech)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('STOP_MESSAGE', requestAttributes.t('SKILL_NAME'));

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log('Inside SessionEndedRequestHandler');
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("==== ERROR ======");
    console.log(error);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('ERROR_PROMPT'))
      .reprompt(requestAttributes.t('ERROR_PROMPT'))
      .getResponse();
  },
};

/* Helper Functions */

// Finding the locale of the user
const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true,
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    };
  },
};

// getRandomItem
function getRandomItem(arrayOfItems) {
  // the argument is an array [] of words or phrases
  let i = 0;
  i = Math.floor(Math.random() * arrayOfItems.length);
  return (arrayOfItems[i]);
}

/* LAMBDA SETUP */
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayLessonHandler,
    HelpHandler,
    RepeatHandler,
    ExitHandler,
    SessionEndedRequestHandler,
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
