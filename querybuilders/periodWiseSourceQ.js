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

    _.makeOuGroupUseCapturedQuery = function(selectedOUUID,
                                             ouGroupUIDKeys,
                                             selectedOUGroup){
        
        selectedOUUID = `'${selectedOUUID}'`;
        
        var Q = ouGroupUIDKeys.map(key =>{
            var ouGroupUIDsCommaSeprated = "'"+key.replace(/-/g,"','") + "'"
            key = `'${key}'`;            
            return queries.getOUGroupMembersFilteredBySelectedOUDescendantsAndOUGroup(selectedOUUID,
                                                                                      key,
                                                                                      ouGroupUIDsCommaSeprated,
                                                                                      selectedOUGroup
                                                                                     );
        });

        Q.push( queries.getNoGroupSelectedOUDescendantAndOUGroup(selectedOUUID,
                                                                 selectedOUGroup));
        Q = queries.unionize(Q)
        Q = queries.jsonize(Q)
        console.log(Q)
        return Q;
    }

    _.makeOuGroupGenAgrgegatedQuery = function(selectedOUUID,
                                             ouGroupUIDKeys,
                                             selectedOUGroup){
        
        selectedOUUID = `'${selectedOUUID}'`;
        
        var Q = ouGroupUIDKeys.map(key =>{
            var ouGroupUIDsCommaSeprated = "'"+key.replace(/-/g,"','") + "'"
            key = `'${key}'`;            
            return queries.getOUGroupMembersFilteredBySelectedOUDescendantsAndOUGroupDescendants(selectedOUUID,
                                                                                      key,
                                                                                      ouGroupUIDsCommaSeprated,
                                                                                      selectedOUGroup
                                                                                     );
        });

        Q.push( queries.getNoGroupSelectedOUDescendantAndOUGroupDescendants(selectedOUUID,
                                                                            selectedOUGroup));
        Q = queries.unionize(Q)
        Q = queries.jsonize(Q)
        console.log(Q)
        return Q;
    }



    return _;
}

module.exports = new periodWiseSourceQ();
