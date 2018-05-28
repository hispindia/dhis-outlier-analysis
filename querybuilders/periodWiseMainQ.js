import queries from '../common-sql.js'

function periodWiseMainQ(startdate,
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
                                queries.getDateRangeQ(startdate,
                                                      enddate,
                                                      ptype)]);
        Q = queries.jsonize(Q);
      
        return Q;
    }

    function getQ(key){
        return queries.getPeriodSelectQ() +
            queries.getInnerJoinPePtDeCoc() +
            queries.getFiltersPePtDateDeCocAttrOptionValSource(startdate,
                                                               enddate,
                                                               ptype,
                                                               attroptioncombo,
                                                               ouGroupWiseSourceIDs[key],
                                                               ouGroupWiseDeListCommaSeparated[key],
                                                               ouGroupWiseDecocStringMap[key]) +
            queries.getPeriodGroupBy();
    }
}

module.exports = periodWiseMainQ;
