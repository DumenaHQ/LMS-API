import axios from 'axios';
const { handleError } = require('../helpers/handleError');


export class APIRequest {
    option: object = { headers: { 'Content-Type': 'application/json' } };

    constructor(options: object) {
        this.option = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
    }


    async get(url: string, params = {}) {
        this.option.params = params;
        try {
            const response = await axios.get(url, this.option);
            return response.data;
        } catch (err: unknown) {
            throw new handleError(err.response.status, err.response.data.message);
        }
    }

    async post(url: string, body = {}) {
        try {
            const response = await axios.post(url, body, this.option);
            return response.data;
        } catch (err) {
            throw new handleError(err.response.status, err.response.data.message);
        }
    }
}