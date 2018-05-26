import queries from '../common-sql.js'

function periodWiseMainQ(startdate,
                         enddate,
                         ptype,
                         attroptioncombo,
                         ouGroupWiseDecocStringMap,
                         ouGroupUIDKeys,
                         decocListCommaSeparated,
                         deListCommaSeparated,
                         ouGroupWiseSourceIDs
                         ){



    
    this.makeMainQuery = function(){
        debugger

        ouGroupUIDKeys.map(key => {
            var Q = getQ()

        })
        debugger
        

        return Q;
    }

    function getQ(decocStr,deList){
        return queries.getPeriodSelectQ() +
            queries.getInnerJoinPePtDeCoc() +
            queries.getFiltersPePtDateDeCocAttrOptionValSource(startdate,
                                                               enddate,
                                                               ptype,
                                                               attroptioncombo,
                                                               sourceids,
                                                               deListCommaSeprated,
                                                               decocStr) +
            queries.getPeriodGroupBy();
    }
}

module.exports = periodWiseMainQ;
