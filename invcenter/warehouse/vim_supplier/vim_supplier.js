
function addSupplier(vmi_suppliers){

    var supplierDg = $('#supplierDg');
    supplierDg.datagrid('loadData',{
        total: 0,
        rows: []
    });
    //定义查询条件
    $.ajax({
        method : 'GET',
        url : $apiRoot + "ocr-inventorycenter/suppliers-mgr/query-nopaging?token=" + window.$token,
        async : true,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                var viewModel = new Array();
                for ( var i in data) {
                    var dataItem = data[i];
                    if(!existSupplier(dataItem.code)) {
                        var row_data = {
                            supplier_code: dataItem.code,
                            supplier_name: dataItem.name,
                            obj: dataItem
                        };
                        viewModel.push(row_data);
                    }
                }

                supplierDg.datagrid('loadData',{
                    total: data.total,
                    rows: viewModel
                });

            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

    $('#supplierDlg').window('open');  // open a window
}

function existSupplier(supplierCode){
    if(warehouse.vmi_suppliers != undefined && warehouse.vmi_suppliers != null && warehouse.vmi_suppliers.length > 0){
        for(var j in warehouse.vmi_suppliers){
            var supplier = warehouse.vmi_suppliers[j];
            if(supplier.supplier_code == supplierCode){
                return true;
            }
        }
    }
    return false;
}


function supplierSelectOk(vmi_suppliers){

    var supplierRows = $('#supplierDg').datagrid('getSelections');
    if(supplierRows != null && supplierRows.length > 0) {

        var vmiOwnerList = $('#vmiOwnerList');

        for (var i in supplierRows) {
            var dataItem = supplierRows[i].obj;
            var newItem = {
                supplier_code: dataItem.code,
                supplier_name: dataItem.name
            };
            vmi_suppliers.push(newItem);
            var row_data = {
                supplier_code: newItem.supplier_code,
                supplier_name: newItem.supplier_name,
                obj: newItem
            };

            vmiOwnerList.datagrid('appendRow', row_data);
        }

        isHeadChanged = true;
    }

    $('#supplierDlg').window('close');  // open a window

}

