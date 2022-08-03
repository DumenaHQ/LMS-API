import { upload } from './awsHelper';

export const uploadFile = async ({ data: fileData }: any, key: string): Promise<String> => {
    const { Location } = await upload(process.env.BUCKET_NAME, key, fileData);
    return Location;
}