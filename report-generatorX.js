import api from './dhis2API';
import XLSX from 'xlsx-populate';
import sqlQueryBuilder from './sql-query-builderX';
import fileOps from './fileOperation';
import progressiveReportService from './progressive-report';
import periodWiseProgressiveReport from './periodwise-progressive-report';

function report(state){
    var excelTemplate = state.selectedReport.excelTemplate;
    var reportName = state.selectedReport.name + "_"+ state.selectedOU.name+ "_" + state.startPeText+"To"+state.endPeText;    
    var selectedOUName = state.selectedOU.name;
    var mapping = JSON.parse(state.selectedReport.mapping);

    var ouGroupWiseDecocStringMap = mapping.decoc.reduce((map,obj) => {        
        var str = map[obj.ougroup];
        if (!str) {
            map[obj.ougroup] = "'"+obj.de+"-"+obj.coc+"'"
        }else{
            map[obj.ougroup] = str + ",'"+obj.de+"-"+obj.coc +"'";            
        }
        
        return map;
    },[])

    var ouGroupUIDKeys = Object.keys(ouGroupWiseDecocStringMap).reduce((list,key) =>{

        if (key != 'nogroup'){
            list.push(key);
        }
        return list;        
    },[])


    var ouGroupWiseDeListCommaSeparated = mapping.decoc.reduce((map,obj) => {        
        var str = map[obj.ougroup];
        if (!str) {
            map[obj.ougroup] = "'"+obj.de+"'";
        }else{
            map[obj.ougroup] = str + ",'"+obj.de +"'";            
        }
        
        return map;
    },[])

    
    var reportParams = {
        selectedOUUID : state.selectedOU.id,
        selectedOUGroupUID : state.selectedOUGroup,
        aggregationType : state.aggregationType,
        startdate : state.startPe,
        enddate : state.endPe,
        ptype : "Monthly",
        attributeOptionComboId : 15,
        ouGroupWiseDecocStringMap : ouGroupWiseDecocStringMap,
        ouGroupUIDKeys : ouGroupUIDKeys,
        ouGroupWiseDeListCommaSeparated : ouGroupWiseDeListCommaSeparated,
        mapping : mapping
        
    }
 /*   var sqlQueryBuilderParams = {
        sourceid : {
            selectedOUGroupUID : selectedOUGroupUID,
            
        },
        main : {
            startdate : state.startPe,
            enddate : state.endPe,
            attributeOptionComboId : 15,
            ouGroupWiseDecocStringMap : ouGroupWiseDecocStringMap
        }
        
    }
*/
    
    this.getReport = function(callback){

        switch(state.selectedReport.reportType){
        case 'FacilityANDPeriodWiseProgressive' :
            new periodWiseProgressiveReport(reportParams);
            break;

        case 'FacilityWiseProgressive' :
            break

        default : return;
        }
        
    }

    
}


function getDate(type,dateStr){
    
    switch(type){
    case 'monthly' : 
            return "'"+dateStr.substring(0,4)+"-"+dateStr.substring(4,6)+"-01'"
    }
    
}

module.exports = report;
