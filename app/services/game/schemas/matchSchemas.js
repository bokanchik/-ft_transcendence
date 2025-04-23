export const createMatchSchema = {
    body: {
      type: 'object',
      required: ['player1', 'player2'],
      properties: {
        player1: { type: 'string' },
        player2: { type: 'string' }
      }
    }
  };
  