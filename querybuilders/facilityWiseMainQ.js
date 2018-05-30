import queries from '../common-sql.js'

function ouWiseMainQ(
    ouuid,
    ouname,
    oulevel,
    selougroupuid,
    startdate,
    enddate,
    ptype,
    attroptioncombo,
    ouGroupWiseDecocStringMap,
    ouGroupUIDKeys,
    ouGroupWiseDeListCommaSeparated,
    ouGroupWiseSourceIDs
){
    
    this.makeMainQuery = function(){
        
        var Q = ouGroupUIDKeys.map(key => {
            return getQ(key)
        })
        
        Q.push( getQ('nogroup') );
        Q = queries.unionize(Q)
        Q = queries.jsonizeKeyValue(Q)        
        Q = queries.unionizeAll([Q,
                                 queries.getOURangeSelOUChildrenQ(ouuid)]);
        Q = queries.jsonize(Q);
        console.log(Q);
        return Q;

        function getQ(key){
            return queries.unionize([getSelOuQ(key),
                                    getQQ(key)])
        }
        
        function getSelOuQ(key){
            return queries.getSelOUSelectQ(key)
                + queries.getInnerJoinPePtDeCoc()
                + queries.getInnerJoinOusOu(oulevel)
                + queries.getFiltersPePtDateDeCocAttrOptionValSource(startdate,
                                                                     enddate,
                                                                     ptype,
                                                                     attroptioncombo,
                                                                     queries.getOrgUnitIDsFromUIDs(ouuid),
                                                                     ouGroupWiseDeListCommaSeparated[key],
                                                                     ouGroupWiseDecocStringMap[key])
                + queries.getOUGroupBySourceidDeCoc();            
        }
        
        function getQQ(key){
            return queries.getOUSelectQ(key,
                                        oulevel+1)
                + queries.getInnerJoinPePtDeCoc()
                + queries.getInnerJoinOusOu(oulevel+1)
                + queries.getFiltersPePtDateDeCocAttrOptionValSource(startdate,
                                                                     enddate,
                                                                     ptype,
                                                                     attroptioncombo,
                                                                     ouGroupWiseSourceIDs[key],
                                                                     ouGroupWiseDeListCommaSeparated[key],
                                                                     ouGroupWiseDecocStringMap[key])
                + queries.getOUGroupBySelOUChildren(oulevel+1);
        }
        
    }


    this.makeGroupMainQuery = function(){
        var Q = ouGroupUIDKeys.map(key => {
            return getQ(key)
        })
        
        Q.push( getQ('nogroup') );
        Q = queries.unionize(Q)
        Q = queries.jsonizeKeyValue(Q)        
        Q = queries.unionizeAll([Q,
                                 queries.getOUGroupMembersUIDAndNameRangeQ(selougroupuid,ouuid)]);
        Q = queries.jsonize(Q);
        console.log(Q);
        return Q;

        function getQ(key){
            return  queries.getDVFilteredByOUGroupDescendants( getQQ(key ),
                                                               selougroupuid
                                                             );
        }
        
        function getQQ(key){
            return queries.getOUGroupSelectQ(key)
                + queries.getInnerJoinPePtDeCoc()
                + queries.getFiltersPePtDateDeCocAttrOptionValSource(startdate,
                                                                     enddate,
                                                                     ptype,
                                                                     attroptioncombo,
                                                                     ouGroupWiseSourceIDs[key],
                                                                     ouGroupWiseDeListCommaSeparated[key],
                                                                     ouGroupWiseDecocStringMap[key])
                + queries.getOUGroupBySourceidDeCoc();
        }
    }   
}

module.exports = ouWiseMainQ;
