/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const lesson1 = require('./lessons/lesson1');
const lesson1Es = require('./lessons/lesson1.es-ES');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const lessons = [lesson1];
const languageStrings = {
  /* 'en': {
    translation: {
      LESSONS: lessons,
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
      LESSONS: lessons,
      SKILL_NAME: 'Minna no kotoba',
      WELCOME_MESSAGE: 'Bienvenido a %s. Puedes preguntar por el vocabulario de los diferentes temas, por ejemplo, tema 1... ¿Que lección quieres escuchar?',
      WELCOME_REPROMPT: 'Para obtener ayuda puedes decir, ayuda',
      HELP_MESSAGE: 'Puedes preguntar cosas como tema 1, capítulo 5, vocabulario del tema 2... En que puedo ayudarte?',
      HELP_REPROMPT: 'Puedes preguntar cosas como tema 1, capítulo 5, vocabulario del tema 2... En que puedo ayudarte?',
      STOP_MESSAGE: 'Hasta la próxima!',
      REPEAT_MESSAGE: 'Prueba a decir repetir.',
      LESSON_NOT_FOUND_WITH_LESSON_NUMBER: 'Lo siento, actualmente no conozco el tema %s.',
      LESSON_NOT_FOUND_WITHOUT_LESSON_NUMBER: 'Lo siento, no conozco ese tema',
      LESSON_NOT_FOUND_REPROMPT: '¿Que más puedo hacer por ti?',
    },
  },
};

function getSpeech(words, translations) {
  let speech = '';
  const JAPANESE_VOICES = ['Mizuki', 'Takumi'];
  const japaneseSpeechOpen =  '<voice name="'+ JAPANESE_VOICES[0] + '"><lang xml:lang="ja-JP">';
  const japaneseSpeechClose =  '</lang></voice>';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const translation  = translations[word.id];
    speech += '' + japaneseSpeechOpen + word.word + japaneseSpeechClose + translation + '.\n';
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
    console.log('Play lesson intent')
    const lessonSlot = handlerInput.requestEnvelope.request.intent.slots.lessonNumber;
    let lessonNumber;
    console.log('lessonSlot', lessonSlot)
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
    console.log('lessonNumber', lessonNumber)
    //const cardTitle = requestAttributes.t('DISPLAY_CARD_TITLE', requestAttributes.t('SKILL_NAME'), itemName);
    const myLessons = lessons;//requestAttributes.t('LESSONS');
    const lesson = myLessons[lessonNumber -1];
    if (!lesson) {
      const paramErrorMsg = {
        requestAttributes,
        lessonNumber,
        sessionAttributes,
        handlerInput
      };

      return launchErrorMessage(paramErrorMsg);
    }
    
    //TODO change lesson;
    sessionAttributes.speakOutput = getSpeech(lesson1.values, lesson1Es);
    
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
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
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

// langauge strings for localization
// TODO: The items below this comment need your attention
