import { upload } from './awsHelper';

export const uploadFile = async (fileData: any, key: string): Promise<String> => {
    return new Promise((resolve, reject) => {
        upload(process.env.BUCKET_NAME, key, fileData).then(async () => {
            return resolve(process.env.BUCKET_STATIC_URL + key);
        }).catch((err: any) => {
            console.log(err);
            return reject('Unable to upload file');
        });
    });
}