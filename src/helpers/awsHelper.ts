import AWS from 'aws-sdk';
import { handleError } from "./handleError";

const s3Service = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export const getObject = async (bucketName: string, key: string) => {
    if (!key) throw new handleError(422, 'key must have a value');

    const params = { Bucket: bucketName, Key: key };
    return new Promise((resolve, reject) => {
        s3Service.getObject(params, (err: Error, data: unknown) => {
            if (err) return reject(err);
            return resolve(data);
        });
    });
};


export const putObject = async (bucketName: string, key: string, body: Buffer, ContentType: object) => {
    const params = {
        Bucket: bucketName,
        ContentType,
        Key: key,
        Body: body,
    };

    return new Promise((resolve, reject) => {
        s3Service.putObject(params, (err: Error, data: any) => {
            if (err) reject(err)
            return resolve(data);
        });
    });
};

export const upload = async (bucketName: string, key: string, body: Buffer) => {
    const params = {
        Bucket: bucketName,
        Key: key,
        Body: body,
    };

    return new Promise((resolve, reject) => {
        s3Service.upload(params, (err: Error, data: any) => {
            if (err) reject(err)
            return resolve(data);
        });
    });
};