var replenishmentObjIndex;
var replenishmentObj;

//clone的数据
var cloneReplenishmentObj;
var currentDetailRowObj;

//主子表状态
var isHeadChanged = false;


//保存
function save(){
    if(isHeadChanged){
        $.ajax({
            method: 'POST',
            url: $salesURL + "ocr-sales-center/channel-restocking/create?context=3|3|lj|aaa",
            data: JSON.stringify(cloneReplenishmentObj),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                //-------刷新关联属性------
                cloneReplenishmentObj = data;
                replenishmentObj = cloneReplenishmentObj;

                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                var index = dgList.datagrid('getRowIndex', row);
                row['code'] = data.bo_id;
                row['req_date'] = data.req_date;
                row['req_send_date'] = data.req_send_date;
                row.obj = replenishmentObj;
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


function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '发货单列表',
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
        title : '发补货单详情',
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
        showFooter: true
        //onLoadSuccess: addSubTotalRow,

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

//单元格加提示信息
function formatCellTooltip(value){
    return "<span title='" + value + "'>" + value + "</span>";
}

//绑定列表行数据
function bindDgListData(data){
    var dgLst = $('#dgList');
    var viewModel = new Array();
    for ( var i in data.datas) {
        var dataItem = data.datas[i].bo;
        var row_data = {
            code : dataItem.bo_id,
            ship_date : dataItem.ship_date,
            channel_name: dataItem.channel.name,
            restocking_warehouse : dataItem.restocking_warehouse.name,
            target_warehouse: dataItem.target_warehouse.name,
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
        url : $salesURL + "ocr-sales-center/shipment/find-created?context=3|3|lj|aaa",
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
                    alert('before refresh');
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
                            url : $salesURL + "ocr-sales-center/shipment/find-created?context=3|3|lj|aaa",
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
    if(rowData == undefined || rowData == null){
        return;
    }

    initialized = true;

    replenishmentObjIndex = rowIndex;
    replenishmentObj = rowData.obj;

    //克隆数据
    cloneReplenishmentObj = cloneJsonObject(replenishmentObj);

    bindSelectedDataToCard(cloneReplenishmentObj);
    bindSelectedDataToSubDetail(cloneReplenishmentObj.details);

    initialized = false;
}

var currentRowIndex = 0;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
    currentDetailRowObj = detailRowData.obj;
}

//绑定当前选择行的数据
function bindSelectedDataToCard(data){
    $('#code').textbox('setValue',data.bo_id);
    $('#replenishments_id').textbox('setValue',data.replenishments_id);
    $('#ship_date').datebox('setValue',data.ship_date);

    $('#channel').textbox('setValue', data.channel.name);
    $('#restocking_warehouse').textbox('setValue', data.restocking_warehouse.name);
    $('#target_warehouse').textbox('setValue', data.target_warehouse.name);

    $('#ship_to').textbox('setValue', data.channel.ship_to.address.region.full_name + data.channel.ship_to.address.address_detail);
    $('#contacter').textbox('setValue', data.channel.ship_to.contact.user.name);
    $('#customer').textbox('setValue', data.channel.customer.name);

    $('#is_completed').attr("checked", true);

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

        var shelfLife = "";
        if(dataItem.shelf_life != undefined && dataItem.shelf_life != null) {
            shelfLife = dataItem.shelf_life;
        }
        var invbatchcode = "";
        if(dataItem.invbatchcode != undefined && dataItem.invbatchcode != null){
            invbatchcode = dataItem.invbatchcode;
        }

        var row_data = {
            product_sku_code : dataItem.goods.product_sku_code,
            title : dataItem.goods.title,
            sales_catelog: dataItem.goods.sales_catelogs,
            bar_code : dataItem.goods.product_sku.bar_code,
            invbatchcode: invbatchcode,
            shelf_life: shelfLife,
            specifications: dataItem.goods.product_sku.product_specifications,
            base_unit: dataItem.goods.product_sku.product_spu.base_unit,
            quantity: dataItem.quantity,
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
        buildSubTotalRow(data.rows)
    ];
    return data;
}

//构建“合计”行
function buildSubTotalRow(data) {
    var subTotal = {
        product_sku_code: '<span class="subtotal">合计</span>',
        quantity: '<span class="subtotal">' + compute(data, "quantity") + '</span>',
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
    footerRows[0]['quantity'] = '<span class="subtotal">' + computeForRows(rows, "quantity") + '</span>';
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