const chance = require('chance').Chance();

export const generateId = (prefix: string = '', length = 15) => {
    return `${prefix}${chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyz1234567890' })}`;
}


export const formatTimestamp = (time: number): String => {
    //const time_diff = Math.abs(time_difference) / 1000;
    const time_diff_hrs = Math.floor(time / 3600) % 24;
    const time_diff_mins = Math.floor(time / 60) % 60;
    const time_diff_secs = Math.floor(time % 60);
    return `${time_diff_hrs}:${time_diff_mins}:${time_diff_secs}`;
}