import periodWiseSourceQ from './querybuilders/periodWiseSourceQ.js'
import periodWiseMainQ from './querybuilders/periodWiseMainQ.js'

function sqlQueryBuilder(params){

    this.periodWise = {
        sourceid :periodWiseSourceQ,
        main : periodWiseMainQ
    }
    
    this.makePeriodWiseGenerateAggregateSourceIdQ = function(selectedOUUID){        
        return queries.getOrgUnitDescendantsByUID(`'${selectedOUUID}'`);
    }
    
}

module.exports = sqlQueryBuilder;
