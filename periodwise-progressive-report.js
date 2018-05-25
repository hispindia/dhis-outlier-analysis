import sqlQueryBuilder from './sql-query-builderX';
import api from './dhis2API';

function periodWiseProgressiveReport(params){

    
    var sourceIDQuery = __getSourceIDQuery(params);
    var sqlViewTemplate =
        {
            "name": "999999_XLReport_"+Math.random(1),
            "sqlQuery": sourceIDQuery,
            "displayName": "temp",
            "description": "temp",
            "type": "QUERY"
        }

    console.log(sourceIDQuery)
    var sqlViewService = new api.sqlViewService();
    sqlViewService.create(sqlViewTemplate,function(error,response,body){
        var uid = body.response.uid;
        
        sqlViewService.getData(uid,function(error,response,body){
            
            /*      if (params.selectedOUGroup!="-1"){
                    if (body.rows[0] == ""){
                    alert(params.selectedOU.name+" has no facilities in the selected group");
                    callback()
                    return;
                    }
                    }
            */    
            doMainQuery(body,callback)
            
            sqlViewService.remove(uid,function(error,response,body){
                if (error){
                    console.log("Could not delete SQLView"+error)
                }
            })
        })
        
    })
    debugger
    
    

    
}

function __getSourceIDQuery(params){
    var qb = new sqlQueryBuilder();
    switch(params.selectedOUGroupUID){
        
    case "-1" : // no group
        if (params.aggregationType == "use_captured"){
            return qb.
                periodWise.
                sourceid.
                makeUseCapturedQuery(params.selectedOUUID,
                                     params.ouGroupUIDKeys); 
        }
        else if (params.aggregationType == "agg_descendants"){
            return getAggDescendants();
        }
        break
        
    default : // group case
        if (params.aggregationType == "use_captured"){
            return getOUGroupUseCaptured()
        }
        else if (params.aggregationType == "agg_descendants"){
            return getOUGroupAggDescendants();
        }
    }


}

module.exports = periodWiseProgressiveReport
