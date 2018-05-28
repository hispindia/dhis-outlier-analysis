
function excelBuilder(mapping,data){

    data = JSON.parse(data.rows[0])

    data = data.reduce((map,obj) => {
        map[obj.key] = obj.value
        return map;
    },[])
debugger

}

module.exports = excelBuilder;
