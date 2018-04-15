import api from './dhis2API';

function report(params){
    var excelTemplate = params.selectedReport.excelTemplate;
    
    this.getReport = function(callback){

        var mapping = {

            startColumn : "",
            startRow :"",
            startDateCell : "",
            endDateCell : "",
            facility:"",
            facilityP:"",
            decoc : [
                {
                    row:"",
                    de : "",
                    coc : "",
                    ouGroup : ""
                }
            ]
        }

        var test = getSQLQuery(mapping);

        var sqlViewTemplate =
            {
                "name": "1ads12est6",
                "sqlQuery": test,
                "displayName": "test",
                "description": "test",
                "type": "QUERY"
            }
        var sqlViewService = new api.sqlViewService();
        sqlViewService.create(sqlViewTemplate,function(error,response,body){
            var uid = body.response.uid;

            sqlViewService.getData(uid,function(error,response,body){
                arrangeData(body,function(){
                    
                })
                
                sqlViewService.remove(uid,function(error,response,body){
                    if (error){
                        console.log("Could not delete SQLView"+error)
                    }
                })
            })
           
            
        })
               
    }

    function arrangeData(data,callback){


         var mapping = {

            startColumn : "",
            startRow :"",
            startDateCell : "",
            endDateCell : "",
            facility:"",
            facilityP:"",
            decoc : [
                {
                    row:"",
                    de : "",
                    coc : "",
                    ouGroup : ""
                }
            ]
        }

        
        var nameToObjMap = data.headers.reduce((map,obj,index)=>{ 
            map[obj["name"]] = index;
            return map;
        },{});
        
        excelTemplate;
        var ouIndex;
        debugger
    }

    
    function getSQLQuery(mapping){

        var query = `select concat(de.uid,'-',coc.uid)  as decoc,ou.uid,max(ou.name),sum(dv.value :: integer)
 from datavalue dv
 inner join period as pe on pe.periodid = dv.periodid 
 inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
 inner join dataelement as de on de.dataelementid = dv.dataelementid 
 inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid 
 inner join organisationunit ou on ou.organisationunitid = dv.sourceid 
 where pe.startdate >= '2016-01-01' and pe.startdate <='2018-04-01' 
 and concat(de.uid,'-',coc.uid) in ('EbzRCswFyij-DLr4VIEGNIo') 
 group by concat(de.uid,'-',coc.uid),ou.uid`
        return query;
    }

}

module.exports = report;
