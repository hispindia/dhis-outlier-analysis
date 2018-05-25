import queries from '../common-sql.js'

function periodWiseMainQ(){
    var _ = {};
    
    _.makeUseCapturedQuery = function(){
        return Q;
    }
    
    return _;
}

module.exports = new periodWiseMainQ();
