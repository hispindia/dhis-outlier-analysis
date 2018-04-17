function fileOperation(wb,sheetName){

    this.downloadWB = function(name,extension){

        var fullName = name+"."+extension;
        wb.outputAsync().then(function(blob){
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(blob, fullName);
            } else {
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.href = url;
                a.download = fullName;
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        });
    }

    this.write = function(list){

        list.forEach((obj)=>{

            if (obj.range){
                var range = wb.sheet(sheetName).range(obj.range);
                if (obj.style){
                    obj.style.forEach((st)=>{
                        range.style(st.key,st.value);
                    })
                }
            }
                       
            if (obj.value && obj.cell){
                wb.sheet(sheetName).cell(obj.cell).value(obj.value);
                if (obj.style){
                    obj.style.forEach((st)=>{
                        wb.sheet(sheetName).cell(obj.cell).style(st.key,st.value);
                    })
                }
            }
        })
        
    }


}

module.exports =  fileOperation;
