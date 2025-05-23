const chance = require('chance').Chance();
const ffmpeg = require('fluent-ffmpeg');

export const generateId = (prefix: string = '', length = 15, num = false) => {
    const pool = num ? '0123456789' : 'abcdefghijklmnopqrstuvwxyz1234567890';
    return `${prefix}${chance.string({ length, pool })}`;
};


export const getValidModelFields = (model: any, rawData: Record<string, any>) => {
    if (!model) return {};
    const validFields: Record<string, any> = {};

    const {username, ...userData } = rawData;
    model.schema.eachPath((field: string) => {
        if (userData.hasOwnProperty(field)) {
            validFields[field] = userData[field];
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


export const formatTimestampToEnglish = (isoString: Date)  => 
    new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(new Date(isoString)) + ' WAT';


    
export const capitalizeFirstLetter = (word: string): string => {
    return word[0].toUpperCase() + word.slice(1);
};   