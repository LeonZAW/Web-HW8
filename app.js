const request = require("request")
const express = require("express");
const app = express();
const port = process.env.PORT || 1337;
//for security
const APPID = "";
const geo_username = "";
const fb_app_id = "";
const gl_search_engine_id = "";
const gl_ak = "";

app.use(express.static("public"))

app.get("/auto_complete",(req,res)=>{
    var url = buildAutoCompleteUrl(req.query);
    // console.log(url);
    request(url, (error, response, body)=>{
        try {
            var data = JSON.parse(body);
            var adata = assembleAutoCompleteResult(data);
            res.send(adata);
        } catch (err) {
            var error_data = [];
            res.send(error_data);
        }
    })
});

app.get("/search_list",(req,res)=>{
    // console.log(req.query);
    var url = buildSearchUrl(req.query);
    // console.log(url);
    request(url, (error, response, body)=>{
        try {
            var data = JSON.parse(body);
            var adata = assembleSearchResult(data);
            res.send(adata);
        } catch (err) {
            var error_data = [false,"Products unavailable."];
            res.send(error_data);
        }
    })
});

app.get("/item_detail",(req,res)=>{
    var url = buildDetailUrl(req.query);
    // console.log(url);
    request(url, (error, response, body)=>{
        try {
            var data = JSON.parse(body);
            var adata = assembleDetailResult(data);
            res.send(adata);
        } catch (err) {
            var error_data = [false,"Details unavailable."];
            res.send(error_data);
        }
    })
});

app.get("/similar_item",(req,res)=>{
    var url = buildSimilarUrl(req.query);
    // console.log(url);
    request(url, (error, response, body)=>{
        try {
            var data = JSON.parse(body);
            var adata = assembleSimilarResult(data);
            res.send(adata);
        } catch (err) {
            var error_data = [false,"Similar Products unavailable."];
            res.send(error_data);
        }
    })
});

app.get("/gl_picture",(req,res)=>{
    var url = buildPictureUrl(req.query);
    // console.log(url);
    request(url, (error, response, body)=>{
        try {
            var data = JSON.parse(body);
            var adata = assemblePictureResult(data);
            res.send(adata);
        } catch (err) {
            var error_data = [false,"Pictures unavailable."];
            res.send(error_data);
        }
    })
});

app.get("/", (req, res) => res.sendFile("public/search.html", { root: __dirname }));
app.get("/searchProducts", (req, res) => res.sendFile("public/search.html", { root: __dirname }));
app.listen(port);

function buildSearchUrl(query){
    var url_base = "http://svcs.ebay.com/services/search/FindingService/v1";
    var operation = "findItemsAdvanced";
    var request_number = 50;
    var url=url_base+"?OPERATION-NAME="+operation+"&SERVICE-VERSION=1.0.0&SECURITY-APPNAME="+APPID+"&REST-PAYLOAD&RESPONSE-DATA-FORMAT=JSON&paginationInput.entriesPerPage="+request_number;
    url += "&"+new URLSearchParams({"keywords":query.keyword}).toString();
    if (query.category!="0"){
        url += "&categoryId="+ query.category;
    }
    var zip = query.location=="here"?query.local_ip:query.zip;
    var item_filter_index = 0;

    url += "&buyerPostalCode="+zip;
    url += "&itemFilter("+item_filter_index+").name=MaxDistance&itemFilter("+item_filter_index+").value="+query.mile;
    item_filter_index++;

    url += "&itemFilter("+item_filter_index+").name=HideDuplicateItems&itemFilter("+item_filter_index+").value=true";
    item_filter_index++;

    var condition = []
    if(query.checkbox_new=="true")  condition.push("New")
    if(query.checkbox_used=="true")  condition.push("Used")
    if(query.checkbox_unsp=="true")  condition.push("Unspecified")
    if(condition.length!=0){
        url += "&itemFilter("+item_filter_index+").name=Condition";
        for (var item_value_index = 0; item_value_index < condition.length; item_value_index++) {
            url += "&itemFilter("+item_filter_index+").value("+item_value_index+")="+condition[item_value_index];
        }
        item_filter_index++;
    }

    if(query.checkbox_free=="true"){
        url += "&itemFilter("+item_filter_index+").name=FreeShippingOnly";
        url += "&itemFilter("+item_filter_index+").value=true";
        item_filter_index++;
    }
    if(query.checkbox_local=="true"){
        url += "&itemFilter("+item_filter_index+").name=LocalPickupOnly";
        url += "&itemFilter("+item_filter_index+").value=true";
        item_filter_index++;
    }

    url += "&outputSelector(0)=SellerInfo&outputSelector(1)=StoreInfo";
    return url;
}

function assembleSearchResult(result){
    var requestResult = [];
    var ackResult = result["findItemsAdvancedResponse"][0]["ack"][0];
    if(ackResult=="Failure"){
        var errmsg = result["findItemsAdvancedResponse"][0]["errorMessage"][0]["error"][0]["message"][0];
        requestResult = [false,errmsg];
        return requestResult;
    }
    var searchResult = result["findItemsAdvancedResponse"][0]["searchResult"][0];
    var count = searchResult["@count"];
    if(count==0){
        var errmsg = "No Records.";
        requestResult = [false,errmsg];
        return requestResult;
    }
    var items = searchResult["item"];
    var return_items = []
    for(var i=0;i<count;i++){
        var return_item = getItemByIndex(items, i);
        return_items.push(return_item);
    }
    requestResult = [true,return_items];
    return requestResult;
}

function getItemByIndex(items, index){
    var item = items[index];
    var item_itemId = item["itemId"][0];
    var item_title = item["title"][0];
    var shorten_title = getShortenTitle(item_title);
    var item_viewItemURL = item["viewItemURL"][0];
    
    
    var item_sellingStatus = item["sellingStatus"][0]["currentPrice"][0];
    var sellerInfo = item["sellerInfo"][0];
    var seller = sellerInfo["sellerUserName"][0];
    // var item_currencyId = item_sellingStatus["@currencyId"];
    var item_value = item_sellingStatus["__value__"];
    
    var return_item = {};
    return_item["itemId"] = item_itemId;
    return_item["title"] = item_title;
    return_item["shorten_title"] = shorten_title;
    return_item["seller"] = seller;
    return_item["viewItemURL"] = item_viewItemURL;
    return_item["value"] = "$"+item_value;
    return_item["index"] = index+1;

    try {
        var item_postalCode = item["postalCode"][0];
        return_item["postalCode"] = item_postalCode;
    } catch (err) {
        return_item["postalCode"] = "N/A";
    }
    var totalValue = item_value;
    try {
        var item_shippingInfo = item["shippingInfo"][0]["shippingServiceCost"][0]["__value__"];
        if(item_shippingInfo==0){
            return_item["shippingCost"] = "Free Shipping";
        }else{
            return_item["shippingCost"] = "$"+item_shippingInfo;
        }
    } catch (err) {
        return_item["shippingCost"] = "N/A";
    }

    try {
        var shippingInfo = item["shippingInfo"][0];
        var sinfo = {};
        try {
            var cost = shippingInfo["shippingServiceCost"][0]["__value__"];
            if(cost==0){
                sinfo["cost"] = "Free Shipping";
            }else{
                sinfo["cost"] = "$"+cost;
            }
        } catch (err) {
            sinfo["cost"] = "";
        }
        try {
            var location = shippingInfo["shipToLocations"][0];
            sinfo["location"] = location;
        } catch (err) {
            sinfo["location"] = "";
        }
        try {
            var htime = shippingInfo["handlingTime"][0];
            if (htime=="0"||htime=="1"){
                sinfo["htime"]=htime+" Day";
            }else{
                sinfo["htime"]=htime+" Days";
            }
        } catch (err) {
            sinfo["htime"] = "";
        }
        try {
            var expedited = shippingInfo["expeditedShipping"][0];
            var expedited_value = (expedited==="true");
            sinfo["expedited"] = expedited_value;
        } catch (err) {
            sinfo["expedited"] = "";
        }
        try {
            var oneday = shippingInfo["oneDayShippingAvailable"][0];
            var oneday_value = (oneday==="true");
            sinfo["oneday"] = oneday_value;
        } catch (err) {
            sinfo["oneday"] = "";
        }
    } catch (err) {
        sinfo["cost"] = "";
        sinfo["location"] = "";
        sinfo["htime"] = "";
        sinfo["expedited"] = "";
        sinfo["oneday"] = "";
    }
    return_item["shippingInfo"] = sinfo;
    return_item["totalValue"] = totalValue;
    var slrinfo = {};
    slrinfo["username"] = sellerInfo["sellerUserName"][0];
    slrinfo["score"] = sellerInfo["feedbackScore"][0];
    slrinfo["percent"] = parseFloat(sellerInfo["positiveFeedbackPercent"][0]);
    slrinfo["star"] = sellerInfo["feedbackRatingStar"][0];
    slrinfo["top"] = (sellerInfo["topRatedSeller"][0]=="true");
    try {
        var storename = item["storeInfo"][0]["storeName"][0];
        slrinfo["storename"] = storename;
    } catch (err) {
        slrinfo["storename"] = "";
    }
    try {
        var storeurl = item["storeInfo"][0]["storeURL"][0];
        slrinfo["storeurl"] = storeurl;
    } catch (err) {
        slrinfo["storeurl"] = "";
    }
    return_item["sellerinfo"] = slrinfo;

    try {
        var item_condition = item["condition"][0]["conditionDisplayName"][0];
        return_item["condition"] = item_condition;
    } catch (err) {
        return_item["condition"] = "N/A";
    }

    try {
        var item_galleryURL = item["galleryURL"][0];
        return_item["galleryURL"] = item_galleryURL;
    } catch (err) {
        return_item["condition"] = "";
    }

    return return_item;
}

function getShortenTitle(title){
    var max_length = 36;
    if(title.length <= max_length)
        return title;
    if(title.charAt(max_length)==" ")
        return title.slice(0,max_length)+"...";
    var last_empty = title.slice(0,max_length).lastIndexOf(" ");
    return title.slice(0,last_empty+1)+"...";
}

function buildDetailUrl(query){
    var itemId = query.itemId;
    var url_base = "http://open.api.ebay.com/shopping";
    var operation = "GetSingleItem";
    var url = url_base+"?callname="+operation+"&responseencoding=JSON&appid="+APPID;
    url += "&siteid=0&version=967&ItemID="+itemId;
    url += "&IncludeSelector=Description,Details,ItemSpecifics";
    return url;
}

function assembleDetailResult(item_detail){
    var ack_result = item_detail["Ack"];
    if(ack_result=="Failure"){
        var error_message = item_detail["Errors"][0]["ShortMessage"];
        return [false, error_message];
    }
    var itemResult = item_detail["Item"]
    var location = itemResult["Location"];
    var viewItemURL = itemResult["ViewItemURLForNaturalSearch"];
    var picture = itemResult["PictureURL"];
    var seller = itemResult["Seller"]["UserID"];
    var price = itemResult["CurrentPrice"];
    var value = price["Value"];
    var title = itemResult["Title"];
    
    
    var return_policy = itemResult["ReturnPolicy"];
    var return_within = return_policy["ReturnsWithin"];
    var return_accepted = return_policy["ReturnsAccepted"];
    var item_id = itemResult["ItemID"];

    var detail_result = {};
    var facebookShareUrl = buildFacebookLink(viewItemURL,title,value)
    try {
        var subtitle = itemResult["Subtitle"];
        detail_result["subtitle"] = subtitle;
    } catch (err) {
        detail_result["subtitle"] = "";
    }
    try {
        var postcode = itemResult["PostalCode"];
    } catch (err) {
        postcode="undefined";
    }

    detail_result["location"] = location+", "+postcode;
    detail_result["picture"] = picture;
    detail_result["seller"] = seller;
    detail_result["price"] = "$"+value;
    detail_result["title"] = title;
    detail_result["facebookShareUrl"] = facebookShareUrl;
    detail_result["itemId"] = item_id;
    var sp = [];
    try {
        var specifics = itemResult["ItemSpecifics"]["NameValueList"];
        for(var i=0;i<specifics.length;i++){
            var specific = specifics[i];
            sp.push({"name":specific["Name"],"value":specific["Value"][0]});
        }
    } catch (error) {
        
    }
    detail_result["sp"] = sp;
    var policy_accepted = (return_accepted=="ReturnsNotAccepted");
    if (policy_accepted){
        detail_result["policy"] = "ReturnsNotAccepted";
    }else{
        detail_result["policy"] = return_accepted+" Within "+return_within;
    }
    detail_result["policy_accepted"] = !policy_accepted;

    return [true,detail_result];
}

function buildFacebookLink(ebay_url,productName,price){
    var url_base = "https://www.facebook.com/dialog/share";
    var url = url_base+"?app_id="+fb_app_id;
    url += "&display=popup&href="+encodeURIComponent(ebay_url);
    url += "&quote="+encodeURIComponent("Buy "+productName+" at $"+price+" from link below");
    // console.log(url);
    return url;
}

function buildFacebookLink2(ebay_url,productName,price){
    var url_base = "https://www.facebook.com/sharer/sharer.php";
    var url = url_base+"?u="+encodeURIComponent(ebay_url);
    url += "&quote="+encodeURIComponent("Buy "+productName+" at $"+price+" from link below");
    // console.log(url);
    return url;
}

function buildSimilarUrl(query){
    var itemId = query.itemId;
    var url_base = "http://svcs.ebay.com/MerchandisingService";
    var operation = "getSimilarItems";
    var request_number = 20;
    var url = url_base+"?OPERATION-NAME="+operation+"&SERVICE-NAME=MerchandisingService&SERVICE-VERSION=1.1.0&CONSUMER-ID="+APPID;
    url += "&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&itemId="+itemId;
    url += "&maxResults="+request_number;
    return url;
}

function assembleSimilarResult(result){
    var similarResult = result["getSimilarItemsResponse"]["itemRecommendations"]["item"];
    var similar_items = [];
    if(similarResult.length==0){
        return [false,"No Records."];
    }
    for(var i=0;i<similarResult.length;i++){
        similar_item = getSimilarByIndex(similarResult, i);
        similar_items.push(similar_item);
    }
    return [true,similar_items];
}

function getSimilarByIndex(similarResult, i){
    item = similarResult[i];

    itemId = item["itemId"];
    title = item["title"];
    imageURL = item["imageURL"];
    viewItemURL = item["viewItemURL"];
    buyItNowPrice = item["buyItNowPrice"]["__value__"];
    shippingCost = item["shippingCost"]["__value__"];
    timeLeft = item["timeLeft"].match(/P(\d*)D/)[1];

    similar_item = {};
    similar_item["itemId"] = itemId;
    similar_item["title"] = title;
    similar_item["imageURL"] = imageURL;
    similar_item["viewItemURL"] = viewItemURL;
    similar_item["value"] = parseFloat(buyItNowPrice);
    similar_item["ship"] = parseFloat(shippingCost);
    similar_item["time"] = parseInt(timeLeft);
    similar_item["valueStr"] = "$"+buyItNowPrice;
    similar_item["shipStr"] = "$"+shippingCost;
    similar_item["timeStr"] = timeLeft;
    return similar_item;
}

function buildPictureUrl(query){
    var key = query.key;
    var url_base = "https://www.googleapis.com/customsearch/v1";
    var request_number = 8;
    // var url = url_base+"?"+new URLSearchParams({"q":key}).toString();
    var url = url_base+"?q="+encodeURIComponent(key);
    url += "&cx="+gl_search_engine_id;
    url += "&imgSize=huge&imgType=news&num="+request_number;
    url += "&searchType=image&key="+gl_ak;
    return url;
}

function assemblePictureResult(query){
    var assemble_list = [1,2,3,1,2,3,2,3];
    var count = query["searchInformation"]["totalResults"];
    if(count==0){
        return [false,"No Records."];
    }
    var items = query["items"];
    var return_items = []
    return_items.push([]);
    return_items.push([]);
    return_items.push([]);
    return_items.push([]);
    for(var i=0;i<items.length;i++){
        var item = items[i];
        return_items[0].push(item["link"]);
        return_items[assemble_list[i]].push(item["link"]);
    }
    return [true,return_items];
}

function buildAutoCompleteUrl(query){
    var start = query.start;
    var url_base = "http://api.geonames.org/postalCodeSearchJSON";
    var url = url_base + "?postalcode_startsWith="+start;
    url += "&username="+geo_username;
    url += "&country=US&maxRows=5";
    return url;
}

function assembleAutoCompleteResult(result){
    var postalCodeArray = result["postalCodes"];
    var resultArray = [];
    for(var i=0;i<postalCodeArray.length;i++){
        var code = postalCodeArray[i]["postalCode"];
        resultArray.push(code);
    }
    return resultArray;
}