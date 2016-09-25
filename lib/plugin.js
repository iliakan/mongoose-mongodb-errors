var mongoose = require('mongoose');


module.exports = function(schema, options) {
  new MongodbErrorHandler(schema, options)
}

class MongodbErrorHandler {
    constructor(schema, options = {}) {
        this.schema = schema;
        this.handler = this.handler.bind(this);

        this.message = options.message || '{0} is expected to be unique.';

        schema.post('save', this.handler);
        schema.post('update', this.handler);
        schema.post('findOneAndUpdate', this.handler);
        schema.post('insertMany', this.handler);
    }

    handler(err, doc, next) {
        if (err.name !== 'MongoError' || err.code != 11000) {
            return next(err);
        }

        let path = err.message.match(/\$([\w]*)_\d/)[1];
        let value = err.message.match(/\{\s:\s\"?([^\"\s]+)/)[1];

        var validationError = new mongoose.Error.ValidationError();
        validationError.errors[path] = validationError.errors[path] || {};
        validationError.errors[path].kind = 'duplicate';
        validationError.errors[path].value = value;
        validationError.errors[path].path = path;
        validationError.errors[path].message = this.message.replace('{0}', path);
        validationError.errors[path].reason = err.message;
        validationError.errors[path].name = err.name;

        next(validationError);
    }
}
