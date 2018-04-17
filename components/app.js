import React,{propTypes} from 'react';
import reportGenerator from '../report-generator';

export function ReportSelection(props){
   
    var instance = Object.create(React.Component.prototype);
    instance.props = props;

    var keyToObjMap = props.data.reports.reduce((map,obj) =>{
        map[obj.key] = obj;
        return map;
    },{});
    

    var state = {
        selectedReport : "-1",
        reportList : [],
        selectedOUGroup : "-1",
        selectedOU : {},
        periodList : [],
        startPe : "-1",
        startPeText : "",
        endPe : "-1",
        endPeText : ""
        
    };

    state.reportList = props.data.reports;
    props.services.ouSelectCallback.selected = function(ou){

        state.selectedOU = ou;
        instance.setState(state);
    }
                                   
    
    instance.render = render;

    return instance;
    
    function handleSubmit(event){

        event.preventDefault();
        
        new reportGenerator(Object.assign({},state)).getReport();
        
    }

    function getReportOptions(reports){

        var options = [
                <option disabled value="-1"> -- select a report -- </option>
                      ];
        
        reports.forEach(function(report){
            options.push(<option key = {report.key}  value={report.key} >{report.name}</option>);
        });
        
        return options;
        
    }

    function onReportChange(e){
        var reportKey = e.target.selectedOptions[0].value;
        
        var periodList = props.services.peService.getPeriods(keyToObjMap[reportKey].period);
        state.periodList = periodList;
        state.selectedReport = keyToObjMap[reportKey];
        instance.setState(state)
    }
    
    function getPeriodOptions(periodList){

        var options = [
                <option disabled value="-1"> -- select period -- </option>
        ];
        
        periodList.forEach(function(pe){
            options.push(<option key = {pe.id}  value={pe.id} >{pe.name}</option>);
        });
        
        return options;
        
    }

    function getOrgUnitGroupOptions(ougs){
        var options = [
                <option disabled value="-1"> -- select a facility group -- </option>
];
        
        ougs.forEach(function(oug){
            options.push(<option key = {oug.id}  value={oug.id} >{oug.name}</option>);
        });
        
        return options;
    }
    
    function render(){

        function onPeChange(type,e){

            if (type == "startPe"){
                state.startPe = e.target.value;
                state.startPeText = e.target.selectedOptions[0].text;
            }else if (type =="endPe"){
                state.endPe = e.target.value
                state.endPeText = e.target.selectedOptions[0].text;
            }
            instance.setState(state);
        }

        function onOUGroupChange(e){

            state.selectedOUGroup = e.target.value;
            instance.setState(state);
        }

        
        return (
                <form onSubmit={handleSubmit}>
                <table>
                <tbody>
                <tr>
                <td> Select Report </td><td><select value={state.selectedReport.key} onChange={onReportChange} id="report">{getReportOptions(props.data.reports)}</select></td>
                <td> Selected Facility  </td><td><label disabled>{state.selectedOU.name}</label></td>               </tr>
                <tr>
                <td> Select Start Period  </td><td><select onChange = {onPeChange.bind(this,"startPe")} value = {state.startPe} id="startPe">{getPeriodOptions(state.periodList)}</select></td>

                <td> Select End Period  </td><td><select onChange = {onPeChange.bind(this,"endPe")} value = {state.endPe} id="endPe">{getPeriodOptions(state.periodList)}</select></td>
                </tr>              
                <tr>
                <td> Select Org Unit Group  </td><td><select value={state.selectedOUGroup} onChange = {onOUGroupChange} id="ouGroup">{getOrgUnitGroupOptions(props.data.ouGroups)}</select></td><td> Select Aggregation Mode </td><td></td>

                </tr>
                
                </tbody>                
                </table>
                <input type="submit" value="Get Report"></input>
                </form>
        )
    }
    
}

