const chance = require('chance').Chance();
const ffmpeg = require('fluent-ffmpeg');

export const generateId = (prefix: string = '', length = 15, num = false) => {
    const pool = num ? '0123456789' : 'abcdefghijklmnopqrstuvwxyz1234567890';
    return `${prefix}${chance.string({ length, pool })}`;
};


export const getValidModelFields = (model: any, rawData: Record<string, any>) => {
    if (!model) return {};
    const validFields: Record<string, any> = {};

    model.schema.eachPath((field: string) => {
        if (rawData.hasOwnProperty(field)) {
            validFields[field] = rawData[field];
        }
    });
    return validFields;
};

export const getVideoDurationInSeconds = async (url: string): Promise<number> => {
    return await new Promise((resolve, reject) => {

        ffmpeg.ffprobe(url, function (err: any, metadata: { format: { duration: number; }; }) {
            if (err) return reject(err);
            return resolve(metadata.format.duration);
        });

    });
};


export const formatTimestamp = (time: number): string => {
    const time_diff_hrs = Math.floor(time / 3600) % 24;
    const time_diff_mins = Math.floor(time / 60) % 60;
    const time_diff_secs = Math.floor(time % 60);
    return `${time_diff_hrs}:${time_diff_mins}:${time_diff_secs}`;
};

export const capitalizeFirstLetter = (word: string): string => {
    return word[0].toUpperCase() + word.slice(1);
};

export function isInEnum<T>(enumObj: T, value: unknown): value is T[keyof T] {
    return Object.values(enumObj).includes(value as T[keyof T]);
}