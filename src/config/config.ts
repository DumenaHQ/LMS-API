interface Iconfig {
    development: {
        app: {
            port: string | number
        },
        db: {
            port: string | number | undefined,
            host: string,
            name: string
        }
    },
    test: {
        app: {
            port: string | number
        },
        db: {
            port: string | number | undefined,
            host: string,
            name: string
        }
    }
}

export const config: Iconfig = {
    development: {
        app: {
            port: process.env.PORT || 3000
        },
        db: {
            host: process.env.DEV_DB_HOST || 'localhost',
            port: parseInt(process.env.DEV_DB_PORT as string) || 27017,
            name: process.env.DEV_DB_NAME || 'league'
        }
    },
    test: {
        app: {
            port: parseInt(process.env.TEST_APP_PORT as string) || 3000
        },
        db: {
            host: process.env.TEST_DB_HOST || 'localhost',
            port: parseInt(process.env.TEST_DB_PORT as string) || 27017,
            name: process.env.TEST_DB_NAME || 'leagueTest'
        }
    }
};