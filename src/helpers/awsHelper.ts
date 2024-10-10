import AWS from 'aws-sdk';
import { handleError } from './handleError';
import { s3Config } from '../config/config';

const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } = s3Config;

const s3Service = new AWS.S3({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION,
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
            if (err) reject(err);
            return resolve(data);
        });
    });
};

export const upload = async (bucketName: string, key: string, body: Buffer): Promise<{ Location: string }> => {
    const params = {
        Bucket: bucketName,
        Key: key,
        Body: body,
    };

    return new Promise((resolve, reject) => {
        // S3 ManagedUpload with callbacks is not supported in AWS SDK for JavaScript (v3).
        // Please convert to 'await client.upload(params, options).promise()', and re-run aws-sdk-js-codemod.
        s3Service.upload(params, (err: Error, data: any) => {
            if (err) reject(err);
            return resolve(data);
        });
    });
};