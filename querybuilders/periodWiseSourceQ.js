import queries from '../common-sql.js'

function periodWiseSourceQ(){
    var _ = {};
    
    _.makeUseCapturedQuery = function(selectedOUUID,ouGroupUIDKeys){
        selectedOUUID = `'${selectedOUUID}'`;

        var Q = ouGroupUIDKeys.map(key =>{
            var ouGroupUIDsCommaSeprated = "'"+key.replace(/-/g,"','") + "'"
            key = `'${key}'`;            
            return queries.getOUGroupMembersFilteredBySelectedOU(selectedOUUID,
                                                                 key,
                                                                 ouGroupUIDsCommaSeprated);
        });

        Q.push( queries.getNoGroupSelectedOU(selectedOUUID));
        Q = queries.unionize(Q)
        Q = queries.jsonize(Q)
        console.log(Q)
        return Q;
    }

    _.makeGenAggregatedQuery = function(selectedOUUID,
                                        ouGroupUIDKeys){

        selectedOUUID = `'${selectedOUUID}'`;

        var Q = ouGroupUIDKeys.map(key =>{
            var ouGroupUIDsCommaSeprated = "'"+key.replace(/-/g,"','") + "'"
            key = `'${key}'`;            
            return queries.getOUGroupMembersFilteredBySelectedOUDescendants(selectedOUUID,
                                                                            key,
                                                                            ouGroupUIDsCommaSeprated);
        });

        Q.push( queries.getNoGroupSelectedOUDescendants(selectedOUUID));
        Q = queries.unionize(Q)
        Q = queries.jsonize(Q)
        console.log(Q)
        return Q;

    }
    
    return _;
}

module.exports = new periodWiseSourceQ();
