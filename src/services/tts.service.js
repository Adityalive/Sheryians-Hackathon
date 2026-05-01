import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Builds a TwiML response that speaks the given text to the caller,
 * then re-opens the gather loop to keep the conversation going.
 *
 * @param {string} text - The AI response to speak
 * @param {string} gatherActionUrl - The URL Twilio posts the next speech result to
 * @param {object} options
 * @param {string} options.voice - Twilio voice (default: 'Polly.Joanna' - natural female US voice)
 * @returns {string} TwiML XML string
 */
export const buildSpeakTwiML = (text, gatherActionUrl, { voice = 'Polly.Joanna' } = {}) => {
  const twiml = new VoiceResponse();

  twiml.say({ voice }, text);

  twiml.gather({
    input: 'speech',
    action: gatherActionUrl,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
    speechModel: 'phone_call',
  });

  // If customer says nothing after timeout, prompt again
  twiml.say({ voice }, 'I did not hear anything. Could you please repeat?');
  twiml.redirect({ method: 'POST' }, gatherActionUrl);

  return twiml.toString();
};

/**
 * Builds the initial greeting TwiML that starts a phone call conversation.
 */
export const buildGreetingTwiML = (tenantName, gatherActionUrl, { voice = 'Polly.Joanna' } = {}) => {
  const twiml = new VoiceResponse();

  twiml.say({ voice }, `Hello! Thank you for calling ${tenantName} support. I'm your AI assistant. How can I help you today?`);

  twiml.gather({
    input: 'speech',
    action: gatherActionUrl,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
    speechModel: 'phone_call',
  });

  return twiml.toString();
};

/**
 * Builds a TwiML response for escalating to a human agent.
 */
export const buildEscalationTwiML = ({ voice = 'Polly.Joanna' } = {}) => {
  const twiml = new VoiceResponse();

  twiml.say(
    { voice },
    'I understand. I am connecting you with a human agent now. ' +
    'A ticket has been created with your conversation history. Please hold while I transfer you.'
  );

  // In production: twiml.dial(agentPhoneNumber) or forward to a queue
  twiml.say({ voice }, 'Our agents are currently busy. We will call you back as soon as possible. Goodbye!');
  twiml.hangup();

  return twiml.toString();
};
