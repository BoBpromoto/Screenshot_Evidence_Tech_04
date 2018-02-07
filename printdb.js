document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('button[name]').addEventListener('click', shoWDB);
});

function shoWDB(element) {
    if (window.openDatabase) { 
        CDB_name = cdbname.value;
        db = window.openDatabase(CDB_name, "1.0", "Capture_Screen", 1024*1024);
        if (!db) {
            alert ("Check DB Name")
        }
        else {
            db.transaction(function(tx){
                tablequery = "CREATE TABLE " + ct_name.value + "(Time,File_Name,Hash)";
                tx.executeSql(tablequery);
                alert ("123")
                showquery = "SELECT * from " + ct_name.value;
                alert (showquery)
                tx.executeSql(showquery,[], function(tx,result){
                    for(var i = 0; i < result.rows.length; i++){
                        var row = result.rows.item(i);
                        document.getElementById('table1').innerHTML +=  "<tr><td>" + row['Time']
                         + "</td><td>" + row['File_Name'] + "</td><td>" + row["Hash"] + "</td></tr>";
                    }
                });               
            });
        }
    }
}