const chance = require('chance').Chance();

export const generateId = (prefix: string = '', length = 15, num = false) => {
    const pool = num ? '0123456789' : 'abcdefghijklmnopqrstuvwxyz1234567890';
    return `${prefix}${chance.string({ length, pool })}`;
}


export const getValidModelFields = (model: any, rawData: Record<string, any>) => {
    if (!model) return {};
    let validFields: Record<string, any> = {};

    model.schema.eachPath((field: string) => {
        if (rawData.hasOwnProperty(field)) {
            validFields[field] = rawData[field];
        }
    });
    return validFields;
}


export const formatTimestamp = (time: number): String => {
    const time_diff_hrs = Math.floor(time / 3600) % 24;
    const time_diff_mins = Math.floor(time / 60) % 60;
    const time_diff_secs = Math.floor(time % 60);
    return `${time_diff_hrs}:${time_diff_mins}:${time_diff_secs}`;
}