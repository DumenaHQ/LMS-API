import { upload } from './awsHelper';
import { lmsBucketName } from '../config/config';

const { BUCKET_NAME } = lmsBucketName;

export const uploadFile = async ({ data: fileData }: any, key: string): Promise<String> => {
    const { Location } = await upload(BUCKET_NAME, key, fileData);
    return Location;
}