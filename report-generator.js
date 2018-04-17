import api from './dhis2API';
import XLSX from 'xlsx-populate';
import sqlQueryBuilder from './sqlQueryBuilder';
import fileOps from './fileOperation';
import progressiveReportService from './progressive-report';

function report(params){
    var excelTemplate = params.selectedReport.excelTemplate;
    var rowHeaders = params.selectedOU.children.reduce((list,obj) => {
        list.push({name:obj.name, id:obj.id});
        return list;
    },[])

  
    var selectedOUName = params.selectedOU.name;

    var mapping = require('./mapping.json');

    this.getReport = function(callback){

        var queryBuilder = new sqlQueryBuilder(mapping,params.selectedOU,params.selectedOUGroup,params.startPe,params.endPe,params.selectedReport.periodType);
        var query = queryBuilder.getSQLQuery();

        var sqlViewTemplate =
            {
                "name": "999999_XLReport_"+Math.random(1),
                "sqlQuery": query,
                "displayName": "temp",
                "description": "temp",
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

          var selectionParametersCellValueMap = progressiveReportService.getSelectionParametersCellValueMap(params.startPeText,mapping.startDateCell,params.endPeText,mapping.endDateCell,selectedOUName,mapping.facilityCell);
        var rowDataCellValueList = progressiveReportService.getRowDataCellValueList(dataset,ouGroupDecocToObjMap,mapping.totals,mapping.pivotStartColumn,startRow,mapping.pivotEndRow);
        
      
        XLSX.fromDataAsync(excelTemplate,{base64:true}).then(function(wb){
            var wbOps = new fileOps(wb,mapping.sheetName);
            
      
            wbOps.write(rowDataCellValueList);
            wbOps.write(selectionParametersCellValueMap);

            wbOps.downloadWB("out","xlsx");
            
        })        
    }

}

module.exports = report;
