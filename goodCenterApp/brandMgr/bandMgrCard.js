// 全局变量
var loading;
var grid;
var mainGrid;
var dlg_Edit;
var dlg_Edit_form;
var virpath = ""; //网站的虚拟目录 如：/ShopManager
var permissions;
var addPermissionName = 'City_Add'.toLowerCase();
var editPermissionName = 'City_Edit'.toLowerCase();
var delPermissionName = 'City_Delete'.toLowerCase();
var savePermissionName = 'City_Save'.toLowerCase();
var exportPermissionName = 'City_PrintandExport'.toLowerCase();
var curRowData;
var lastIndex;

$(function () {

	dlg_Edit = $('#Dlg-Edit').dialog({
		closed: true,
		modal: true,
		toolbar: [{
			text: '保存',
			iconCls: 'icon-save',
			handler: saveData
		}, '-', {
			text: '关闭',
			iconCls: 'icon-no',
			handler: function () {
				dlg_Edit.dialog('close');
			}
		}],
		onBeforeLoad: function (param) {
			//var password = $("#ConcreteDType").attr("value");
		}
	}).dialog('center');
	dlg_Edit_form = dlg_Edit.find('form');

	$.ajax({
		url: virpath + '/admin/GetPermissionsForCurrentUser/?permissionKey=City',
		type: 'post',
		datatype: 'application/json; charset=utf-8',
		error: function (result) {
		},
		success: function (result) {
			permissions = result;
			grid = $('#grid').treegrid({
				rownumbers: true,
				fit: true,
				title: '城市列表',
				pagination: false,
				//pageSize: 20,
				fitColumns: true,
				singleSelect: true,
				striped: true,
				idField: "CityId",
				treeField: 'Name',
				//sortName: 'Sort',
				//sortOrder: 'asc',
				//queryParams: { filter: ''},
				datatype: 'application/json; charset=utf-8',
				method: 'get',
				toolbar: [{
					text: '新增',
					iconCls: 'icon-add',
					handler: add,
					id: 'btnAdd',
					disable: true
				}, '-', {
					text: '编辑',
					iconCls: 'icon-edit',
					handler: edit,
					id: 'btnEdit',
					disable: true
				}, '-', {
					text: '删除',
					iconCls: 'icon-remove',
					handler: del,
					id: 'btnDel',
					disable: true
				}, '-', {
					text: '刷新',
					iconCls: 'icon-search   ',
					handler: reload
				}, '-'],
				columns: [[
					{
						field: 'Sort', title: '排序', width: 100, sortable: true

					}
					, {
						field: 'Name', title: '名称', width: 100, sortable: true

					}
					, {
						field: 'Province', title: '所属省份', width: 100, sortable: false

					}
					, {
						field: 'Pingyin', title: '拼音', width: 100, sortable: true

					}
					, {
						field: 'Jiangpin', title: '简拼', width: 100, sortable: true

					}

				]]
				,
				onClickRow: function (row) {//运用单击事件实现一行的编辑结束，在该事件触发前会先执行onAfterEdit事件
					var rowIndex = row.CityId;
					if (lastIndex != rowIndex) {
						grid.treegrid('endEdit', lastIndex);
					}
				},
				onDblClickRow: function (row) { //双击事件
					if (row == undefined) return;
					var rowIndex = row.CityId;

					if (lastIndex != rowIndex) {
						grid.treegrid('endEdit', lastIndex);
					}
					var disabled = $('#btnEdit').linkbutton('options').disabled;
					if (disabled || row.Predefined) {
						grid.treegrid('cancelEdit', rowIndex);
					} else {
						grid.treegrid('beginEdit', rowIndex);
					}

					lastIndex = rowIndex;
				},
				onAfterEdit: function (row, changes) {
					if (row.Predefined) return;
					var rowId = row.CityId;
					$.ajax({
						url: virpath + '/api/City/Put/' + rowId,
						data: row,
						type: 'put',
						datatype: 'application/json; charset=utf-8',
						success: function (content) {
							//result为请求处理后的返回值
							var data = getObjectFrom(content);
							if (data.success) {
								Msgfade('操作成功'); //提示消息
								grid.treegrid('reload');

							} else {
								Msgalert('错误', data.msg, 'error');
							}
						}
					});
				},
				onBeforeLoad: function (param) {
					setButtonPermissions(permissions);
				},
				onHeaderContextMenu: function (e, field) {
					e.preventDefault();
					if (!$('#tmenu').length) {
						createColumnMenu();
					}
					$('#tmenu').menu('show', {
						left: e.pageX,
						top: e.pageY
					});
				},
				onContextMenu: function (e, rowData) {
					e.preventDefault();
					curRowData = rowData;
					if (!$('#rmenu').length) {
						createRowContextMenu();
					}
					$('#rmenu').menu('show', {
						left: e.pageX,
						top: e.pageY
					});
				},
				onLoadSuccess: function (data) { //当数据加载成功时触发

				},
				onLoadError: function (arguments) {
					$.messager.alert('提示', '由于网络或服务器太忙，加载失败，请重试！', 'error');
				}
			});
			mainGrid = $('#gridleft').datagrid({
				title: '省份',
				iconCls: 'icon-save',
				method: 'get',
				url: '/api/Province/Get',
				queryParams: { filter: '' },
				datatype: 'application/json; charset=utf-8',
				idField: 'ProvinceId',
				sortName: 'ProvinceId',
				//sortOrder: 'desc',
				sortOrder: 'asc',
				pageSize: 30,
				striped: true,
				columns: [[
					{
						field: 'Sort', title: '排序', width: 100, sortable: true

					}
					, {
						field: 'Name', title: '名称', width: 100, sortable: true

					}
					, {
						field: 'Pingyin', title: '拼音', width: 100, sortable: true

					}
					, {
						field: 'Jiangpin', title: '简拼', width: 100, sortable: true

					}
				]],
				fit: true,
				pagination: true,
				rownumbers: true,
				fitColumns: true,
				singleSelect: true,
				onSelect: function (rowIndex, rowData) {
					showAll(rowData.ProvinceId);
				},
				onLoadSuccess: function (data) {
					if (data.total > 0)
						$('#gridleft').datagrid('selectRow', 0);
				},
				onLoadError: function () {
					$.messager.alert('提示', '由于网络或服务器太忙，加载失败，请重试！', 'error');
				},
				onBeforeLoad: function (param) {

				}
			});

		}
	});
});

function createColumnMenu() {
	var tmenu = $('<div id="tmenu" style="width:100px;"></div>').appendTo('body');
	var fields = grid.datagrid('getColumnFields');
	for (var i = 0; i < fields.length; i++) {
		$('<div iconCls="icon-ok"/>').html(fields[i]).appendTo(tmenu);
	}
	tmenu.menu({
		onClick: function (item) {
			if (item.iconCls == 'icon-ok') {
				grid.datagrid('hideColumn', item.text);
				tmenu.menu('setIcon', {
					target: item.target,
					iconCls: 'icon-empty'
				});
			} else {
				grid.datagrid('showColumn', item.text);
				tmenu.menu('setIcon', {
					target: item.target,
					iconCls: 'icon-ok'
				});
			}
		}
	});
}
function getSelectedKey() {
	var rows = grid.datagrid('getSelections');
	if (rows.length == 0) return '';
	return rows[0].UserName;
}

function getSelectedArr() {
	var ids = [];
	var rows = grid.treegrid('getSelections');
	for (var i = 0; i < rows.length; i++) {
		ids.push(rows[i].CityId);
	}
	return ids;
}
function getSelectedID() {
	var ids = getSelectedArr();
	return ids.join(',');
}
function arr2str(arr) {
	return arr.join(',');
}

function add() {
	var rows = mainGrid.datagrid('getSelections');
	if (rows.length == 0) return;
	dlg_Edit.dialog('open').dialog('setTitle', '添加');
	dlg_Edit_form.form('clear');
	$("#ProvinceId").val(rows[0].ProvinceId);
	var parentRows = grid.datagrid('getSelections');
	if (parentRows.length > 0) {
		$("#ProvinceId").val(parentRows[0].CityId);
	}

	dlg_Edit_form.url = virpath + '/api/City/Post';
	dlg_Edit_form.method = 'post';
}

function edit() {
	var rows = grid.datagrid('getSelections');
	var num = rows.length;
	if (num == 0) {
		Msgshow('请选择一条记录进行操作!');
		return;
	}
	else if (num > 1) {
		$.messager.alert('提示', '您选择了多条记录,只能选择一条记录进行修改!', 'info');
		return;
	}
	else if (rows[0].Predefined) {
		$.messager.alert('提示', '预定义类型不允许修改!', 'info');
		return;
	}
	else {
		dlg_Edit.dialog('open').dialog('setTitle', '修改:' + rows[0].Name);
		dlg_Edit_form.form('reset');
		dlg_Edit_form.form('load', rows[0]); //加载到表单的控件上
		dlg_Edit_form.method = 'put';
		dlg_Edit_form.url = virpath + '/api/City/Put/' + rows[0].CityId;
	}
}

function del() {
	//var arr = getSelectedKey();
	var arr = getSelectedArr();
	//if (arr!='') {
	if (arr.length > 0) {
		var rows = grid.datagrid('getSelections');
		var num = rows.length;
		if (num == 0) {
			Msgshow('请选择一条记录进行操作!');
			return;
		}
		else if (rows[0].Predefined) {
			$.messager.alert('提示', '预定义类型不允许删除!', 'info');
			return;
		}

		$.messager.confirm('提示', '您确认要删除选中的记录吗?', function (data) {
			if (data) {
				$.ajax({
					//url: virpath + '/api/Categories/' + arr,
					url: virpath + '/api/City/Delete/' + arr2str(arr),
					type: 'delete',
					datatype: 'application/json; charset=utf-8',
					error: function (result) {
						Msgalert('错误', '由于网络或服务器太忙，提交失败，请重试！', 'error');
						grid.datagrid('clearSelections');
					},
					success: function (content) {
						//content为请求处理后的返回值
						var result = getObjectFrom(content);
						if (result.success) {
							Msgfade('操作成功'); //提示消息
							grid.treegrid('reload');
							grid.datagrid('clearSelections');
						} else {
							Msgalert('错误', result.msg, 'error');
						}
					}
				});
			}
		});
	} else {
		Msgshow('请先选择要删除的记录。');
	}
}
function saveData() {
	dlg_Edit_form.form('submit', {
		url: dlg_Edit_form.url,
		onSubmit: function () {
			return $(this).form('validate');
		},
		//success:function(data) {alert(data)}
		success: function (content) {
			//content为请求处理后的返回值
			var result = getObjectFrom(content);
			if (result.success) {
				Msgfade('操作成功'); //提示消息
				grid.treegrid('reload');
				dlg_Edit.dialog('close');
			} else {
				Msgalert('错误', result.msg, 'error');
			}
		}
	});
}

function reload() {
	grid.treegrid('reload');
}
function showAll(ProvinceId) {
	grid.treegrid({ url: '/Api/City/Gett?ProvinceId=' + escape(ProvinceId) });
}
function getSelectedProvinceId() {
	var provinceId = '';
	var rows = $('#gridleft').datagrid('getSelections');
	if (rows.length > 0) {
		provinceId = rows[0].ProvinceId;
	}
	return provinceId;
}
function exportData() {
	var filter = getSelectedProvinceId();
	if (filter == '') return;
	window.blank = true;
	window.location = virpath + '/Api/City/GetExport/?provinceId=' + escape(filter) + '&recordCount=1000';
}