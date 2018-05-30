import periodWiseSourceQ from './querybuilders/periodWiseSourceQ.js'
import periodWiseMainQ from './querybuilders/periodWiseMainQ.js'
import facilityWiseSourceQ from './querybuilders/facilityWiseSourceQ.js'
import facilityWiseMainQ from './querybuilders/facilityWiseMainQ.js'

function sqlQueryBuilder(params){

    this.periodWise = {
        sourceid :periodWiseSourceQ,
        main : periodWiseMainQ
    }

    this.ouWise = {
        sourceid : facilityWiseSourceQ,
        main : facilityWiseMainQ
    }
  
    
}

module.exports = sqlQueryBuilder;
