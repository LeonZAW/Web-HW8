
var app = angular.module("spApp",["ngMaterial","angular-svg-round-progressbar"]);


app.controller("spController",["$scope","$http","$location","$q",function($scope,$http,$location,$q){
    $scope.clearAll = function(){
        $scope.form={
            "keyword":"",
            "category":"0",
            "checkbox_new" : false,
            "checkbox_used" : false,
            "checkbox_unsp" : false,
            "checkbox_local" : false,
            "checkbox_free" : false,
            "nearby" : false,
            "mile":"",
            "location":"here",
            "zip_radio_check":true,
            "zip":"",
        }
        $scope.zip_errmsg="";
        $scope.keyword_errmsg="";
        $scope.savedSearchDetail = null;
        $scope.savedWishDetail = null;
        $scope.result_list = [];
        $scope.search_result_err = true;
        $scope.show_result_list = [];
        $scope.progressBar=false;
        $scope.detail_list=null;
        $scope.search_detail_err = true;
        $scope.detail_shipping_info = null;
        $scope.detail_seller_info = null;
        $scope.similar_list=[];
        $scope.picture_list=[];
        $scope.show_result = true;
        $scope.progressBarDetail=false;
        $scope.progressBarWishDetail=false;
        $scope.showProduct = true;
        $scope.showWish = true;
        var auto = angular.element(document.getElementById("auto-complete-zip"));
        auto.removeClass("is-invalid");
    }
    $scope.clearAll();
    //--------------local storage-------------
    $scope.localSet = function(item){
        localStorage.setItem("wishlist", JSON.stringify(item));
    }
    $scope.localGet = function(){
        return JSON.parse(localStorage.getItem("wishlist"));
    }
    $scope.inWishList = function(result){
        for(var i=0;i<$scope.wish_list.length;i++){
            if($scope.wish_list[i].itemId === result.itemId)
                return true;
        }
        return false;
    }
    $scope.addWishList = function(result){
        $scope.wish_list.push(result);
        $scope.localSet($scope.wish_list);
        $scope.countTotal();
    }
    $scope.loadWishList = function(){
        var storage = $scope.localGet()
        if(storage==null)
            $scope.wish_list = [];
        else
            $scope.wish_list = storage;
        $scope.countTotal();
    }
    $scope.removeWishList = function(result){
        $scope.wish_list = $scope.wish_list.filter(function(value) { 
            return value.itemId !== result.itemId
        });
        $scope.localSet($scope.wish_list);
        $scope.countTotal();
    }
    $scope.countTotal = function(){
        $scope.totalShoppingFee = 0.0;
        for(var i=0;i<$scope.wish_list.length;i++){
            var value = $scope.wish_list[i]["totalValue"];
            $scope.totalShoppingFee += parseFloat(value);
        }
        $scope.totalShoppingFee = $scope.totalShoppingFee.toFixed(2)*100/100;
    }
    $scope.loadWishList();
    //--------------ipapi-----------------------
    $scope.local_ip = "";
    var ip_url = "http://ip-api.com/json";
    $http.get(ip_url)
    .then(function success(response) {
        $scope.local_ip = response.data.zip;
    });
    
    
    //--------------form-----------------------
    
    $scope.check_keyword_change = function(){
        var test_keyword = $scope.form.keyword.trim();
        if(test_keyword.length > 0)
            $scope.keyword_errmsg="";
    }
    $scope.check_keyword_ok = function(){
        var test_keyword = $scope.form.keyword.trim();
        if(!test_keyword.length > 0)
            $scope.keyword_errmsg="Please enter a keyword.";
    }
    
    $scope.autoclick = function(){
        if($scope.form.location=="here"){
            var auto = angular.element(document.getElementById("auto-complete-zip"));
            auto.blur();
        }
    }
    $scope.autoSearch = function(text) {
        // console.log("autoSearch");
        $scope.check_zip_ok();
        var url = "/auto_complete?start="+text;
        var deferred = $q.defer();
        $http.get(url)
        .then(function success(response) {
            deferred.resolve(response.data);
        });
        // deferred.promise.then(function(data){
        //     console.log(data);
        // })
        return deferred.promise;
    }
    $scope.close_zip_required = function() {
        $scope.form.zip="";
        var auto = angular.element(document.getElementById("auto-complete-zip"));
        auto.removeClass("is-invalid");
        $scope.zip_errmsg="";
    }
    $scope.check_zip_ok = function(){
        if($scope.form.location=="here")
            return;
        var test_zip = $scope.form.zip.trim();
        if(test_zip.length > 0){
            $scope.zip_errmsg="";
            var auto = angular.element(document.getElementById("auto-complete-zip"));
            auto.removeClass("is-invalid");
        }
        else{
            $scope.zip_errmsg="Please enter a zip code.";
            var auto = angular.element(document.getElementById("auto-complete-zip"));
            auto.addClass("is-invalid");
        }
    }
    $scope.check_zip_required = function(){
    }
    $scope.zip_onclick = function(){
        var input = angular.element("#zip");
        input.blur();
    }
    //--------------------submitForm---------------------
    $scope.test_validity = function(){
        var test_local_ip = /^\d{5}$/.test($scope.local_ip);
        var test_keyword = $scope.form.keyword.trim().length > 0;
        var test_input_postcode = ($scope.form.location=="here")||/^\d{5}$/.test($scope.form.zip);
        var test_mile_int = ($scope.form.mile==="")||($scope.form.mile===null)||/^[1-9]\d*$/.test($scope.form.mile);
        
        if(test_local_ip&&test_keyword&&test_input_postcode&&test_mile_int)
            return true;
        return false;
    }
    $scope.submitForm = function(e){
        e.preventDefault();
    }
    $scope.searchList = function(){
        $scope.progressBar = true;
        $scope.search_result_err = true;
        $scope.result_list = [];
        var params = new URLSearchParams($scope.form);
        var url = "/search_list?";
        params.append("local_ip",$scope.local_ip);
        if (!$scope.form.mile||$scope.form.mile=="")
            params.set("mile","10");
        url += params.toString();
        // console.log(url);
        $http.get(url)
        .then(function success(response) {
            $scope.progressBar=false;
            var isDataOk = response.data[0];
            if(isDataOk){
                $scope.result_list = response.data[1];
                $scope.setPage(0);
            }else{
                $scope.result_list = [];
                $scope.search_result_err = isDataOk;
                $scope.search_result_err_msg = response.data[1];
            }
        });
    }
    $scope.go_searchList = function(){
        $scope.show_result = true;
        $scope.FromDetailLeftToProduct();
        $scope.searchList();
    }
    //------------------itemDetails------------------------------
    $scope.go_detail = function(result){
        $scope.saveDetail(result);
        $scope.FromProductLeftToDetail();
        $scope.loadDetail(result);
    }
    $scope.go_wishdetail = function(result){
        $scope.saveWishDetail(result);
        $scope.FromWishLeftToDetail();
        $scope.loadDetail(result);
    }
    $scope.go_saved_detail = function(){
        var result = $scope.savedSearchDetail;
        $scope.FromProductRightToDetail();
        $scope.loadDetail(result);
    }
    $scope.go_saved_detail_wish = function(){
        var result = $scope.savedWishDetail;
        $scope.FromWishRightToDetail();
        $scope.loadDetail(result);
    }

    $scope.loadDetail = function(result){
        // .itemId,result.shippingInfo,result.sellerinfo
        // itemId,shippinginfo,sellerinfo
        var itemId = result.itemId;
        var shippinginfo = result.shippingInfo;
        var sellerinfo = result.sellerinfo
        $scope.progressBarDetail = true;
        $scope.progressBarWishDetail = true;
        $scope.search_detail_err = true;
        $scope.detail_list=null;
        $scope.detail_shipping_info = null;
        $scope.detail_seller_info = null;
        $scope.similar_list=[];
        $scope.picture_list=[];
        var url = "/item_detail?itemId="+itemId;
        $http.get(url)
        .then(function success(response) {
            $scope.progressBarDetail=false;
            $scope.progressBarWishDetail=false;
            var isDataOk = response.data[0];
            if(isDataOk){
                //---------detail---------
                $scope.detail_list = response.data[1];
                var div_carousel = angular.element(document.getElementById("div-carousel"));
                var div_carousel_wish = angular.element(document.getElementById("div-carousel-wish"));
                var nav_detail0 = angular.element(document.getElementById("nav-tab-0"));
                var nav_detail1 = angular.element(document.getElementById("nav-tab-1"));
                div_carousel.carousel("pause");
                div_carousel_wish.carousel("pause");
                nav_detail0.tab("show");
                nav_detail1.tab("show");
                //---------pictures-------
                $scope.get_picture($scope.detail_list.title);
                //---------shipping-------
                $scope.detail_shipping_info=shippinginfo;
                $scope.detail_shipping_info["policy_accepted"]=$scope.detail_list.policy_accepted;
                //---------seller---------
                $scope.detail_seller_info=sellerinfo;
                $scope.setStarCss();
                //---------similar----------
                $scope.get_similar(itemId);
            }else{
                $scope.search_detail_err = isDataOk;
                $scope.search_detail_err_msg = response.data[1];
            }
        });
        
    }

    $scope.go_list = function(){
        $scope.FromDetailLeftToProduct();
        if($scope.test_validity()){
            $scope.searchList();
        }
        // else{
        //     console.log("should do something in go_list")
        // }
    }

    $scope.go_list_wish = function(){
        $scope.FromDetailLeftToWish();
    }

    $scope.lll = function(){
    }

    $scope.rrr = function(){
    }

    $scope.open_picture = function(website){
        window.open(website);
    }
    $scope.carousel_prev = function(){
        var div_carousel = angular.element(document.getElementById("div-carousel"));
        div_carousel.carousel("prev");
        div_carousel.carousel("pause");
    }
    $scope.carousel_next = function(){
        var div_carousel = angular.element(document.getElementById("div-carousel"));
        div_carousel.carousel("next");
        div_carousel.carousel("pause");
    }
    $scope.carousel_prev_wish = function(){
        var div_carousel_wish = angular.element(document.getElementById("div-carousel-wish"));
        div_carousel_wish.carousel("prev");
        div_carousel_wish.carousel("pause");
    }
    $scope.carousel_next_wish = function(){
        var div_carousel_wish = angular.element(document.getElementById("div-carousel-wish"));
        div_carousel_wish.carousel("next");
        div_carousel_wish.carousel("pause");
    }
    $scope.setStarCss = function(){
        var cssinfo = $scope.detail_seller_info.star;
        cssinfo = cssinfo.toLowerCase();
        var small = !cssinfo.endsWith("shooting");
        var color = cssinfo.replace("shooting","");
        if(color=="none")
            color = "white";
        $scope.detail_seller_info["small"] = small;
        $scope.detail_seller_info["color"] = "{\"color\":\""+color+"\"}";
    }
    $scope.get_similar = function(itemId){
        $scope.sort_type="null";
        $scope.sort_order="false";
        $scope.sort_reverse=false;
        var url = "/similar_item?itemId="+itemId;
        $http.get(url)
        .then(function success(response) {
            if(response.data[0]){
                $scope.similar_list = response.data[1];
                $scope.has_showmoretab = $scope.similar_list.length>5;
                $scope.similarShowLess();
            }else{
                $scope.similar_list = [];
            }
        });
    }
    $scope.setOrder = function(){
        // console.log($scope.sort_order);
        $scope.sort_reverse=($scope.sort_order=="true");
        // console.log($scope.sort_reverse);
    }
    $scope.testNullOrder = function(){
        $scope.sort_reverse=($scope.sort_type=="null")?false:($scope.sort_order=="true");
    }
    $scope.get_picture = function(title){
        var url = "/gl_picture?key="+encodeURIComponent(title);
        $http.get(url)
        .then(function success(response) {
            if(response.data[0]){
                $scope.picture_list = response.data[1];
                // console.log($scope.picture_list);
            }
        });
    }
    $scope.setPage = function(pageNumber){
        var itemslength = $scope.result_list.length;
        $scope.currentPage = pageNumber;
        $scope.show_result_list = $scope.result_list.slice(pageNumber*10,Math.min((pageNumber+1)*10,itemslength));
    }

    
    $scope.getPageNumber = function(){
        $scope.pageMax = Math.ceil($scope.result_list.length*1.0/10);
        return new Array($scope.pageMax);
    }
    
    $scope.changeDetailShow = function(tab){
        $scope.testshow = tab;
    }
    $scope.similarShowMore = function(){
        $scope.showmore_button=false;
        $scope.similar_showlength = $scope.similar_list.length;
    }
    $scope.similarShowLess = function(){
        $scope.showmore_button=true;
        $scope.similar_showlength = Math.min(5,$scope.similar_list.length);
    }

    $scope.addLeft = function(){
        var anime_0 = angular.element(document.getElementById("div-anime-0"));
        var anime_1 = angular.element(document.getElementById("div-anime-1"));
        anime_0.addClass("left").removeClass("right");
        anime_1.addClass("left").removeClass("right");
    }

    $scope.addRight = function(){
        var anime_0 = angular.element(document.getElementById("div-anime-0"));
        var anime_1 = angular.element(document.getElementById("div-anime-1"));
        anime_0.addClass("right").removeClass("left");
        anime_1.addClass("right").removeClass("left");
    }

    $scope.addLeftWish = function(){
        var anime_2 = angular.element(document.getElementById("div-anime-2"));
        var anime_3 = angular.element(document.getElementById("div-anime-3"));
        anime_2.addClass("left").removeClass("right");
        anime_3.addClass("left").removeClass("right");
    }

    $scope.addRightWish = function(){
        var anime_2 = angular.element(document.getElementById("div-anime-2"));
        var anime_3 = angular.element(document.getElementById("div-anime-3"));
        anime_2.addClass("right").removeClass("left");
        anime_3.addClass("right").removeClass("left");
    }

    $scope.FromProductLeftToDetail = function(){
        $scope.addLeft();
        $scope.showProduct = false;
    }
    $scope.FromDetailLeftToProduct = function(){
        $scope.addLeft();
        $scope.showProduct = true;
    }
    $scope.FromProductRightToDetail = function(){
        $scope.addRight();
        $scope.showProduct = false;
    }

    $scope.FromWishLeftToDetail = function(){
        $scope.addLeftWish();
        $scope.showWish = false;
    }
    $scope.FromDetailLeftToWish = function(){
        $scope.addLeftWish();
        $scope.showWish = true;
    }
    $scope.FromWishRightToDetail = function(){
        $scope.addRightWish();
        $scope.showWish = false;
    }
    $scope.saveDetail = function(result){
        $scope.savedSearchDetail = result;
    }
    $scope.testResultHighlight = function(itemId){
        if($scope.savedSearchDetail==null)
            return false;
        return (itemId==$scope.savedSearchDetail.itemId);
    }
    $scope.saveWishDetail = function(result){
        $scope.savedWishDetail = result;
    }
    $scope.testWishHighlight = function(itemId){
        if($scope.savedWishDetail==null)
            return false;
        return (itemId==$scope.savedWishDetail.itemId);
    }
    
    
    $scope.toggerShowResultWish = function(){
        $scope.show_result = !$scope.show_result;
        $scope.go_list();
        $scope.go_list_wish();
    }

}]);

