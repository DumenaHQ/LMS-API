const chance = require('chance').Chance();

export const generateId = (prefix: string = '') => {
    return `${prefix}${chance.string({ length: 15, pool: 'abcdefghijklmnopqrstuvwxyz1234567890' })}`;
}