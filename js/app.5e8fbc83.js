(function(e){function t(t){for(var i,r,c=t[0],o=t[1],d=t[2],u=0,p=[];u<c.length;u++)r=c[u],Object.prototype.hasOwnProperty.call(s,r)&&s[r]&&p.push(s[r][0]),s[r]=0;for(i in o)Object.prototype.hasOwnProperty.call(o,i)&&(e[i]=o[i]);l&&l(t);while(p.length)p.shift()();return a.push.apply(a,d||[]),n()}function n(){for(var e,t=0;t<a.length;t++){for(var n=a[t],i=!0,r=1;r<n.length;r++){var c=n[r];0!==s[c]&&(i=!1)}i&&(a.splice(t--,1),e=o(o.s=n[0]))}return e}var i={},r={app:0},s={app:0},a=[];function c(e){return o.p+"js/"+({about:"about"}[e]||e)+"."+{about:"c04ee87c"}[e]+".js"}function o(t){if(i[t])return i[t].exports;var n=i[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,o),n.l=!0,n.exports}o.e=function(e){var t=[],n={about:1};r[e]?t.push(r[e]):0!==r[e]&&n[e]&&t.push(r[e]=new Promise((function(t,n){for(var i="css/"+({about:"about"}[e]||e)+"."+{about:"e8506a7d"}[e]+".css",s=o.p+i,a=document.getElementsByTagName("link"),c=0;c<a.length;c++){var d=a[c],u=d.getAttribute("data-href")||d.getAttribute("href");if("stylesheet"===d.rel&&(u===i||u===s))return t()}var p=document.getElementsByTagName("style");for(c=0;c<p.length;c++){d=p[c],u=d.getAttribute("data-href");if(u===i||u===s)return t()}var l=document.createElement("link");l.rel="stylesheet",l.type="text/css",l.onload=t,l.onerror=function(t){var i=t&&t.target&&t.target.src||s,a=new Error("Loading CSS chunk "+e+" failed.\n("+i+")");a.code="CSS_CHUNK_LOAD_FAILED",a.request=i,delete r[e],l.parentNode.removeChild(l),n(a)},l.href=s;var f=document.getElementsByTagName("head")[0];f.appendChild(l)})).then((function(){r[e]=0})));var i=s[e];if(0!==i)if(i)t.push(i[2]);else{var a=new Promise((function(t,n){i=s[e]=[t,n]}));t.push(i[2]=a);var d,u=document.createElement("script");u.charset="utf-8",u.timeout=120,o.nc&&u.setAttribute("nonce",o.nc),u.src=c(e);var p=new Error;d=function(t){u.onerror=u.onload=null,clearTimeout(l);var n=s[e];if(0!==n){if(n){var i=t&&("load"===t.type?"missing":t.type),r=t&&t.target&&t.target.src;p.message="Loading chunk "+e+" failed.\n("+i+": "+r+")",p.name="ChunkLoadError",p.type=i,p.request=r,n[1](p)}s[e]=void 0}};var l=setTimeout((function(){d({type:"timeout",target:u})}),12e4);u.onerror=u.onload=d,document.head.appendChild(u)}return Promise.all(t)},o.m=e,o.c=i,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)o.d(n,i,function(t){return e[t]}.bind(null,i));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="/what-lunch/",o.oe=function(e){throw console.error(e),e};var d=window["webpackJsonp"]=window["webpackJsonp"]||[],u=d.push.bind(d);d.push=t,d=d.slice();for(var p=0;p<d.length;p++)t(d[p]);var l=u;a.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},1648:function(e){e.exports=JSON.parse('[{"id":"id-1","name":"鼎泰豐","distance":150,"type":"chi","price":120},{"id":"id-2","name":"一蘭拉麵","distance":150,"type":"jp","price":100},{"id":"id-3","name":"西提","distance":250,"type":"west","price":160},{"id":"id-4","name":"韓國郎","distance":150,"type":"kr","price":115},{"id":"id-5","name":"Sukiya","distance":50,"type":"jp","price":100},{"id":"id-6","name":"王品","distance":400,"type":"west","price":120},{"id":"id-7","name":"瓦城","distance":110,"type":"tai","price":85},{"id":"id-8","name":"吉野家","distance":310,"type":"jp","price":70},{"id":"id-9","name":"我家牛排","distance":90,"type":"west","price":105},{"id":"id-10","name":"小食泰","distance":850,"type":"tai","price":65},{"id":"id-11","name":"迴轉壽司","distance":240,"type":"jp","price":70},{"id":"id-12","name":"夏慕尼","distance":150,"type":"west","price":130},{"id":"id-13","name":"打拋專賣","distance":510,"type":"tai","price":150},{"id":"id-14","name":"日式燒肉","distance":190,"type":"jp","price":125},{"id":"id-15","name":"義麵屋","distance":380,"type":"west","price":145},{"id":"id-16","name":"湄南小鎮","distance":110,"type":"tai","price":105},{"id":"id-17","name":"丼飯","distance":10,"type":"jp","price":100},{"id":"id-18","name":"漢堡王","distance":150,"type":"west","price":110},{"id":"id-19","name":"熱炒100","distance":290,"type":"chi","price":90}]')},"56d7":function(e,t,n){"use strict";n.r(t);n("4de4"),n("e260"),n("e6cf"),n("cca6"),n("a79d");var i=n("2b0e"),r=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"app"}},[n("el-container",[n("el-header",{attrs:{id:"header"}},[n("router-link",{attrs:{to:"/"}},[n("span",[e._v("午餐吃什麼")])]),n("router-link",{staticClass:"float-btn",attrs:{to:"/dishes"}},[n("el-link",{attrs:{icon:"el-icon-edit",underline:!1}},[e._v("編輯菜單")])],1)],1),n("el-container",[n("el-main",[n("router-view")],1)],1)],1)],1)},s=[],a={methods:{gotoEdit:function(){this.$router.push({name:"dishes"})}}},c=a,o=(n("5c0b"),n("2877")),d=Object(o["a"])(c,r,s,!1,null,null,null),u=d.exports,p=(n("d3b7"),n("8c4f")),l=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"home"},[n("div",[e._v(" 一週預算： "),n("el-input-number",{attrs:{step:10,min:100,max:2e3,label:"一週預算"},on:{change:e.handleChange},model:{value:e.price,callback:function(t){e.price=t},expression:"price"}}),e._v(" 元 ")],1),n("el-divider",[n("el-button",{attrs:{type:"success",round:"",icon:"el-icon-dish"},on:{click:e.recommend}},[e._v("一鍵推薦")])],1),n("div",{staticClass:"weekly"},[n("el-row",{attrs:{gutter:20}},e._l(e.recommends,(function(t,i){return n("el-col",{key:i,attrs:{xs:{span:24},sm:{span:4,offset:0==i?2:0}}},[n("el-card",[n("div",{staticClass:"clearfix",attrs:{slot:"header"},slot:"header"},[n("span",[e._v("星期"+e._s(i+1))])]),t.name?n("div",[n("div",{staticClass:"item"},[e._v(" "+e._s(t.name)+" ")]),n("div",{staticClass:"item"},[n("el-tag",{attrs:{effect:"dark",hit:!0,type:"primary",color:e._f("typeColor")(t.type),"disable-transitions":""}},[e._v(e._s(e._f("typeText")(t.type)))])],1),n("div",{staticClass:"item"},[e._v(" "+e._s("$"+t.price)+" ")]),n("div",{staticClass:"item"},[e._v(" "+e._s("距離："+t.distance+"m")+" ")]),n("el-button",{attrs:{type:"button",icon:"el-icon-refresh",circle:""},on:{click:function(t){return e.recommendSingle(i)}}})],1):n("i",{staticClass:"el-icon-question"})])],1)})),1),n("el-divider",[e._v(" to-do List ")]),e._m(0)],1)],1)},f=[function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[e._v(" 一鍵推薦區："),n("br"),e._v(" 1. 點擊ㄧ鍵推薦或單日可增加 loading 動畫"),n("br"),n("br"),e._v(" 編輯菜單區："),n("br"),e._v(" 1. 新增餐廳後存於 cookie"),n("br"),e._v(" 2. 餐廳列表用類別篩選 ")])}],h=(n("99af"),n("c740"),n("fb6a"),n("a434"),n("5530")),m=n("2f62"),v={name:"Home",components:{},data:function(){return{price:500}},computed:Object(h["a"])({},Object(m["b"])(["dishes","recommends","leftDishes"])),methods:{handleChange:function(){},recommendSingle:function(e){for(var t=this.recommends.slice(0),n=this.leftDishes.slice(0),i=this.price,r=0;r<t.length;r++)r!==e&&(i-=t[r].price);if(n.length<=0)this.$message({message:"找不到符合條件的餐廳",type:"warning"});else{var s=n.findIndex((function(e){return e.price<=i}));if(s<0)this.$message({message:"找不到符合條件的餐廳",type:"warning"});else{if(t[e]=n[s],n.splice(s,1),!(this.findMaxRepeat(t)<=2))return this.recommendSingle(e);this.$store.dispatch("setRecommend",{recommends:t}),this.$store.dispatch("setLeftDishes",{leftDishes:n})}}},recommend:function(){var e=0,t="",n=0,i=0;while(n>=2&&i>=4)t!==this.dishes[i].type&&(t=this.dishes[i].type,n+=1),e+=this.dishes[i].price,i=1;if(!(this.price<e)){var r=this.dishes.slice(0).sort((function(e,t){return e.price-t.price})),s=r.sort((function(){return Math.random()-.5})).splice(0,5).sort((function(e,t){return e.price-t.price})),a=this.checkTotalPrice(s,r,[]),c=a.recommendDishes,o=a.allDishes,d=a.dropDishes;c=this.nonRepeatSort(c),this.$store.dispatch("setRecommend",{recommends:c}),this.$store.dispatch("setLeftDishes",{leftDishes:o.concat(d)})}},nonRepeatSort:function(e){return this.findMaxRepeat(e)<=2?e:this.nonRepeatSort(e.sort((function(){return Math.random()-.5})))},findMaxRepeat:function(e){for(var t=e[0].type,n=[],i=1,r=1;r<e.length;r++)t===e[r].type?i+=1:(n.push(i),i=1),t=e[r].type;return n.push(i),Math.max.apply(Math,n)},checkTotalPrice:function(e,t,n){e.sort((function(e,t){return e.price-t.price})),t.sort((function(){return Math.random()-.5}));var i=this.dishesArraySum(e),r=i.sum,s=i.kind;return r<=this.price&&s>=2?{recommendDishes:e,allDishes:t,dropDishes:n}:(n.push(e.pop()),e.push(t.pop()),this.checkTotalPrice(e,t,n))},dishesArraySum:function(e){for(var t=0,n="",i=0,r=0;r<e.length;r++)n!==e[r].type&&(n=e[r].type,i+=1),t+=e[r].price;return{sum:t,kind:i}}}},y=v,b=(n("a627"),Object(o["a"])(y,l,f,!1,null,"57b7c987",null)),g=b.exports;i["default"].use(p["a"]);var _=[{path:"/",name:"Home",component:g},{path:"/dishes",name:"dishes",component:function(){return n.e("about").then(n.bind(null,"b36b"))}}],w=new p["a"]({mode:"history",base:"/what-lunch/",routes:_}),k=w,D=n("1648"),j=(n("25f0"),function(){return"_"+Math.random().toString(36).substr(2,9)});i["default"].use(m["a"]);var C=new m["a"].Store({state:{types:{kr:"韓式",jp:"日式",tai:"泰式",chi:"中式",west:"西式"},dishes:D,recommends:[{},{},{},{},{}],leftDishes:[]},mutations:{setDishes:function(e,t){e.dishes=t},addDish:function(e,t){e.dishes.push(Object(h["a"])({id:j()},t))},deleteDish:function(e,t){var n=e.dishes.findIndex((function(e){return e.id===t}));e.dishes.splice(n,1)},setRecommend:function(e,t){e.recommends=t},setLeftDishes:function(e,t){e.leftDishes=t}},actions:{getDishes:function(e){var t=e.commit;t("setStation",{})},addDish:function(e,t){var n=e.commit,i=t.data;n("addDish",i)},deleteDish:function(e,t){var n=e.commit,i=t.id;n("deleteDish",i)},setRecommend:function(e,t){var n=e.commit,i=t.recommends;n("setRecommend",i)},setLeftDishes:function(e,t){var n=e.commit,i=t.leftDishes;n("setLeftDishes",i)}},getters:{dishes:function(e){return e.dishes.sort((function(e,t){return e.price-t.price}))},types:function(e){return e.types},recommends:function(e){return e.recommends},leftDishes:function(e){return e.leftDishes}},modules:{}}),x=n("5c96"),S=n.n(x);n("0fae"),n("f5df1");i["default"].use(S.a),i["default"].config.productionTip=!1,i["default"].filter("typeColor",(function(e){var t="";switch(e){case"chi":t="#67C23A";break;case"jp":t="#E6A23C";break;case"kr":t="#F56C6C";break;case"tai":t="#909399";break;case"west":t="#109399";break;default:t="#fff";break}return t})),i["default"].filter("typeText",(function(e){var t={kr:"韓式",jp:"日式",tai:"泰式",chi:"中式",west:"西式"};return t[e]})),new i["default"]({router:k,store:C,render:function(e){return e(u)}}).$mount("#app")},"5c0b":function(e,t,n){"use strict";var i=n("9c0c"),r=n.n(i);r.a},7135:function(e,t,n){},"9c0c":function(e,t,n){},a627:function(e,t,n){"use strict";var i=n("7135"),r=n.n(i);r.a}});
//# sourceMappingURL=app.5e8fbc83.js.map