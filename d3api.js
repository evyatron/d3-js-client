var D3API = new function() {
    var _this = this,
        server = '', locale = '',
        
        URL_BASE = 'http://{server}.battle.net/api/d3/',
        
        URL_CAREER = 'profile/{battletagName}-{battletagCode}/index',
        URL_HERO = 'profile/{battletagName}-{battletagCode}/hero/{heroId}',
        URL_ITEM = 'data/item/{item}',
        URL_FOLLOWER = 'data/follower/{type}',
        URL_ARTISAN = 'data/artisan/{type}',
        
        EXCEPTION_SERVER = 'Missing or invalid server, please init with D3API.SERVERS first!',
        EXCEPTION_LOCALE = 'Missing or invalid locale, please init with D3API.LOCALES first!',
        EXCEPTION_MISSING_PARAM = 'Missing or invalid param: {paramName}';

    this.SERVERS = {'US': 'us', 'EU': 'eu', 'TW': 'tw', 'KR': 'kr', 'CN': 'cn'};
    this.LOCALES = {'EN_US': 'en_US', 'EN_GB': 'en_GB',
                    'ES_MX': 'es_MX', 'ES_ES': 'es_ES', 'IT_IT': 'it_IT', 'PT_PT': 'pt_PT', 'FR_FR': 'fr_FR', 'DE_DE': 'de_DE', 'PL_PL': 'pl_PL',
                    'RU_RU': 'ru_RU', 'KO_KR': 'ko_KR', 'ZH_TW': 'zh_TW', 'ZH_CN': 'zh_CN'};
    this.FOLLOWERS = {
        'ENCHANTRESS': 'enchantress',
        'TEMPLAR': 'templar',
        'SCOUNDREL': 'scoundrel'
    };
    this.ARTISANS = {
        'BLACKSMITH': 'blacksmith',
        'JEWELER': 'jeweler'
    };
    
    this.init = function(options) {
        !options && (options = {});
        
        _expose("Followers", _this.FOLLOWERS, "getFollower");
        _expose("Artisans", _this.ARTISANS, "getArtisan");
        
        _this.setServer(options.server || _this.SERVERS.US);
        _this.setLocale(options.locale || _this.LOCALES.EN_US);
        
        return _this;
    };
    
    this.getCareer = function(options){
        return _get(URL_CAREER, options);
    };
    this.getHero = function(options){
        return _get(URL_HERO, options);
    };
    this.getItem = function(options){
        _is(options.item, "object") && (options.item = options.item.tooltipParams.replace(/item\//g, ''));
        return _get(URL_ITEM, options);
    };
    this.getFollower = function(options){
        return _get(URL_FOLLOWER, options);
    };
    this.getArtisan = function(options){
        return _get(URL_ARTISAN, options);
    };
    
    this.setServer = function(_val){
        _val && (server = _val);
        return _this;
    };
    this.setLocale = function(_val){
        _val && (locale = _val);
        return _this;
    };

    this.Media = new function() {
        var IMAGE_PAPERDOLL = 'http://us.battle.net/d3/static/images/profile/hero/paperdoll/',
            ICON_PREFIX = 'http://us.media.blizzard.com/d3/icons/';
        
        this.CLASSES = {
            'BARBARIAN': 'barbarian',
            'DEMON_HUNTER': 'demon-hunter',
            'MONK': 'monk',
            'WITCH_DOCTOR': 'witch-doctor',
            'WIZARD': 'wizard'
        };
        this.GENDERS = {
            'MALE': 'male',
            'FEMALE': 'female',
            0: 'male',
            1: 'female'
        };
        this.ITEM_SIZES = {
            'LARGE': 'large',
            'SMALL': 'small'
        };
        this.SKILL_SIZES = {
            'LARGE': 64,
            'SMALL': 42
        };
        
        this.paperdoll = function(cls, gender) {
            _is(cls, "object") && (gender = cls["gender"], cls = cls["class"]);
            _is(gender, "number") && (gender = _this.Media.GENDERS[gender]);
            
            cls = cls || _this.Media.CLASSES.BARBARIAN;
            gender = gender || _this.Media.GENDERS.FEMALE;
            
            return IMAGE_PAPERDOLL + _e(cls) + '-' + _e(gender) + '.jpg';
        };
        
        this.item = function(slug, size) {
            _is(slug, "object") && (slug = slug.icon);
            size = size || _this.Media.ITEM_SIZES.LARGE;
            return ICON_PREFIX + 'items/' + _e(size) + '/' + _e(slug) + '.png';
        };
        
        this.skill = function(slug, size) {
            _is(slug, "object") && (slug = slug.skill? slug.skill.icon : slug.icon);
            size = size || _this.Media.SKILL_SIZES.LARGE;
            return ICON_PREFIX + 'skills/' + _e(size) + '/' + _e(slug) + '.png';
        };
    };
    
    // create public functions for each object in DATA under the NAMESPACE
    function _expose(namespace, data, actualMethod) {
        if (_this[namespace]) return;
        
        _this[namespace] = {};
        for (var key in data) {
            (function createMethod(obj, actualMethod, key, value) {
                var keyMethod = key.charAt(0).toUpperCase() + key.substring(1).toLowerCase();
                obj[keyMethod] = function(callback) {
                    return _this[actualMethod]({
                        "success": callback,
                        "error": callback,
                        "type": value
                    });
                };
            })(_this[namespace], actualMethod, key, data[key]);
        }
    }
    
    // replace the placeholders in the URL with values from PARAMS
    function _buildURL(url, params) {
        for (var p in params) {
            url = url.replace('{' + p + '}', _e(params[p]));
        }
        return url;
    }
    
    function _get(urlPart, options, ex) {
        if (!server) throw EXCEPTION_SERVER;
        if (!locale) throw EXCEPTION_LOCALE;
        
        urlPart = _buildURL(urlPart, options);
        
        var missingParams = urlPart.match(/{([^}]*)}/) || [];
        if (missingParams.length > 1) throw EXCEPTION_MISSING_PARAM.replace(/{paramName}/g, missingParams[1]);
        
        var cb = "_cb" + new Date().getTime(),
            url = URL_BASE.replace(/{server}/g, options.server || server) + urlPart + '?locale=' + _e(options.locale || locale) + '&callback=' + _e(cb);
        
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        
        window[cb] = function(data) {
            script.parentNode.removeChild(script);
            (options[(data.code? "error" : "success")] || function(){})(data, url, options);
            delete window[cb];
        };
        
        document.body.appendChild(script);
        
        return _this;
    }
    
    function _e(s) { return encodeURIComponent(""+s); }
    function _is(o, t) { return (typeof o === t); }
    
    _this.init();
};