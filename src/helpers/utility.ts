const chance = require('chance').Chance();

export const generateId = (prefix: string = '', length = 15) => {
    return `${prefix}${chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyz1234567890' })}`;
}