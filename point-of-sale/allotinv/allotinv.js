﻿var allotInvObjIndex;
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
function save() {
    if (isHeadChanged || isBodyChanged || isNewRep) {
        $.ajax({
            method: 'POST',
            url: $posURL + "ocr-pointofsale/allotinv/confirm?context=" + $token_pos,
            data: JSON.stringify(cloneAllotInvObj),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                resetState();

                var dgList = $('#dgList');
                dgList.datagrid('deleteRow', allotInvObjIndex);
                currentRowIndex = undefined;

                //$.messager.alert('提示','删除成功!');
                alert_autoClose('提示', '删除成功!');

                //当前指针指向正确的位置
                var rowCount = dgList.datagrid('getRows').length;
                if (rowCount > 0) {
                    if (allotInvObjIndex == 0) {
                        dgList.datagrid('selectRow', allotInvObjIndex);
                    } else {
                        if (allotInvObjIndex == rowCount - 1) {
                            dgList.datagrid('selectRow', allotInvObjIndex - 1);
                        } else {
                            dgList.datagrid('selectRow', allotInvObjIndex + 1);
                        }
                    }
                } else {
                    clear();
                }
            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });
    }
}
function clear() {

    if (endEditing()) {
        if (isBodyChanged || isHeadChanged) {
            $.messager.alert('数据变化提示', '当前数据已经变化，请先保存或取消!');
            return;
        }

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var dgList = $('#dgList');
        var newObjIndex = dgList.datagrid('getRows').length;
        var newObj = {
            bo_id: "",
            replenishment_code: "",
            supply_date: "",
            request_date: "",
            restocking_warehouse: "",
            detail:[]
        };

        var rowData = {
            bo_id: "",
            replenishment_code: "",
            supply_date: "",
            request_date: "",
            restocking_warehouse: "",
            obj: newObj
        };

        dgList.datagrid('appendRow', rowData);

        //必须加入到originalRows中，否则翻页会有问题
        //var data = dgList.datagrid('getData');
        //data.originalRows.push(rowData);

        dgList.datagrid('selectRow', newObjIndex);

        isNewRep = true;

        isBodyChanged = true;

    }
}

function resetState() {
    editIndex = undefined;
    isNewRep = false;
    isHeadChanged = false;
    isBodyChanged = false;
}

function dgListSetting() {
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title: '补货入库单列表',
        iconCls: 'icon-a_detail',
        fit: true,
        fitColumns: false,
        remoteSort: false,
        rownumbers: true,
        pagination: true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect: true,
        border: false,
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

function detailListSetting() {
    $('#detailDg').datagrid({
        title: '补货入库单详情',
        iconCls: 'icon-a_detail',
        fit: true,
        fitColumns: false,
        remoteSort: false,
        rownumbers: true,
        pagination: true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect: true,
        border: false,
        showFooter: true,
        //onLoadSuccess: addSubTotalRow,
        onClickCell: onClickCell,
        onEndEdit: onEndEdit,
        onSelect: onDetailRowSelected,  //行选择事件
        toolbar: []
    });

    $('#goodsDg').datagrid({
        loadMsg: "正在加载，请稍等...",
        iconCls: 'icon-a_detail',
        fit: true,
        fitColumns: false,
        remoteSort: false,
        rownumbers: true,
        pagination: true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 2, //每页的数据条数，默认10
        pageList: [2, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect: true,
        border: true,
        onSelect: onGoodsSelected  //行选择事件
    });
}

function onBeforeSelect(index, row) {
    if (isBodyChanged || isHeadChanged) {
        $.messager.alert('数据变化提示', '当前数据已经变化，请先保存或取消!');
        return false;
    }
    return true;
}


//商品分类字段格式化
function formatCatelogsCol(catelogArray) {
    //计算规格字符串
    var ret = '';
    for (var idx in catelogArray) {
        var item = catelogArray[idx];
        if (idx == 0)
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
            page_size: 2,
            total: total,
            total_page: -1
        },
        query: {'sales_catelogs.inner_code': cateLog}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}


//选择商品
function onGoodsSelected(index, rowData) {
    $('#goodsRefDialog').window('close');
    var selectdData = rowData.obj;
    $('#goodsEditor').val(selectdData.title);

    //设置商品到当前表体行对象上
    delete selectdData._id;
    currentDetailRowObj.goods = selectdData;

    //-------刷新关联属性------
    var row = $('#detailDg').datagrid('getSelected');
    var index = $('#detailDg').datagrid('getRowIndex', row);

    row['product_sku_code'] = selectdData.product_sku_code;
    row['title'] = selectdData.title;
    row['sales_catelog'] = selectdData.sales_catelogs;
    row['bar_code'] = selectdData.product_sku.bar_code;
    if (selectdData.product_sku.product_specifications != null)
        row['specifications'] = selectdData.product_sku.product_specifications;

    row['base_unit'] = selectdData.product_sku.product_spu.base_unit;

    if (selectdData.product_sku.product_spu.brand != null) {
        row['brand'] = selectdData.product_sku.product_spu.brand.name;
        row['manufacturer'] = selectdData.product_sku.product_spu.brand.manufacturer.name;
    }
}

$.extend($.fn.datagrid.methods, {
    editCell: function (jq, param) {
        return jq.each(function () {
            var opts = $(this).datagrid('options');
            var fields = $(this).datagrid('getColumnFields', true).concat($(this).datagrid('getColumnFields'));
            for (var i = 0; i < fields.length; i++) {
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor1 = col.editor;
                if (fields[i] != param.field) {
                    col.editor = null;
                }
            }
            $(this).datagrid('beginEdit', param.index);
            for (var i = 0; i < fields.length; i++) {
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor = col.editor1;
            }
        });
    }
});


function endEditing() {
    if (editIndex == undefined) {
        return true
    }
    if ($('#detailDg').datagrid('validateRow', editIndex)) {
        $('#detailDg').datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    } else {
        return false;
    }
}

function onClickCell(index, field) {
    if (endEditing()) {

        isBodyChanged = true;

        $('#detailDg').datagrid('selectRow', index)
            .datagrid('editCell', {index: index, field: field});
        editIndex = index;
    }

}

function onEndEdit(index, row) {
    //对于合计行进行处理
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'quantity_should'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.quantity_should = newValue; //设置当前行的数量值
        currentDetailRowObj.quantity_should = newValue; //设置当前行对象的值
    }
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'quantity_fact'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.quantity_fact = newValue; //设置当前行的数量值
        currentDetailRowObj.quantity_fact = newValue; //设置当前行对象的值
    }
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'quantity_reject'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.quantity_reject = newValue; //设置当前行的数量值
        currentDetailRowObj.quantity_reject = newValue; //设置当前行对象的值
    }
    refreshSubTotalRows(); //刷新小计列
}

function receive() {
    isBodyChanged = true;
}


//回退表体
function rejectDetail() {
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;
    //克隆
    cloneAllotInvObj.detail = cloneJsonObject(allotInvObj.detail);
    bindSelectedDataToSubDetail(cloneAllotInvObj.detail);

    isBodyChanged = false;
}

/*function getChanges(){
 var rows = $('#detailDg').datagrid('getChanges');
 alert(rows.length+' rows are changed!');
 }*/


//回退整个单据
function reject() {
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;

    if (isNewRep) {
        removeRep();
    } else {
        //重新克隆
        cloneAllotInvObj = cloneJsonObject(allotInvObj);
        bindSelectedDataToCard(cloneAllotInvObj)
        bindSelectedDataToSubDetail(cloneAllotInvObj.detail);

        isHeadChanged = false;
        isBodyChanged = false;
        isNewRep = false;
    }
}

//单元格加提示信息
function formatCellTooltip(value) {
    return "<span title='" + value + "'>" + value + "</span>";
}

//绑定列表行数据
function bindDgListData(data) {
    var dgLst = $('#dgList');
    var viewModel = new Array();
    for (var i in data.datas) {
        var dataItem = data.datas[i].bo;
        var row_data = {
            bo_id: dataItem.bo_id,
            replenishment_code: dataItem.replenishment_code,
            supply_date: dataItem.supply_date,
            request_date: dataItem.request_date,
            restocking_warehouse: dataItem.restocking_warehouse.name,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData', {
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
function loadDgList() {

    var condStr = buildRepsQueryCond(0, 1);

    //定义查询条件
    $.ajax({
        method: 'POST',
        url: $posURL + "ocr-pointofsale/allotinv/getall?context=" + $token_pos,
        async: true,
        data: condStr,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
            bindDgListData(data);

            $('#dgList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh: function () {
                    var thisDg = $('#dgList');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage: function (pPageIndex, pPageSize) {
                    if (isNewRep) {
                        if (repCurrentPageIndex != pPageIndex) {
                            $('#dgList').datagrid('getPager').pagination('select', repCurrentPageIndex);
                            $.messager.alert('数据变化提示', '当前数据已经变化，请先保存或取消!');
                        }
                        return;
                    } else {
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        repCurrentPageIndex = pPageIndex;
                        var gridOpts = $('#dgList').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condStr = buildRepsQueryCond(0, pPageIndex);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url: $posURL + "ocr-pointofsale/allotinv/getall?context=" + $token_pos,
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

var restockingWarehoseLoader = function (param, success, error) {
    $.ajax({
        method: 'POST',
        url: $invcenterURL + "ocr-inventorycenter/invorg-mgr/query?context=" + $account_pos + "|" + $account_pos + "|lj|aaa",
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

var warehoseLoader = function (param, success, error) {
    $.ajax({
        method: 'POST',
        url: $invcenterURL + "ocr-inventorycenter/invorg-mgr/query?context=" + $account_pos + "|" + $account_pos + "|lj|aaa",
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
//行选择事件

var initialized = false;

function onRowSelected(rowIndex, rowData) {
    initialized = true;

    allotInvObjIndex = rowIndex;
    allotInvObj = rowData.obj;

    //克隆数据
    cloneAllotInvObj = cloneJsonObject(allotInvObj);

    bindSelectedDataToCard(cloneAllotInvObj);
    bindSelectedDataToSubDetail(cloneAllotInvObj.detail);

    initialized = false;
}

var currentRowIndex = 0;

function onDetailRowSelected(rowIndex, detailRowData) {
    currentRowIndex = rowIndex;
    currentDetailRowObj = detailRowData.obj;
}

//绑定当前选择行的数据
function bindSelectedDataToCard(data) {
    $('#bo_id').textbox('setValue', data.bo_id);
    $('#replenishment_code').textbox('setValue', data.replenishment_code);
    $('#supply_date').datebox('setValue', data.supply_date);
    $('#request_date').datebox('setValue', data.request_date);
    if (data.confirm_date != undefined)
        $('#confirm_date').datebox('setValue', data.confirm_date);

    if (data.restocking_warehouse != null) {
        $('#restocking_warehouse').combobox('setValue', data.restocking_warehouse.code);
    }
    else {
        $('#restocking_warehose').combobox('setValue', "");
    }
    if (data.warehouse != null) {
        $('#warehouse').combobox('setValue', data.warehouse.code);
    }
    else {
        $('#warehouse').combobox('setValue', "");
    }
}

//卡片内容变更后刷新父列表
function updateParentListRow(field, value) {
    //-------刷新关联属性------
    var dgList = $('#dgList');
    var row = dgList.datagrid('getSelected');
    var index = dgList.datagrid('getRowIndex', row);

    row[field] = value;
    dgList.datagrid('refreshRow', index);
}

function onCodeChanged(newValue, oldValue) {
    if (initialized) return;
    cloneAllotInvObj.code = newValue;
    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('code', newValue);
}

function onReplenishmentCodeChanged(newValue, oldValue) {
    if (initialized) return;
    cloneAllotInvObj.replenishment_code = newValue;
    isBodyChanged = true;

    //-------刷新关联属性------
    //updateParentListRow('req_code', newValue);
}


function onConfirmDateSel(date) {
    if (initialized) return;
    cloneAllotInvObj.confirm_date = date.format("yyyy-MM-dd");
    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('confirm_date', cloneAllotInvObj.confirm_date);
}


//仓库选择
function onWarehoseSelected(record) {
    if (initialized) return;
    cloneAllotInvObj.warehouse = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('warehouse', record.name);
}


//绑定到子表
function bindSelectedDataToSubDetail(detailData) {
    var detailDg = $('#detailDg');
    //detailDg.datagrid('loadData', { total: 0, rows: [] });
    bindDetailData(detailData);
}

//绑定表体数据
function bindDetailData(data) {
    var dgLst = $('#detailDg');
    var viewModel = new Array();
    for (var i in data) {
        var dataItem = data[i];

        var row_data = {
            product_sku_code: dataItem.goods.product_sku_code,
            title: dataItem.goods.title,
            sales_catelog: dataItem.goods.sales_catelogs,
            bar_code: dataItem.goods.product_sku.bar_code,
            batch_code: dataItem.batch_code,
            specifications: dataItem.goods.product_sku.product_specifications,
            base_unit: dataItem.goods.product_sku.product_spu.base_unit,
            quantity_should: dataItem.quantity_should,
            quantity_fact: dataItem.quantity_fact == null ? 0 : dataItem.quantity_fact,
            quantity_reject: dataItem.quantity_reject == null ? 0 : dataItem.quantity_reject,
            supply_price: (dataItem.supply_price.price_including_tax == undefined) ? 0.00 : dataItem.supply_price.price_including_tax.currency.money,
            retail_price: (dataItem.retail_price.price_including_tax == undefined) ? 0.00 : dataItem.retail_price.price_including_tax.currency.money,
            commission: (dataItem.commission.commission_value == undefined) ? 0.00 : dataItem.commission.commission_value.currency.money,
            brand: dataItem.goods.product_sku.product_spu.brand.name,
            manufacturer: dataItem.goods.product_sku.product_spu.brand.manufacturer.name,
            obj: dataItem
        };
        viewModel.push(row_data);
        //dgLst.datagrid('appendRow', row_data);
    }

    dgLst.datagrid({loadFilter: pagerFilter}).datagrid('loadData', viewModel);
}

//规格字段格式化
function formatSpecificationCol(specArray) {
    //计算规格字符串
    var specifications = '';
    for (var specIdx in specArray) {
        var specItem = specArray[specIdx];
        if (specIdx == 0)
            specifications = specItem.specification_name + ':' + specItem.specification_value;
        else
            specifications += ',' + specItem.specification_name + ':' + specItem.specification_value;
    }
    return "<span title='" + specifications + "'>" + specifications + "</span>";
}

//detail数据前台分页
function pagerFilter(data) {
    if (typeof data.length == 'number' && typeof data.splice == 'function') {    // 判断数据是否是数组
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
        onSelectPage: function (pageNum, pageSize) {
            opts.pageNumber = pageNum;
            opts.pageSize = pageSize;
            pager.pagination('refresh', {
                pageNumber: pageNum,
                pageSize: pageSize
            });

            //bindDetailData(data);
            dg.datagrid('loadData', data);
        }
    });
    if (!data.originalRows) {
        data.originalRows = (data.rows);
    }
    var start = (opts.pageNumber - 1) * parseInt(opts.pageSize);
    var end = start + parseInt(opts.pageSize);
    data.rows = (data.originalRows.slice(start, end));
    data.footer = [
        buildSubTotalRow(data.rows)
    ];
    return data;
}

//构建“合计”行
function buildSubTotalRow(data) {
    var subTotal = {
        product_sku_code: '<span class="subtotal">合计</span>',
        quantity_should: '<span class="subtotal">' + compute(data, "quantity_should") + '</span>',
        quantity_fact: '<span class="subtotal">' + compute(data, "quantity_fact") + '</span>',
        quantity_reject: '<span class="subtotal">' + compute(data, "quantity_reject") + '</span>',
        title: '',
        sales_catelog: '',
        bar_code: '',
        batch_code: '',
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
function refreshSubTotalRows() {
    //计算合计列
    var footerRows = $('#detailDg').datagrid('getFooterRows');
    var rows = $("#detailDg").datagrid("getRows"); //获取当前页的所有行。
    footerRows[0]['quantity_should'] = '<span class="subtotal">' + computeForRows(rows, "quantity_should") + '</span>';
    footerRows[0]['quantity_fact'] = '<span class="subtotal">' + computeForRows(rows, "quantity_fact") + '</span>';
    footerRows[0]['quantity_reject'] = '<span class="subtotal">' + computeForRows(rows, "quantity_reject") + '</span>';
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
function compareDatetime(a, b) {
    var oDate1 = new Date(a);
    var oDate2 = new Date(b);
    if (oDate1.getTime() > oDate2.getTime()) {
        return 1;
        //alert('第一个大');
    } else if (oDate1.getTime() < oDate2.getTime()) {
        return -1;
        //alert('第二个大');
    } else {
        return 0;
        //alert('相等');
    }
}

function compareDigit(a, b) {
    if (a == b)
        return 0;
    return (a > b ? 1 : -1);
}