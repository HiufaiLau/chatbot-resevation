const express = require('express');
const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const moment = require('moment');
const router = express.Router();

function createSessionId(channel, user, ts) {
  return `${channel}-${user}-${ts}`;
}

module.exports = (params) => {
  const { config, witService, reservationService, sessionService } = params;

  const slackEvents = createEventAdapter(config.slack.signingSecret);
  const slackWebClient = new WebClient(config.slack.token);

  router.use('/events', slackEvents.requestListener());

  async function handleMention(event) {
    // const sessionId = createSessionId(
    //   event.channel,
    //   event.user,
    //   event.thread_ts || event.ts
    // );

    // let session = sessionService.get(sessionId);

    // console.log(event);

    // if (!session) {
    //   session = sessionService.create(sessionId);

    //   session.context = {
    //     channel: event.channel,
    //     user: event.user,
    //     thread_ts: event.thread_ts || event.ts,
    //   };
    // }

    const mention = /<@[A-Z0-9]+>/;
    const eventText = event.text.replace(mention, '').trim();

    let text = '';

    if (!eventText) {
      text = 'hey';
    } else {
      const entities = await witService.query(eventText);
      const {
        // intent,
        customerName,
        reservationDateTime,
        numberOfGuests,
      } = entities;

      // if (
      // !intent ||
      // intent !== 'reservation' ||
      // !customerName ||
      // !reservationDateTime ||
      //   !numberOfGuests
      // )
      if (
        !entities['wit$contact:customerName'] ||
        !entities['wit$datetime:reservationDateTime'] ||
        !entities['wit$number:numberOfGuests']
      ) 
      {
        text = 'Sorry - could you rephrase that?';
        console.log(entities);
      } else {
        const reservationResult = await reservationService.tryReservation(
          customerName,
          moment(reservationDateTime).unix(),
          numberOfGuests
        );
        text = reservationResult.success || reservationResult.error;
      }
    }

    console.log(event);
    return slackWebClient.chat.postMessage({
      // text: "HI there, I'm Resi what can I do for you?",
      text,
      channel: event.channel,
      // channel: event.context.slack.channel,
      // thread_ts: session.context.slack.thread_ts,
      unsername: 'resi',
    });
  }

  slackEvents.on('app_mention', handleMention);

  return router;
};
