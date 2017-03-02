var allotInvObjIndex;
var allotInvObj;

//clone的数据
var cloneAllotInvObj;
var currentDetailRowObj;

//主子表状态
var isHeadChanged = false;
var isBodyChanged = false;
var isNewRep = false;

//子表行状态
var editIndex = undefined;

//保存
function save(){
    endEditing();
	var cloneAllotInvObj22=cloneAllotInvObj;
    if(isHeadChanged || isBodyChanged || isNewRep){
        $.ajax({
            method: 'POST',
            url: $invcenterURL + "ocr-inventorycenter/inventorycheck-mgr/create?context=" + $token,
            data: JSON.stringify(cloneAllotInvObj),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                //-------刷新关联属性------
                cloneAllotInvObj = data;
                allotInvObj = cloneAllotInvObj;

                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                var index = dgList.datagrid('getRowIndex', row);
                row['bo_id'] = data.bo_id;
                row['sale_date'] = data.sale_date;
                row['salesman'] = data.salesman;

                row.obj = allotInvObj;
                dgList.datagrid('refreshRow', index);

                resetState();
                alert_autoClose('提示','保存成功!');

            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });

    }
}

function resetState(){
    editIndex = undefined;
    isNewRep = false;
    isHeadChanged = false;
    isBodyChanged = false;
}

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '库存盘点单列表',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : false,
        onBeforeSelect: onBeforeSelect,
        onSelect: onRowSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        }
    });
}


function detailListSetting(){
	$('#win').window({
    width:600,
    height:400,
    modal:true
});

 $('#detailDg').datagrid({
        title : '库存盘点单详情',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : false,
        showFooter: true,
        //onLoadSuccess: addSubTotalRow,
        onClickCell: onClickCell,
        onEndEdit: onEndEdit,
        onSelect: onDetailRowSelected,  //行选择事件
        toolbar :
            [   {
                    text : '新增',
                    iconCls : 'icon-add',
                    handler : function() {
                        // appendgoods();
                        append();
                    }
                },
                {
                    text: '删除',
                    iconCls : 'icon-remove',
                    handler : function() {
                        removeDetail();
                    }
                },
                {
                    text: '撤销',
                    iconCls : 'icon-undo',
                    handler : function() {
                        rejectDetail();
                    }
                }
            ]
    });

    $('#goodsDg').datagrid({
        loadMsg: "正在加载，请稍等...",
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 2, //每页的数据条数，默认10
        pageList: [2, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : true,
        onSelect: onGoodsSelected  //行选择事件
     });
	 
	   $('#locationsDg').datagrid({
        loadMsg: "正在加载，请稍等...",
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 2, //每页的数据条数，默认10
        pageList: [2, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : true,
	    //rowStyler:function(index,row){    
        //if (row.locationref_plusnum>0){    
          //  return 'background-color:pink;color:blue;font-weight:bold;';    
        //}    
        //}   ,
        onSelect: onLocationsSelected//行选择事件
	
		
     });
}
function formatPrice(val,row){    
    if (val < 20){    
        return '<span style="color:red;">'+val+'</span>';    
    } else {    
        return val;    
    }    
}    

function onBeforeSelect(index,row){
    if(isBodyChanged || isHeadChanged){
        $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
        return false;
    }
    return true;
}

//商品参照
$.extend($.fn.datagrid.defaults.editors, {
    barcodeEditor : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' id='barcodeEditor' style='width:100px' onchange='barcodeChanged(this);'>");
            editorContainer.append(input)
            editorContainer.appendTo(container);
            return input;
        },
        getValue: function(target)
        {
            return $(target).val();
            //return $(target).children("input").val();
        },
        setValue: function(target, value)
        {
            $(target).val(value);
            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 30);
            } else {
                span.width(width - 30);
            }
        }

    }
});

//通过条码查询商品
function barcodeChanged(theInput){
    var value = theInput.value;
    if(value == ""){
        return;
    }
    var condition = {
        "goods.product_sku.bar_code": value
    };
    var reqData = JSON.stringify(condition);

    //定义查询条件

    $.ajax({
        method : 'POST',
        url : $posURL + "ocr-pointofsale/posprice/getPriceByCon?context=" + $token,
        async : true,
        data: reqData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(result) {
            var data = result.result[0];
            currentDetailRowObj.goods = data.goods;
            currentDetailRowObj.batch_code = data.invbatchcode;
            currentDetailRowObj.detail_price = data.detail_price;
            currentDetailRowObj.discount = data.discount;

            //-------刷新关联属性------
            var detailDg = $('#detailDg');
            var row = detailDg.datagrid('getSelected');
            var index = detailDg.datagrid('getRowIndex', row);

            row['product_sku_code'] = data.goods.product_sku_code;
            row['title'] = data.goods.title;
            row['batch_code'] = data.invbatchcode;
            row['sales_catelog'] = data.goods.sales_catelogs.name;
            row['bar_code'] = data.goods.product_sku.bar_code;
            if(data.goods.product_sku.product_specifications != null)
                row['specifications'] = data.goods.product_sku.product_specifications;

            row['base_unit'] = data.goods.product_sku.product_spu.base_unit;

            if(data.goods.product_sku.product_spu.brand != null) {
                row['brand'] = data.goods.product_sku.product_spu.brand.name;
                row['manufacturer'] = data.goods.product_sku.product_spu.brand.manufacturer.name;
            }

            row['purchase_price'] = data.purchase_price.price.currency.price;
            row['supply_price'] = data.supply_price.price.currency.price;

            detailDg.datagrid('refreshRow', index);

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });
}


//商品参照
$.extend($.fn.datagrid.defaults.editors, {
    goodsRef : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' id='goodsEditor' style='width:100px'>");
            //参照按钮
            var button = $("<button style='width: 23px; height: 23px' onclick='showGoodsRefDialog();'>...</button>");

            editorContainer.append(input).append(button);
            editorContainer.appendTo(container);
            return input;
        },
        getValue: function(target)
        {
            return $(target).val();
            //return $(target).children("input").val();
        },
        setValue: function(target, value)
        {
            $(target).val(value);
            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 30);
            } else {
                span.width(width - 30);
            }
        }

    }
});

//显示商品选择对话框
function showGoodsRefDialog() {
    $('#goodsRefDialog').window('open');
}

//绑定商品datagrid
function bindGoodsDg(data) {
    var dgLst = $('#goodsDg');
    var viewModel = new Array();
    for (var i in data.datas) {
        var dataItem = data.datas[i];
        var row_data = {
            product_sku_code: dataItem.product_sku_code,
            title: dataItem.title,
            batch_code:dataItem.invbatchcode,
            sales_catelog: dataItem.sales_catelogs,
            bar_code: dataItem.product_sku.bar_code,
            specifications: dataItem.product_sku.product_specifications,
            base_unit: dataItem.product_sku.product_spu.base_unit,
            //quantity: dataItem.quantity,
            brand: dataItem.product_sku.product_spu.brand.name,
            manufacturer: dataItem.product_sku.product_spu.brand.manufacturer.name,
            obj: dataItem
        };
        viewModel.push(row_data);
    }

    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}

//商品分类字段格式化
function formatCatelogsCol(catelogArray){
    //计算规格字符串
    var ret = '';
    for(var idx in catelogArray){
        var item = catelogArray[idx];
        if(idx == 0)
            ret = item.name;
        else
            ret += ',' + item.name;
    }
    return "<span title='" + ret + "'>" + ret + "</span>";
}

//构建分页条件
function buildGoodsQueryCond(total, pageNum, cateLog) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 10,
            total: total,
            total_page: -1
        },
        query: {'sales_catelogs.inner_code':cateLog}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

//品类树选择，查询商品列表
function catelogTreeSel(node) {

    var catelog = node.attributes.inner_code;

    //定义查询条件
    var condition = buildGoodsQueryCond(0, 1, catelog);

    $.ajax({
        method: 'POST',
        url: $goodsURL + "ocr-goods-center/goods-mgr/findall?context=3|3|lj|aaa",
        data: condition,
        async: true,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {

             bindGoodsDg(data);

            $('#goodsDg').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh: function () {
                    var thisDg = $('#goodsDg');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage: function (pPageIndex, pPageSize) {
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        var gridOpts = $('#goodsDg').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condition = buildGoodsQueryCond(0, pPageIndex, catelog);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url: $goodsURL + "ocr-goods-center/goods-mgr/findall?context=3|3|lj|aaa",
                            data: condition,
                            async: true,
                            dataType: 'json',
                            beforeSend: function (x) {
                                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                            },
                            success: function (data) {

                                bindGoodsDg(data);
                            },
                            error: function (x, e) {
                                alert(e.toString(), 0, "友好提醒");
                            }
                        });
                }
            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });
}




$.extend($.fn.datagrid.methods, {
    editCell: function(jq,param){
        return jq.each(function(){
            var opts = $(this).datagrid('options');
            var fields = $(this).datagrid('getColumnFields',true).concat($(this).datagrid('getColumnFields'));
            for(var i=0; i<fields.length; i++){
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor1 = col.editor;
                if (fields[i] != param.field){
                    col.editor = null;
                }
            }
            $(this).datagrid('beginEdit', param.index);
            for(var i=0; i<fields.length; i++){
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor = col.editor1;
            }
        });
    }
});


function endEditing(){
    if (editIndex == undefined){return true}
    if ($('#detailDg').datagrid('validateRow', editIndex)){
        $('#detailDg').datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    } else {
        return false;
    }
}
function onClickCell(index, field){
    if (endEditing()){

        isBodyChanged = true;

        $('#detailDg').datagrid('selectRow', index)
            .datagrid('editCell', {index:index,field:field});
        editIndex = index;
    }

}

function onAfterEdit(index, row){
    var a = 0;
}

function onEndEdit(index, row) {
    //对于合计行进行处理
    // var ed = $(this).datagrid('getEditor', {
    //     index: index,
    //     field: 'quantity'
    // });
    // if (ed != null && ed != undefined) {
    //     var newValue = $(ed.target).val();
    //     row.quantity = newValue; //设置当前行的数量值
    //     currentDetailRowObj.quantity = newValue; //设置当前行对象的值
    // }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'booknum'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.booknum = parseFloat(newValue); //设置当前行的数量值
        currentDetailRowObj.booknum = parseFloat(newValue); //设置当前行对象的值
    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'realnum'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.realnum = parseFloat(newValue); //设置当前行的数量值
        currentDetailRowObj.realnum = parseFloat(newValue); //设置当前行对象的值
    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'lossamount'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.lossamount = parseFloat(newValue); //设置当前行的数量值
        currentDetailRowObj.lossamount = parseFloat(newValue); //设置当前行对象的值
    }

    refreshSubTotalRows(); //刷新小计列
}


	
function append(){

    if (endEditing()){

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var newDetailObj = {
            booknum : 0,
            realnum : 0,
            lossamount : 0,
            goods:{},

        };
        cloneAllotInvObj.detail.push(newDetailObj);

        var rowData = {
            booknum : 0,
            realnum : 0,
            lossamount : 0,
            goods:{},

            obj: newDetailObj
        };

        $('#detailDg').datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        var data = $("#detailDg").datagrid('getData');
        data.originalRows.push(rowData);

        editIndex = $('#detailDg').datagrid('getRows').length-1;
        $('#detailDg').datagrid('selectRow', editIndex)
            .datagrid('beginEdit', editIndex);

        isBodyChanged = true;

    }
}

function newRep(){

    if (endEditing()){
        if(isBodyChanged || isHeadChanged){
            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
            return;
        }



        var dgList =  $('#dgList');
        var newObjIndex = dgList.datagrid('getRows').length;
        var newObj = {
            billno: "",
            checkdate: "",
            warehouses: {},
            department:"",
            checkpeople:"",
            outtype:"",
            intype:"",
            note:"",
            "detail": []
        };

        var rowData = {
            billno: "",
            checkdate: "",
            warehouses: {},
            department:"",
            checkpeople:"",
            outtype:"",
            intype:"",
            obj: newObj
        };

        dgList.datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        // var data = dgList.datagrid('getData');
        // data.originalRows.push(rowData);

        dgList.datagrid('selectRow', newObjIndex);

        isNewRep = true;

        isBodyChanged = true;

    }
}

function removeDetail(){
    if (currentRowIndex == undefined){return}
    $('#detailDg').datagrid('cancelEdit', currentRowIndex)
        .datagrid('deleteRow', currentRowIndex);
    cloneAllotInvObj.detail.splice(currentRowIndex,1);
    currentRowIndex = undefined;
  
    isBodyChanged = true;
}
/*function accept(){
    if (endEditing()){
        $('#detailDg').datagrid('acceptChanges');
    }
}*/

//回退表体
function rejectDetail(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;
    //克隆
    cloneAllotInvObj.detail = cloneJsonObject(allotInvObj.allotLocations);
    bindSelectedDataToSubDetail(cloneAllotInvObj.allotLocations);

    isBodyChanged = false;
}
/*function getChanges(){
    var rows = $('#detailDg').datagrid('getChanges');
    alert(rows.length+' rows are changed!');
}*/


//回退整个单据
function reject(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;

    if(isNewRep){
        removeRep();
    }else {
        //重新克隆
        cloneAllotInvObj = cloneJsonObject(allotInvObj);
        bindSelectedDataToCard(cloneAllotInvObj)
        bindSelectedDataToSubDetail(cloneAllotInvObj.allotLocations);

        isHeadChanged = false;
        isBodyChanged = false;
        isNewRep = false;
    }
}

//单元格加提示信息
function formatCellTooltip(value){
    return "<span title='" + value + "'>" + value + "</span>";
}



//绑定列表行数据
function bindDgListData(data){
    var dgLst = $('#dgList');
    var viewModel = new Array();

	
     for ( var i in data.datas) {
        var dataItem = data.datas[i];
		var state = data.datas[i].current_state;

        var row_data = {
            billno: dataItem.billno,
            checkdate:dataItem.checkdate,
            //warehouse:dataItem.warehouse,

            warehouses:dataItem.warehouses.name,
            department:dataItem.department,
            checkpeople:dataItem.checkpeople,
            outtype:dataItem.outtype,
            intype:dataItem.intype,
            note:dataItem.note,
            detail:dataItem.detail,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
                total: data.total,
                rows: viewModel
            });
}
var warehoseLoader = function (param, success, error) {
    $.ajax({
        method: 'POST',
        url: $invcenterURL + "ocr-inventorycenter/invorg-mgr/queryAll?context=" + $account + "|" + $account + "|lj|aaa",
        async: true,
        data: JSON.stringify({}),
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
            success(data.result);
        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            error.apply(this, args);
        }
    });
}





//构建分页条件
function buildRepsQueryCond(total, pageNum) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 5,
            total: total,
            total_page: -1
        }
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}
var repCurrentPageIndex = 1;
//加载数据列表
function loadDgList(){

    var condStr = buildRepsQueryCond(0,1);

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $invcenterURL + "ocr-inventorycenter/inventorycheck-mgr/query?context=" + $token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {

            bindDgListData(data);

            $('#dgList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#dgList');
                    thisDg.pagination('loading...');

                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                    if(isNewRep){
                        if(repCurrentPageIndex != pPageIndex) {
                            $('#dgList').datagrid('getPager').pagination('select', repCurrentPageIndex);
                            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
                        }
                        return;
                    }else {
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        repCurrentPageIndex = pPageIndex;
                        var gridOpts = $('#dgList').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condStr = buildRepsQueryCond(0, pPageIndex);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url: $invcenterURL + "ocr-inventorycenter/inventorycheck-mgr/query?context=" + $token,
                            data: condStr,
                            async: true,
                            dataType: 'json',
                            beforeSend: function (x) {
                                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                            },
                            success: function (data) {
                                bindDgListData(data);
                            },
                            error: function (x, e) {
                                alert(e.toString(), 0, "友好提醒");
                            }
                        });
                    }
                }
            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//行选择事件

var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    allotInvObjIndex = rowIndex;
    allotInvObj = rowData.obj;
    //wdq 2017年2月2日
    allotInvObj.current_state = rowData.current_state;

    //克隆数据
    cloneAllotInvObj = cloneJsonObject(allotInvObj);

    bindSelectedDataToCard(cloneAllotInvObj);
    bindSelectedDataToSubDetail(cloneAllotInvObj.detail);

    var viewModel = new Array();
    $('#locationsDg').datagrid('loadData',{
        total: 0,
        rows: viewModel
    });

    initialized = false;
}

var currentRowIndex = 0;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
    currentDetailRowObj = detailRowData.obj;
}

//绑定当前选择行的数据
function bindSelectedDataToCard(data){


    $('#billno').textbox('setValue',data.billno);
    $('#checkdate').textbox('setValue',data.checkdate);
    $('#warehouses').textbox('setValue',data.warehouses.name);
    $('#department').textbox('setValue',data.department);
    $('#checkpeople').textbox('setValue',data.checkpeople);
    $('#outtype').textbox('setValue',data.outtype.name);
    $('#intype').textbox('setValue',data.intype.name);
    $('#note').textbox('setValue',data.note);

}

function onMemberChanged() {
    if(initialized) return;
    cloneAllotInvObj.member_code = newValue;
    isBodyChanged = true;
}

//卡片内容变更后刷新父列表
function updateParentListRow(field, value){
    //-------刷新关联属性------
    var dgList = $('#dgList');
    var row = dgList.datagrid('getSelected');
    var index = dgList.datagrid('getRowIndex', row);

    row[field] = value;
    dgList.datagrid('refreshRow', index);
}

function onBillnoChanged(newValue,oldValue){
    if(initialized) return;
    cloneAllotInvObj.billno = newValue;
    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('billno', newValue);
}

function oncheckdateChanged(newValue,oldValue){
    if(initialized) return;
    cloneAllotInvObj.checkdate = newValue;
    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('checkdate', newValue);
}

function onNoteChanged(newValue,oldValue){
    if(initialized) return;
    cloneAllotInvObj.note = newValue;
    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('note', newValue);
}

function onDepartmentChanged(newValue,oldValue){
    if(initialized) return;
    cloneAllotInvObj.department = newValue;
    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('department', newValue);
}
function onCheckpeopleChanged(newValue,oldValue){
    if(initialized) return;
    cloneAllotInvObj.checkpeople = newValue;
    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('checkpeople', newValue);
}



function onOuttypeSelected(record){
    if(initialized) return;
    cloneAllotInvObj.outtype = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('outtype', record.name);
}
function onIntypeSelected(record){
    if(initialized) return;
    cloneAllotInvObj.intype = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('intype', record.name);
}



//仓库选择
function onWarehoseSelected(record){
    if(initialized) return;
    cloneAllotInvObj.warehouses = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('warehouses', record.name);
}




//绑定到子表
function bindSelectedDataToSubDetail(detailData){
    var detailDg = $('#detailDg');
    //detailDg.datagrid('loadData', { total: 0, rows: [] });
    bindDetailData(detailData);
}

//绑定表体数据
function bindDetailData(data){
    var dgLst = $('#detailDg');
    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];



        var row_data = {
            product_sku_code : dataItem.goods.product_sku_code,
            title : dataItem.goods.title,
            sales_catelog: dataItem.goods.sales_catelog,
            specifications: dataItem.goods.specifications,
            base_unit: dataItem.goods.base_unit,
            manufacturer:dataItem.goods.manufacturer,

            booknum: dataItem.booknum,
            realnum: dataItem.realnum,
			lossamount: dataItem.lossamount,

            obj: dataItem
        };
        viewModel.push(row_data);
        //dgLst.datagrid('appendRow', row_data);
    }

    dgLst.datagrid({loadFilter: pagerFilter}).datagrid('loadData',viewModel);
}

//规格字段格式化
function formatSpecificationCol(specArray){
    //计算规格字符串
    var specifications = '';
    for(var specIdx in specArray){
        var specItem = specArray[specIdx];
        if(specIdx == 0)
            specifications = specItem.specification_name + ':' + specItem.specification_value;
        else
            specifications += ',' + specItem.specification_name + ':' + specItem.specification_value;
    }
    return "<span title='" + specifications + "'>" + specifications + "</span>";
}



//detail数据前台分页
function pagerFilter(data){
    if (typeof data.length == 'number' && typeof data.splice == 'function'){    // 判断数据是否是数组
        data = {
            total: data.length,
            rows: data,
            footer: [
                buildSubTotalRow(data)
            ]
        }
    }
    var dg = $(this);
    var opts = dg.datagrid('options');
    var pager = dg.datagrid('getPager');
    pager.pagination({
        onSelectPage:function(pageNum, pageSize){
            opts.pageNumber = pageNum;
            opts.pageSize = pageSize;
            pager.pagination('refresh',{
                pageNumber:pageNum,
                pageSize:pageSize
            });

            //bindDetailData(data);
            dg.datagrid('loadData',data);
        }
    });
    if (!data.originalRows){
        data.originalRows = (data.rows);
    }
    var start = (opts.pageNumber-1)*parseInt(opts.pageSize);
    var end = start + parseInt(opts.pageSize);
    data.rows = (data.originalRows.slice(start, end));
    data.footer =  [
        // buildSubTotalRow(data.rows)
    ];
    return data;
}

//构建“合计”行
function buildSubTotalRow(data) {
    var subTotal = {
            product_sku_code: '<span class="subtotal">合计</span>',
            // // quantity: '<span class="subtotal">' + compute(data, "quantity") + '</span>',
            num: '<span class="subtotal">' + compute(data, "num") + '</span>',

        };
    return subTotal;
}

function compute(date, colName) {
    var total = 0;
    for (var i = 0; i < date.length; i++) {
        total += parseFloat(date[i][colName]);
    }
    return total;
}

//从新计算合计行
function refreshSubTotalRows(){
    //计算合计列
    var footerRows = $('#detailDg').datagrid('getFooterRows');
    var rows = $("#detailDg").datagrid("getRows"); //获取当前页的所有行。
    // footerRows[0]['quantity'] = '<span class="subtotal">' + computeForRows(rows, "quantity") + '</span>';
    // footerRows[0]['nynum'] = '<span class="subtotal">' + computeForRows(rows, "nynum") + '</span>';
    // footerRows[0]['nsnum'] = '<span class="subtotal">' + computeForRows(rows, "nsnum") + '</span>';
    // footerRows[0]['unqualifiednum'] = '<span class="subtotal">' + computeForRows(rows, "unqualifiednum") + '</span>';
    //
    // footerRows[0]['supply_amount'] = '<span class="subtotal">' + computeForRows(rows, "supply_amount") + '</span>';
    // footerRows[0]['discount_amount'] = '<span class="subtotal">' + computeForRows(rows, "discount_amount") + '</span>';
    $('#detailDg').datagrid('reloadFooter');
}

function computeForRows(rows, colName) {
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        total += parseFloat(row[colName]);
    }
    return total;
}

//排序
function compareDatetime(a,b){
    var oDate1 = new Date(a);
    var oDate2 = new Date(b);
    if(oDate1.getTime() > oDate2.getTime()){
        return 1;
        //alert('第一个大');
    } else if (oDate1.getTime() < oDate2.getTime()){
        return -1;
        //alert('第二个大');
    } else {
        return 0;
        //alert('相等');
    }
}

function compareDigit(a,b){
    if (a == b)
        return 0;
    return (a>b ? 1 : -1);
}

//显示商品选择对话框
function showLocationsRefDialog() {
    var dgLst =  $('#locationsRefDialog');
    dgLst.window('open');

}
$.extend($.fn.datagrid.defaults.editors, {
    locationsRef : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' id='locationsEditor' style='width:100px'>");
            //参照按钮
            var button = $("<button style='width: 23px; height: 23px' onclick='showLocationsRefDialog();'>...</button>");

            editorContainer.append(input).append(button);
            editorContainer.appendTo(container);
            return input;
        },
        getValue: function(target)
        {
            return $(target).val();
            //return $(target).children("input").val();
        },
        setValue: function(target, value)
        {

            $(target).val(value);
            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 30);
            } else {
                span.width(width - 30);
            }
        }

    }
});


//构建分页条件
function buildLocationsQueryCond(total, pageNum,sku,type) {
    var warehousecode = cloneAllotInvObj.warehouse.code;
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 2,
            total: total,
            total_page: -1
        },
        query: {'sku':sku,'type':type, 'warehousecode': warehousecode}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

//选择商品
function onLocationsSelected (index, rowData) {
    $('#locationsRefDialog').window('close');
 //   var selectdData = rowData.obj;
   // $('#locationsEditor').val(selectdData.title);
   
    //设置商品到当前表体行对象上
   // delete selectdData._id;
    currentDetailRowObj.locations = rowData.locationref_locationcode;

    //-------刷新关联属性------
    var row = $('#detailDg').datagrid('getSelected');
    var index = $('#detailDg').datagrid('getRowIndex', row);

    row['locations'] = rowData.locationref_locationcode;
    $('#detailDg').datagrid('refreshRow', index);
   
}


//选择商品
function onGoodsSelected (index, rowData) {

    endEditing();

    $('#goodsRefDialog').window('close');
	
  


    currentDetailRowObj.goods = rowData;
	
    currentDetailRowObj.goods.account=rowData.obj.account;
	
		
	delete currentDetailRowObj.goods.obj;
	
	
    // currentDetailRowObj.title = rowData.title;

    //-------刷新关联属性------
    var row = $('#detailDg').datagrid('getSelected');
    var index = $('#detailDg').datagrid('getRowIndex', row);

    row['title'] = rowData.title;
    row['product_sku_code'] = rowData.product_sku_code==undefined?"":rowData.product_sku_code;
    row['sales_catelog']=rowData.sales_catelog;
    row['bar_code'] = rowData.bar_code == undefined ? "" :rowData.bar_code;
    row['specifications'] = rowData.specifications;
    row['base_unit'] = rowData.base_unit;
    row['manufacturer'] = rowData.manufacturer == undefined ? "":rowData.manufacturer;

    $('#detailDg').datagrid('refreshRow', index);

}

//构建分页条件
function buildGoodRefQueryCond(sku,nsnum,warehousecode) {
    var condition = {
		
        query: {'sku':sku,'type':"fixed",'nsnum':nsnum,"warehousecode":warehousecode}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

function goodsRefReturnAppend(){
	
 $('#win').window('close');
 
 var nsnum= parseFloat($('#ref_nsnum').val());//实收数量
 var selectdData= $('#ref_goods').data();
 var sku =selectdData.product_sku_code;
 
 var warehousecode = cloneAllotInvObj.warehouse.code;
 var con =buildGoodRefQueryCond(sku,nsnum,warehousecode);

	
 //根据sku ，数量 ，匹配一个或多个货位，
  $.ajax({
            method: 'POST',
            url: $invcenterURL + "ocr-inventorycenter/stockonhand-mgr/automatch_location?context=" + $token,
            data: con,
            async: true,
            dataType: 'json',
            success: function (data) {
				
				if(null==data[0].locationcode ||data[0].locationcode==""){
					alert_autoClose("提示","此商品，自动匹配货位无数据，请手工添加!");
					//$.messager.alert('信息提示','货位自动匹配无数据，请手工添加!');
					console.log("货位自动匹配无数据，请手工添加");
				}

				for (var i in data) {
					addnewlines(i, data[i], selectdData);
                }			
			},
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });
			

}




function refExpdateDateSel(date){
	var dd=date.format("yyyy-MM-dd");
	 $('#ref_expdatestr').val(dd);	
	
	
   
}


function removeRep(){

    if (allotInvObjIndex == undefined || allotInvObjIndex == null){return}

    obj = new Object();
    obj._id = cloneAllotInvObj._id;

    $.messager.confirm('删除警告', '是否确认删除?', function(r){
        if (r){

            $.ajax({
                method: 'POST',
                url: $invcenterURL + "ocr-inventorycenter/inventorycheck-mgr/remove?context=" + $token,
                data: JSON.stringify(obj),
                async: true,
                dataType: 'json',
                beforeSend: function (x) {
                    x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                },
                success: function (data) {
                    //$.messager.alert('提示','删除成功!');
                    resetState();

                    var dgList = $('#dgList');
                    dgList.datagrid('deleteRow', allotInvObjIndex);
                    currentRowIndex = undefined;

                    //$.messager.alert('提示','删除成功!');
                    alert_autoClose('提示','删除成功!');

                    //当前指针指向正确的位置
                    var rowCount = dgList.datagrid('getRows').length + 1;
                    if(rowCount > 0){
                        if(allotInvObjIndex == 0){
                            dgList.datagrid('selectRow',cloneAllotInvObj);
                        }else{
                            if(allotInvObjIndex == rowCount -1){
                                dgList.datagrid('selectRow',cloneAllotInvObj-1);
                            }else{
                                dgList.datagrid('selectRow',cloneAllotInvObj+1);
                            }
                        }
                    }
                },
                error: function (x, e) {
                    alert(e.toString(), 0, "友好提醒");
                }
            });
        }
    });
}

function approve(){

  if (allotInvObjIndex == undefined || allotInvObjIndex == null){return}

    $.messager.confirm('提示', '是否确认?', function(r){
        if (r){
			var param =  JSON.stringify(cloneAllotInvObj);
 
            $.ajax({
                method: 'POST',
                url: $invcenterURL + "ocr-inventorycenter/inventorycheck-mgr/approve?context=" + $token,
                data: param,
                async: true,
                dataType: 'json',
                beforeSend: function (x) {
                    x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                },
                success: function (data) {
					
                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                var index = dgList.datagrid('getRowIndex', row);
                row.obj = data;
              
                onRowSelected(index, row);

                resetState();
                alert_autoClose('提示','确认成功!');
                },
                error: function (x, e) {
                    alert(e.toString(), 0, "友好提醒");
                }
            });
        }
    });
}
