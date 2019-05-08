import React,{propTypes} from 'react';
import reportGenerator from '../report-generator';
import api from 'dhis2api';
import moment from 'moment';

export function SelectionPanel(props){
    
    var instance = Object.create(React.Component.prototype);
    instance.props = props;

    var keyToObjMap = props.data.dataSets.reduce((map,obj) =>{
        map[obj.key] = obj;
        return map;
    },{});
    

    var state = {
        selectedDataSets : [],
        selectedReportKey : "-1",
        dataSetList : [],
        selectedOUGroup : "-1",
        selectedOU : "-1",
        periodList : [],
        startDate : moment().format("YYYY-MM-DD"),
        endDate : moment().format("YYYY-MM-DD"),
        loading : false,
        orgUnitValidation:""
        
    };

    state.dataSetList = props.data.reports;
    props.services.ouSelectCallback.selected = function(ou){

        state.selectedOU = ou;
        state.orgUnitValidation = ""
        instance.setState(state);
    }
    
    
    instance.render = render;

    return instance;
    
    function handleSubmit(event){
        event.preventDefault();

        if (isInValid()){
            instance.setState(state);
            return
        }
        
        if (state.selectedReport.excelTemplate){
            getReport();
        }else{
            var dsService = new api.dataStoreService('XLReport_Data');
            dsService.getValue(state.selectedReportKey).then((data) => {
                state.selectedReport.mapping=data.mapping;
                state.selectedReport.excelTemplate = data.excelTemplate;
                getReport();
            })
        }
        
        

        function getReport(){
            state.loading = true;
            instance.setState(state);
            new reportGenerator(Object.assign({},state)).getReport(function(){
                
                state.loading = false;
                instance.setState(state);
            });
        }
    }

    function isInValid(){
        
        var flag = false;
        if (state.selectedOU == "-1"){
            state.orgUnitValidation = "Please select an Org Unit"
            flag = true;
        }

        if (state.selectedReport == "-1"){
            state.reportValidation = "Please select a report"
            flag = true;
        }

        if (state.startPe == "-1"){
            state.startPeValidation = "Please select a start Period"
            flag = true;
        }
        
        if (state.endPe == "-1"){
            state.endPeValidation = "Please select an end Period"
            flag = true;
        }

        return flag;
    }
    
    function getDataSetOptions(objs){

        var options = [];
        
        objs.forEach(function(obj){
            options.push(<option key = {obj.uid}  value={obj.uid} >{obj.name}</option>);
        });
        
        return options;
        
    }

    function onDataSetChange(e){
        var reportKey = e.target.selectedOptions[0].value;
        
        var periodList = props.services.peService.getPeriods(keyToObjMap[reportKey].period);
        state.periodList = periodList;
        state.selectedReport = keyToObjMap[reportKey];
        state.selectedReportKey = state.selectedReport.key;
        state.reportValidation = "";
        instance.setState(state)
    }
    
    function getPeriodOptions(periodList){

        var options = [
            <option key="select_period" disabled value="-1"> -- select period -- </option>
        ];
        
        periodList.forEach(function(pe){
            options.push(<option key = {pe.id}  value={pe.id} >{pe.name}</option>);
        });
        
        return options;
        
    }

    
    function render(){

        function onPeChange(type,e){

            if (type == "startPe"){
                state.startPe = e.target.value;
                state.startPeText = e.target.selectedOptions[0].text;
                state.startPeValidation = "";
            }else if (type =="endPe"){
                state.endPe = e.target.value
                state.endPeText = e.target.selectedOptions[0].text;
                state.endPeValidation = "";
            }
            instance.setState(state);
        }

        function onAggregationTypeChange(e){

            state.aggregationType = e.target.value;
            instance.setState(state);
        }
        
        function onOUGroupChange(e){

            state.selectedOUGroup = e.target.value;
            instance.setState(state);
        }

        
        return ( 
            <form onSubmit={handleSubmit} className="formX">
              <h3> Outlier Analysis </h3><hr></hr>

              <div className="outerGrid">
                <div className="innerGrid">
                  <div>Select DataSet/s<span style={{"color":"red"}}> * </span> :
                  </div>
                  <div>
                    <select multiple value={state.selectedDataSets} onChange={onDataSetChange} id="dataset">{getDataSetOptions(props.data.dataSets)}</select>
                  </div>
              </div>

              <div className="innerGrid">
                <div> Selected Facility<span style={{"color":"red"}}> * </span>  :</div>
                <div> <input disabled  value={state.selectedOU.name}></input></div>
              </div>

              <div className="innerGrid">
                <div> Select  Date<span style={{"color":"red"}}> * </span>  :</div>
                <div> <input type="date" onChange = {onPeChange.bind(this,"startPe")} value = {state.startDate} id="startPe" /></div>
              </div>

              <div className="innerGrid">
                <div>  <input type="submit" value="Find Ouliers" ></input>    </div>
                <div>  <img style = {state.loading?{"display":"inline"} : {"display" : "none"}} src="./images/loader-circle.GIF" alt="loader.." height="32" width="32"></img></div>
              </div>
            </div>
            
                <table className="formX">
                <tbody>
                  <tr rowSpan="3">
                    <td >  Select DataSet/s<span style={{"color":"red"}}> * </span> : </td><td colSpan="2"><select multiple value={state.selectedDataSets} onChange={onDataSetChange} id="dataset">{getDataSetOptions(props.data.dataSets)}</select><br></br>                <label key="reportValidation" ><i>{state.reportValidation}</i></label>
                                                                                                                   </td>
                    
                  </tr>
                  
                  <tr>
                    <td className="">  Selected Facility<span style={{"color":"red"}}> * </span>  : </td><td><input disabled  value={state.selectedOU.name}></input><br></br><label key="orgUnitValidation" ><i>{state.orgUnitValidation}</i></label></td>
                  </tr>
                  <tr>
                    <td>  Select  Date<span style={{"color":"red"}}> * </span>  :  </td><td><input type="date" onChange = {onPeChange.bind(this,"startPe")} value = {state.startDate} id="startPe" /><br></br></td>
                    
                  </tr>              
                  
                  <tr></tr><tr></tr>
                  <tr><td>  <input type="submit" value="Find Ouliers" ></input></td>
                    <td> <img style = {state.loading?{"display":"inline"} : {"display" : "none"}} src="./images/loader-circle.GIF" alt="loader.." height="32" width="32"></img>  </td></tr>

                </tbody>                
            </table>
</form>
        )
    }
    
}

