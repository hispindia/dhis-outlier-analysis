import api from './dhis2API';
import XLSX from 'xlsx-populate';
import sqlQueryBuilder from './sql-query-builder';
import fileOps from './fileOperation';
import periodWiseProgressiveReport from './periodwise-progressive-report';
import ouWiseProgressiveReport from './ouwise-progressive-report';

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
        selectedOUName: state.selectedOU.name,
        selectedOULevel : state.selectedOU.level,
        selectedOUGroupUID : state.selectedOUGroup,
        aggregationType : state.aggregationType,
        startdate : state.startPe,
        enddate : state.endPe,
        ptype : "Monthly",
        attributeOptionComboId : 15,
        ouGroupWiseDecocStringMap : ouGroupWiseDecocStringMap,
        ouGroupUIDKeys : ouGroupUIDKeys,
        ouGroupWiseDeListCommaSeparated : ouGroupWiseDeListCommaSeparated,
        mapping : mapping,
        excelTemplate:state.selectedReport.excelTemplate,
        reportName:state.selectedReport.name + "_"+ state.selectedOU.name+ "_" + state.startPeText+"To"+state.endPeText,
        startdateText : state.startPeText,
        enddateText : state.endPeText
        
    }
    
    this.getReport = function(callback){

        switch(state.selectedReport.reportType){
        case 'FacilityANDPeriodWiseProgressive' :
          //  new periodWiseProgressiveReport(reportParams,
            //                                callback);
            new ouWiseProgressiveReport(reportParams,
                                        callback);
            
            break;

        case 'FacilityWiseProgressive' :
            new ouWiseProgressiveReport(reportParams,
                                        callback);
            break

        default : return;
        }
        
    }

    
}

module.exports = report;
