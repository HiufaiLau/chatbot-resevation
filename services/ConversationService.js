class ConversationService {
  static async run(witService, text, context) {
    if (!context.conversation) {
      context.conversation = {
        entities: {},
        followUp: '',
        complete: false,
        exit: false,
      };
    }

    if (!text) {
      context.conversation.followUp = 'Hello!';
      return context;
    }

    const entities = await witService.query(text);
    context.conversation.entities = {
      ...context.conversation.entities,
      ...entities,
    };

    if (
      text === 'Thanks' ||
      text === 'Bye' ||
      text === 'thanks' ||
      text === 'bye' ||
      text === 'goodbye' ||
      text === 'Goodbye' ||
      text === 'thx' ||
      text === 'Thx' ||
      text === 'thank you' ||
      text === 'Thank you'
    ) {
      context.conversation.followUp =
        'Alright. Let me know, when you need another reservation. See you soon.';
      context.conversation.exit = true;
      return context;
    }

    if (
      text === 'hi' ||
      text === 'hey' ||
      text === 'hello' ||
      text === 'yo' ||
      text === 'Yo' ||
      text === 'Hi' ||
      text === 'Hey' ||
      text === 'Hello'
    ) {
      context.conversation.followUp =
        'Hello, I am Resi, what could I do for you?';
      return context;
    }
    console.log('context.conversation.entities', context.conversation.entities);

    if (
      !entities['wit$datetime:reservationDateTime'] ||
      !entities['wit$number:numberOfGuests'] ||
      !entities['wit$contact:customerName']
    ) {
      return ConversationService.intentReservation(context);
    }
    context.conversation.followUp = 'Sorry. Could you rephase that?';
    return context;
  }

  static intentReservation(context) {
    const { conversation } = context;
    const { entities } = conversation;

    if (!entities['wit$datetime:reservationDateTime']) {
      conversation.followUp = 'When would you like to make your reservation?';
      return context;
    }

    if (!entities['wit$number:numberOfGuests']) {
      conversation.followUp = 'For how many people?';
      return context;
    }

    if (entities['wit$number:numberOfGuests'] > 4) {
      conversation.followUp = 'sorry, the table is maximum for 4 people.';
      return context;
    }

    if (!entities['wit$contact:customerName']) {
      conversation.followUp = 'Would you like to tell me your name please?';
      return context;
    }

    conversation.complete = true;
    return context;
  }
}

module.exports = ConversationService;
