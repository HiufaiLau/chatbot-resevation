const express = require('express');
const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');

const router = express.Router();

module.exports = (params) => {
  const { config } = params;

  const slackEvents = createEventAdapter(config.slack.signingSecret);
  const slackWebClient = new WebClient(config.slack.token);

  router.use('/events', slackEvents.requestListener());

  async function handleMention(event) {
    return slackWebClient.chat.postMessage({
      text: `HI there, I am Resi. What can I do for you?`,
      channel: event.channel,
      unsername: 'resi',
    });
  }

  slackEvents.on('app_mention', handleMention);

  return router;
};
