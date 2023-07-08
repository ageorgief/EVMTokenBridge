class ApiResult {
    constructor(isError, data) {
        this.isError = isError;
        this.data = data;
    }
}

module.exports = ApiResult;