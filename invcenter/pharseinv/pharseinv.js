function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '渠道补货单列表',
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
    $('#detailDg').datagrid({
        title : '渠道补货单详情',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : false,
        showFooter: true,
        onLoadSuccess: addSubTotalRow,
        onClickCell: onClickCell,
        onEndEdit: onEndEdit,
        toolbar :
            [    {
                text : '新增',
                iconCls : 'icon-add',
                handler : function() {
                    viewDetail();
                }
                },
                {
                    text: '保存',
                    iconCls : 'icon-save',
                    handler : function() {
                        alert('帮助按钮');
                    }
                },
                {
                    text: '修改',
                    iconCls : 'icon-edit',
                    handler : function() {
                        alert('帮助按钮');
                    }
                },
                {
                    text: '删除',
                    iconCls : 'icon-remove',
                    handler : function() {
                        alert('帮助按钮');
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
        //dgLst.datagrid('appendRow', row_data);
    }

    //dgLst.datagrid('loadData', viewModel);

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

function buildGoodsQueryCond(total, pageNum, cateLog) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 2,
            total: total,
            total_page: -1
        },
        query: {'sales_catelogs.inner_code':cateLog}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

//品类树选择
function catelogTreeSel(node) {

    var catelog = node.attributes.inner_code;

    //定义查询条件
    var condition = buildGoodsQueryCond(0, 1, catelog);

    $.ajax({
        method: 'POST',
        url: $apiBaseURL + "ocr-productcenter/product-mgr/findall?context=3|3|lj|aaa",
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
                        url: $apiBaseURL + "ocr-productcenter/product-mgr/findall?context=3|3|lj|aaa",
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

/*function closeGoodsRef(){
    $('#goodsRefDialog').window('close')
}*/

function onGoodsSelected (rowIndex, rowData) {
    $('#goodsRefDialog').window('close');
    var selectdData = rowData.obj;

    //

}


function goodsRefReturn(){

}

var editIndex = undefined;
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
    if (editIndex != index){
        if (endEditing()){
            $('#detailDg').datagrid('selectRow', index)
                .datagrid('beginEdit', index);
            var ed = $('#detailDg').datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            editIndex = index;
        } else {
            setTimeout(function(){
                $('#detailDg').datagrid('selectRow', editIndex);
            },0);
        }
    }
}
function onEndEdit(index, row) {
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'title'
    });
    row.title = $(ed.target).val();
}
function append(){
    if (endEditing()){
        $('#detailDg').datagrid('appendRow',{status:'P'});
        editIndex = $('#detailDg').datagrid('getRows').length-1;
        $('#detailDg').datagrid('selectRow', editIndex)
            .datagrid('beginEdit', editIndex);
    }
}
function removeit(){
    if (editIndex == undefined){return}
    $('#detailDg').datagrid('cancelEdit', editIndex)
        .datagrid('deleteRow', editIndex);
    editIndex = undefined;
}
function accept(){
    if (endEditing()){
        $('#dg').datagrid('acceptChanges');
    }
}
function reject(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;
}
function getChanges(){
    var rows = $('#detailDg').datagrid('getChanges');
    alert(rows.length+' rows are changed!');
}

//单元格加提示信息
function formatCellTooltip(value){
    return "<span title='" + value + "'>" + value + "</span>";
}

//绑定列表行数据
function bindDgListData(data){
    var dgLst = $('#dgList');
    var viewModel = new Array();
    for ( var i in data.rows) {
        var dataItem = data.rows[i];
        var row_data = {
            code : dataItem.bo_id,
            req_date : dataItem.req_date,
            req_send_date: dataItem.req_send_date,
            req_code : dataItem.req_code,
            channel_name: dataItem.channel.name,
            restocking_warehose: dataItem.restocking_warehose.name,
            is_completed: dataItem.is_completed,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
                total: data.total,
                rows: viewModel
            });
}

function clickHanler(){
    var parentwin = window.parent;
    parentwin.postMessage("aaa","*");

    //alert(1);
}

//价值数据列表
function loadDgList(){

    //定义查询条件
    $.ajax({
        method : 'GET',
        url : $apiBaseURL + "ocr-productcenter/catelog-mgr/get_replenishment?context=3|3|lj|aaa",
        async : true,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
             bindDgListData(data);

            $('#dgList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#dgList');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                    //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                    var gridOpts = $('#dgList').datagrid('options');
                    gridOpts.pageNumber = pPageIndex;
                    gridOpts.pageSize = pPageSize;
                    //定义查询条件
                    $.ajax({
                        method : 'GET',
                        url : $apiBaseURL + "ocr-productcenter/catelog-mgr/get_replenishment?context=3|3|lj|aaa",
                        async : true,
                        dataType : 'json',
                        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                        success : function(data) {
                             bindDgListData(data);
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


//行选择事件
function onRowSelected (rowIndex, rowData) {
    bindSelectedDataToCard(rowData.obj);
    bindSelectedDataToSubDetail(rowData.obj.details);
}

//绑定当前选择行的数据
function bindSelectedDataToCard(data){
    $('#code').textbox('setValue',data.bo_id);
    $('#req_code').textbox('setValue',data.req_code);
    $('#req_date').datebox('setValue',data.req_date);

    $('#channel_type').textbox('setValue',data.channel.channel_type.name);
    $('#channel').combotree('setValue',data.channel.code);
    if(data.channel.customer != null)
        $('#customer').textbox('setValue',data.channel.customer.name);

    $('#req_send_date').datebox('setValue',data.req_send_date);

    $('#restocking_warehose').combobox('setValue',data.restocking_warehose.code);

}

//渠道选择
function channelSel(record){
    $('#channel_type').textbox('setValue',record.attributes.channel_type.name);

    if(record.attributes.customer != null)
        $('#customer').textbox('setValue',record.attributes.customer.name);
    else
        $('#customer').textbox('setValue',"");
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

 /*       //计算规格字符串
        var specifications = '';
        var specArray = dataItem.goods.product_sku.product_specifications;
        for(var specIdx in specArray){
            var specItem = specArray[specIdx];
            if(specIdx == 0)
                specifications = specItem.specification_name + ':' + specItem.specification_value;
            else
                specifications += ',' + specItem.specification_name + ':' + specItem.specification_value;
        }*/

        var row_data = {
            product_sku_code : dataItem.detail_code,
            title : dataItem.goods.title,
            sales_catelog: dataItem.goods.sales_catelogs[0].name,
            bar_code : dataItem.goods.product_sku.bar_code,
            specifications: dataItem.goods.product_sku.product_specifications,
            base_unit: dataItem.goods.product_sku.product_spu.base_unit,
            quantity: dataItem.quantity,
            supply_price: dataItem.supply_price.price_including_tax.currency.money,
            retail_price: dataItem.retail_price.price_including_tax.currency.money,
            commission: dataItem.commission.commission_value.currency.money,
            brand: dataItem.goods.product_sku.product_spu.brand.name,
            manufacturer: dataItem.goods.product_sku.product_spu.brand.manufacturer.name
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
            rows: data
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
    return data;
}

///加“合计”行
function addSubTotalRow() {
    $('#detailDg').datagrid('appendRow', {
        product_sku_code: '<span class="subtotal">合计</span>',
        quantity: '<span class="subtotal">' + compute("quantity") + '</span>',
        title : '',
        sales_catelog: '',
        bar_code : '',
        specifications: '',
        base_unit: '',
        supply_price: '',
        retail_price: '',
        commission: '',
        brand: '',
        manufacturer: ''
    });
}
//指定列求和
function compute(colName) {
    var rows = $('#detailDg').datagrid('getRows');
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
        total += parseFloat(rows[i][colName]);
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



/*------------------ 如下LCL增加  */
    function add() {
        var newtab = new Object();
        newtab.title = "采购入库单新增";
        newtab.url = "inventroyCenterApp/pharseinv/pharseinv-add.html";
        var json = JSON.stringify(newtab);
        var parentwin = window.parent;
        parentwin.postMessage(json, "*");
    }

    function save() {
        $.ajax({
            method: "POST",
            url: $apiBaseURL + "ocr-inventorycenter/pharseinv-mgr/create?context=3|3|lj|aaa",
            data: getParam(),
            async: true,
            dataType: 'json',
            beforeSend: function(x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function(data) {
                bindHeadToCard();
                bindSelectedDataToSubDetail();
                layer.alert(e.toString(), 0, "保存成功");

            },
            error: function(x, e) {
                alert(e.toString(), 0, "保存失败");
            }
        });

    }
    //得到所有表单传入数据
    function getParam() {
        var param = {
            "code": getInputValue("code"),
            "req_code": getInputValue("req_code"),		
			"channel": getInputValue("channel"),
            "channel_type": getInputValue("channel_type"),
            "bids": getSubParam(),
        }
        for (key in param) {
            if (!param[key]) {
                delete param[key];
            }
        }

        var jso = JSON.stringify(param);
        return jso;
    }

	//获得子表传入数据
    function getSubParam() {
        if (endEditing()) {
            var $dg = $('#detailDg');
            var rows = $dg.datagrid('getChanges');
            if (rows.length) {
                var inserted = $dg.datagrid('getChanges', "inserted");
                var deleted = $dg.datagrid('getChanges', "deleted");
                var updated = $dg.datagrid('getChanges', "updated");
                var effectRow = new Object();
                if (inserted.length) {
                    effectRow["inserted"] = JSON.stringify(inserted);
                }
                if (deleted.length) {
                    effectRow["deleted"] = JSON.stringify(deleted);
                }
                if (updated.length) {
                    effectRow["updated"] = JSON.stringify(updated);
                }
            }
        }
        return effectRow;

    }
	
   function getInputValue(inputName) {
        var result = "";
        $(":input[id='" + inputName + "']").each(function(i, item) {
            result += "," + $(item).val();
        });
        return result.replace(",", "");
    }
	

/*------------------ 如下LCL增加  子表 */
	
	/*如下js为子表js 增删改查*/
var editIndex = undefined; //定义全局变量：当前编辑的行
var dgOptions = {
    rownumbers: true,
    fit: true,
    border: false,
    rownumbers: true,
    toolbar: '#detail_tb',
    pageSize: 10,
    pagination: true,
    multiSort: true,
    toolbar: [{
        text: '添加',
        iconCls: 'icon-add',
        handler: function() {
            addline();
        }
    },
    '-', {
        text: '删除',
        iconCls: 'icon-remove',
        handler: function() {
            deleteline();
        }
    },
    '-',{
        text: '取消',
        iconCls: 'icon-undo',
        handler: function() {
            reject();
        }
    }, ],

    onAfterEdit: function(rowIndex, rowData, changes) {
        onAfterEdit(rowIndex, rowData, changes);
    },
    onDblClickRow: function(rowIndex, rowData) {
        onDblClickRow(rowIndex, rowData);

    }
	};
    $(function() {

        $('#detailDg').datagrid(dgOptions);
    }
	);
	function reject(){
			$('#detailDg').datagrid('rejectChanges');
			editIndex = undefined;
		}
		
    function onAfterEdit(rowIndex, rowData, changes) {

        //endEdit该方法触发此事件
        console.info(rowData);
        editIndex = undefined;
    }

    function onDblClickRow(rowIndex, rowData) {
        //双击开启编辑行
        if (editIndex != undefined) {
            $('#detailDg').datagrid("endEdit", editIndex);
        }
        if (editIndex == undefined) {
            $('#detailDg').datagrid("beginEdit", rowIndex);
            editIndex = rowIndex;
        }

    }

    //增加行 表体
    function addline() {
        //添加时先判断是否有开启编辑的行，如果有则把开户编辑的那行结束编辑          
        //添加时如果没有正在编辑的行，则在datagrid的第一行插入一行
        if (editIndex == undefined || editIndex == 0) {
            $('#detailDg').datagrid("insertRow", {
                index: 0,
                row: {}
            });
            //将新插入的那一行开户编辑状态
            $('#detailDg').datagrid("beginEdit", 0);
            //给当前编辑的行赋值
            editIndex = 0;
        }

    }

    function deleteline() {
        //删除时先获取选择行
        var rows = $('#detailDg').datagrid("getSelections");
        //选择要删除的行
        if (rows.length > 0) {
            $.messager.confirm("提示", "你确定要删除吗?",
            function(r) {
                if (r) {
                    var ids = [];
                    for (var i = 0; i < rows.length; i++) {
                        ids.push(rows[i]);
                    }

                    for (var i = 0; i < ids.length; i++) {
                        var index = $('#detailDg').datagrid('getRowIndex', ids[i]);
                        $('#detailDg').datagrid('deleteRow', index);
                    }

                }
            });
        } else {
            $.messager.alert("提示", "请选择要删除的行", "error");
        }
    }

    function endEditing() {
        if (editIndex == undefined) {
            return true
        }
        if ($('#detailDg').datagrid('validateRow', editIndex)) {
            $('#detailDg').datagrid('endEdit', editIndex); //当前行编辑事件取消
            editIndex = undefined; //重置编辑行索引对象，返回真，允许编辑
            return true;
        } else {
            return false;
        }
    }



