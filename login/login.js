
function init(){
	var pwd = localStorage.getItem("pwd");
	if (pwd != undefined && pwd != null) {
		if(pwd != "") {
			var userName = localStorage.getItem("user_name");
			if (userName != undefined && userName != null) {
				$('#txtUser').val(userName);
			}
			$('#txtPwd').val(window.atob(pwd));
		}
	}
}

function authenticateSubmit() {
	var userName = $('#txtUser').val();
	var pwd = $('#txtPwd').val();

	var remember = $('#ckRemember').prop('checked');

	var oldUserName = localStorage.getItem("user_name");
	if (oldUserName != undefined && oldUserName != null) {
		if(oldUserName != userName){
			removeUserContext();
		}
	}

	var userIdentity = {
		user_name: userName,
		password: pwd
	};
	var userIdentityData = JSON.stringify(userIdentity);



	//定义查询条件
	$.ajax({
		method : 'POST',
		url : $apiRoot + "otocloud-auth/user-management/authenticate",
		async : true,
		data: userIdentityData,
		dataType : 'json',
		beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
		success : function(data) {
			if(data.errCode != undefined && data.errCode != null){
				alert_autoClose('提示', '保存失败，错误码：' + data.errCode + '，原因：' + data.errMsg);
				return;
			}
			if(data.accts != null && data.accts.length > 0){
				if(remember){
					localStorage.setItem("pwd",  window.btoa(pwd));
				}else{
					localStorage.removeItem("pwd");
				}
				storeUserContext(data);
				document.location.href = '../home.html'
			}else{
				alert_autoClose("提示：","没有关联企业租户.")
			}
		},
		error: function (x, e) {
			alert(e.toString(), 0, "友好提醒");
		}
	});
}

function storeUserContext(data){
	localStorage.setItem("user_id",  data.user_id);
	localStorage.setItem("user_name",  data.user_name);
	localStorage.setItem("access_token", data.access_token);

	if(data.accts.length == 1){
		localStorage.setItem("default_acct", JSON.stringify(data.accts[0]));
	}else if(data.accts.length > 1) {
		var acctInfo = JSON.stringify(data.accts);
		localStorage.setItem("accts", acctInfo);
	}
}

function removeUserContext(){
	localStorage.removeItem("user_id");
	localStorage.removeItem("user_name");
	localStorage.removeItem("access_token");

	var defaultAcctInfo = localStorage.getItem("default_acct");
	if (defaultAcctInfo != undefined) {
		localStorage.removeItem("default_acct");
	}

	var acctInfo = localStorage.getItem("accts");
	if (acctInfo != undefined) {
		localStorage.removeItem("accts");
	}
}




