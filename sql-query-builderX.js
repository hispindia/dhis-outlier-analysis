import periodWiseSourceQ from './querybuilders/periodWiseSourceQ.js'
import periodWiseMainQ from './querybuilders/periodWiseMainQ.js'

function sqlQueryBuilder(params){

    this.periodWise = {
        sourceid :periodWiseSourceQ,
        main : periodWiseMainQ
    }

  /*  this.OUWise = {
        sourceid : OUWiseSourceQ,
        main : OUWiseMainQ
    }
    */
}

module.exports = sqlQueryBuilder;
