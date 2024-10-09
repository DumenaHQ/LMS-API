import { LMS_BUCKET_NAME, DEV_LMS_BUCKET_NAME } from './constants';

export const env: string = process.env.NODE_ENV || 'development';

type envKeys = {
    development: any,
    production: any,
    test: any
};


const dbconfig: envKeys = {
    development: {
        connectionString: process.env.DB_CONNECTION_STRING
    },
    production: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DEV_DB_PORT as string) || 27017,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME || 'lms'
    },
    test: {
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT as string) || 27017,
        name: process.env.TEST_DB_NAME || 'lms_test'
    }
};
export const dbConfig = dbconfig[env as keyof envKeys];


const s3BucketKeys = {
    development: {
        ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        REGION: process.env.AWS_REGION
    },
    production: {
        ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        REGION: process.env.AWS_REGION
    },
    test: {
        ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        REGION: process.env.AWS_REGION
    },
};
export const s3Config = s3BucketKeys[env as keyof envKeys];

const lmsBucket = {
    test: {
        BUCKET_NAME: DEV_LMS_BUCKET_NAME
    },
    development: {
        BUCKET_NAME: DEV_LMS_BUCKET_NAME
    },
    production: {
        BUCKET_NAME: LMS_BUCKET_NAME
    }
};
export const lmsBucketName = lmsBucket[env as keyof envKeys];


const paystack_config = {
    test: {
        SECRET_KEY: process.env.PAYSTACK_TEST_SECRET_KEY || ''
    },
    development: {
        SECRET_KEY: process.env.PAYSTACK_TEST_SECRET_KEY || ''
    },
    production: {
        SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || ''
    }
};
export const paystackConfig = paystack_config[env as keyof envKeys];