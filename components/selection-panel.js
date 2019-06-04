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
        selectedDataSets : "",
        selectedReportKey : "-1",
        dataSetList : [],
        referencePeriod : "6",
        selectedOUGroup : "-1",
        selectedOU : "-1",
        periodList : [],
        selectedYear : moment().format("YYYY"),
        selectedMonth : moment().format("MM"),
        loading : false,
        orgUnitValidation:"",
        selectedDate : moment().format("MMMM-YYYY")
        
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
        
        
        state.loading = true;
        instance.setState(state);
        new reportGenerator(Object.assign({},state)).getReport(function(){
            state.loading = false;
            instance.setState(state);
        });
    }
    
    function isInValid(){
        
        var flag = false;
        if (state.selectedOU == "-1"){
            state.orgUnitValidation = "Please select an Org Unit"
            flag = true;
        }

        if (state.selectedDataSets == ""){
            state.reportValidation = "Please select datasets"
            flag = true;
        }

    /*    if (state.selectedOU.level <= 2){
            alert("This report can be generated at Division Level or Below. Please check your selection.")
            flag = true;            
        }
    */
        return flag;
    }
    
    function getDataSetOptions(objs){

        var options = [];
        
        objs.forEach(function(obj){
            options.push(<option key = {obj.id}  value={obj.id} >{obj.name}</option>);
        });
        
        return options;
        
    }

    function onRefPeriodChange(e){
        state.referencePeriod = e.target.selectedOptions[0].value;
        instance.setState(state)
    }

    function onSelectChange(key,e){
        state[key] = e.target.selectedOptions[0].value;
        instance.setState(state)
        
    }
    
    function onDataSetChange(e){
        
        var selDS = e.target.selectedOptions;
        
        var str = ""
        for (var key=0; key<selDS.length;key++){
            var group = selDS[key];
            if (str == ""){
                str=group.value;
            }else{
                str = str+","+group.value
            }
        }                        

        state.selectedDataSets = str;
        state.reportValidation = "";
        instance.setState(state)
    }

    
    function render(){
        
        return ( 
            <form onSubmit={handleSubmit} className="formX">
              <h3> Outlier Analysis </h3><hr></hr>
            
                <table className="formX">
                <tbody>
                  <tr rowSpan="3">
                <td >  Select DataSet/s<span style={{"color":"red"}}> * </span> : </td><td colSpan="2"><select multiple value={state.selectedDataSets.split(',')} onChange={onDataSetChange} className= "datasetDisplay" id="dataset">{getDataSetOptions(props.data.dataSets)}</select><br></br>                <label key="reportValidation" ><i>{state.reportValidation}</i></label>
                </td>    
                </tr>
                  
                  <tr>
                    <td className="">  Selected Facility<span style={{"color":"red"}}> * </span>  : </td><td><input disabled  value={state.selectedOU.name}></input><br></br><label key="orgUnitValidation" ><i>{state.orgUnitValidation}</i></label></td>
                  </tr>

                <tr>
                <td className="">  Select Reference Period<span style={{"color":"red"}}> * </span>  : </td><td><select value={state.referencePeriod} onChange={onRefPeriodChange} className= "" id="refp">
                <option key="3" value="3">3 Months</option>
                <option key="6" value="6">6 Months</option>               
                <option key="9" value="9">9 Months</option>
                <option key="12" value="12">12 Months</option>
                </select></td> </tr>
                
                <tr>
                <td>  Select Month<span style={{"color":"red"}}> * </span>  :  </td><td><select value={state.selectedMonth} onChange={onSelectChange.bind(null,'selectedMonth')} className= "" id="monthasel">
                <option key="January" value="01">Jan</option>
                <option key="Febuary" value="02">Feb</option>               
                <option key="Mar" value="03">Mar</option>
                <option key="Apr" value="04">Apr</option>
                <option key="May" value="05">May</option>
                <option key="June" value="06">Jun</option>               
                <option key="July" value="07">Jul</option>
                <option key="Aug" value="08">Aug</option>
                <option key="Sep" value="09">Sep</option>
                <option key="Oct" value="10">Oct</option>               
                <option key="Nov" value="11">Nov</option>
                <option key="Dec" value="12">Dec</option>
                </select><br></br></td>
                    
                  </tr>              

              <tr>
                <td>  Select Year<span style={{"color":"red"}}> * </span>  :  </td><td><select value={state.selectedYear} onChange={onSelectChange.bind(null,'selectedYear')} className= "" id="yearsel">
                <option key="2019" value="2019">2019</option>
                <option key="2018" value="2018">2018</option>               
                <option key="2017" value="2017">2017</option>
                <option key="2016" value="2016">2016</option>
                <option key="2015" value="2015">2015</option>
                <option key="2014" value="2014">2014</option>

                </select><br></br></td>
                    
                  </tr>              
                  
                  <tr></tr><tr></tr>
                  <tr><td>  <input type="submit" value="Find Ouliers" ></input></td></tr>
               <tr> <td colSpan="2"> <div style = {state.loading?{"display":"inline"} : {"display" : "none"}}><img  src="./images/loader-circle.GIF" alt="loading.." height="32" width="32"></img> This will take a few minutes..Please wait</div> </td></tr>

                </tbody>                
            </table>
</form>
        )
    }
    
}

