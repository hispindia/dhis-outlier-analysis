import queries from '../common-sql.js'

function facilityWiseSourceQ(selectedOUUID,
                             ouGroupUIDKeys,
                             selectedOUGroup){
    
    this.makeUseCapturedQuery = function(){

        var Q = ouGroupUIDKeys.map(key =>{
            var ouGroupUIDsCommaSeprated = "'"+key.replace(/-/g,"','") + "'"
            key = `'${key}'`;            
            return queries.
                getOUGroupMembersFilteredBySelectedOUChildren(selectedOUUID,
                                                              key,
                                                              ouGroupUIDsCommaSeprated);
        });

        Q.push( queries.getNoGroupSelectedOUChildren(selectedOUUID));
        Q = queries.unionize(Q)
        Q = queries.jsonize(Q)
        console.log(Q)
        return Q;
    }


     this.makeGenAggregatedQuery = function(){

         
         var Q = ouGroupUIDKeys.map(key =>{
             var ouGroupUIDsCommaSeprated = "'"+key.replace(/-/g,"','") + "'"
             key = `'${key}'`;            
             return queries.
                 getOUGroupMembersFilteredBySelectedOUChildrenDescendants(selectedOUUID,
                                                                          key,
                                                                          ouGroupUIDsCommaSeprated);
         });
         
         Q.push( queries.getNoGroupSelectedOUDescendants(selectedOUUID));
         Q = queries.unionize(Q)
         Q = queries.jsonize(Q)
         console.log(Q)
         return Q;
     }

     this.makeOuGroupUseCapturedQuery = function(){
        
        
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

    this.makeOuGroupGenAgrgegatedQuery = function(){
        
        
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
}


module.exports = facilityWiseSourceQ;
