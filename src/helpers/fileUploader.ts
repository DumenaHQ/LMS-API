import { upload } from './awsHelper';

export const uploadFile = async (bucketName: string, { data: fileData }: any, key: string): Promise<String> => {
    const { Location } = await upload(bucketName, key, fileData);
    return Location;
}