import React,{propTypes} from 'react';

export function ReportSelection(props){

    var instance = Object.create(React.Component.prototype);
    instance.props = props;

    var keyToPeriodTypeMap = props.data.reports.reduce((map,obj) =>{
        map[obj.key] = obj;
        return map;
    },{});
    

    var state = {
        selectedReport : null,
        selectedOUGroup : null,
        selectedOU : null,
        periodList : []
        
    };
    
    instance.render = render;

    return instance;
    
    function handleSubmit(e){

    }

    function getReportOptions(reports){

        var options = [];
        
        reports.forEach(function(report){
            options.push(<option key = {report.key}  value={report.key} >{report.name}</option>);
        });
        
        return options;
        
    }

    function onReportChange(e){

        function getPeriods(periodType){

            switch(periodType){
            case "Monthly" :
                debugger
                return  getMonthlyPeriods();
                default :
                return  getMonthlyPeriods();
                
                
            }

            function getMonthlyPeriods(){

                var periods = [];
                var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December');
                var MONTH_NAMES_SHORT=new Array('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');


                var today = new Date();
                var currentYear = today.getFullYear();
                var currentMonth = today.getMonth();
                
                for (var i=currentYear;i>=1990;i--){
                    while(currentMonth!=-1){
                        var monthStr = ""
                        var cm = currentMonth+1;
                        if (cm <10){
                            monthStr = "0";
                        }
                        periods.push(
                            {
                                id:i+monthStr+cm,
                                name : MONTH_NAMES_SHORT[currentMonth]+" "+i

                            }
                        );

                        currentMonth = (currentMonth-1);
                    }
                    currentMonth=11;
                }
                   
                return periods;
            }
        };
        var periodList = getPeriods(keyToPeriodTypeMap[e.target.selectedOptions[0].value].period);
        state.periodList = periodList;
        instance.setState(state)
    }
    
    function getPeriodOptions(periodList){

        var options = [];
        
        periodList.forEach(function(pe){
            options.push(<option key = {pe.id}  value={pe.id} >{pe.name}</option>);
        });
        
        return options;
        
    }

    
    function render(){
debugger
        return (
                < form onSubmit={handleSubmit}>
                <table>
                <tbody>
                <tr>
                <td> Select Report </td><td><select onChange={onReportChange} id="report">{getReportOptions(props.data.reports)}</select></td>   
                </tr>
                <tr>
                <td> Select Start Period  </td><td><select id="report">{getPeriodOptions(state.periodList)}</select></td>
                </tr>
                
                <tr>
                <td> Select End Period  </td><td><select id="report">{getPeriodOptions(state.periodList)}</select></td>
                </tr>
                
                <tr>
                <td> Selected Facility  </td><td><label disabled>{state.currentSelection}</label></td>
                </tr>
                
                <tr>
                <td> Select Org Unit Group  </td><td></td>
                </tr>
                
                <tr>
                <td> Select Aggregation Mode </td><td></td>
                </tr>
                
                </tbody>                
                </table>
                <input type="submit" value="Get Report"></input>
                </form>
        )
    }
    
}

