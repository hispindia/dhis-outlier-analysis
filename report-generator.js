import api from './dhis2API';
import XLSX from 'xlsx-populate';
import sqlQueryBuilder from './sqlQueryBuilder';
import fileOps from './fileOperation';
import progressiveReportService from './progressive-report';

function report(params){debugger
    var excelTemplate = params.selectedReport.excelTemplate;
    var reportName = params.selectedReport.name + "_"+ params.selectedOU.name+ "_" + params.startPeText+"To"+params.endPeText;
   
    var selectedOUName = params.selectedOU.name;
    var mapping = JSON.parse(params.selectedReport.mapping);

    this.getReport = function(callback){

        var queryBuilder = new sqlQueryBuilder(mapping,params.selectedOU,params.selectedOUGroup,params.startPe,params.endPe,params.selectedReport.periodType,params.aggregationType);
    //    var query = queryBuilder.getSQLQuery();
        var sourceIDQuery = queryBuilder.getSourceIDSQLQuery()
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

        function checkIfFacilityExists(rows){

            var flag = false;
            for (var key in rows){debugger
                if (rows[key].sourceids){
                    flag=true
                    break
                }                
            }
            return flag;
        }
        
        function doMainQuery(data,callback){
            var ouGroupWiseSourceIDs = JSON.parse(data.rows[0]);
            var mainQ = queryBuilder.getSQLQuery(ouGroupWiseSourceIDs);
            
            sqlViewTemplate =
                {
                    "name": "999999_XLReport_"+Math.random(1),
                    "sqlQuery": mainQ,
                    "displayName": "temp",
                    "description": "temp",
                    "type": "QUERY"
                }
            sqlViewService.create(sqlViewTemplate,function(error,response,body){
                var uid = body.response.uid;
                
                sqlViewService.getData(uid,function(error,response,body){
                    
                    arrangeData(body,callback)
                
                    sqlViewService.remove(uid,function(error,response,body){
                    if (error){
                        console.log("Could not delete SQLView"+error)
                    }
                    })
                })
                
            })
        }
        
    }

   
    function arrangeData(data,callback){
      
    
        var cellValueMap = [];
        var headersMap = []
        var startCol = mapping.pivotStartColumn;
        var startRow = mapping.pivotStartRow;
       
          
        var ouGroupDecocToObjMap = mapping.decoc.reduce((map,obj) => {
            map[obj.ougroup+"-"+obj.de+"-"+obj.coc] = obj
            return map;
        },[])

        var dataset = data.rows.reduce((list,obj)=>{
            list.push.apply(list,JSON.parse(obj))
            return list;
        },[]);

        var selectionParametersCellValueMap = progressiveReportService.getSelectionParametersCellValueMap(params.startPeText,params.endPeText,mapping.periodCell,selectedOUName,mapping.facilityCell);

        var rowDataCellValueList = progressiveReportService.getRowDataCellValueList(dataset,ouGroupDecocToObjMap,mapping.calc,mapping.pivotStartColumn,startRow,mapping.pivotEndRow,selectedOUName);
        
      
        XLSX.fromDataAsync(excelTemplate,{base64:true}).then(function(wb){
            var wbOps = new fileOps(wb,mapping.sheetName);
            
      
            wbOps.write(rowDataCellValueList);
            wbOps.write(selectionParametersCellValueMap);

            wbOps.downloadWB(reportName,"xlsx");
            callback()
        })        
    }

}

module.exports = report;
