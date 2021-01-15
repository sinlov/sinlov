require('dotenv').config();

const fs = require('fs');
const fs_path = require('path');
const extend = require('extend');
const querystring = require('querystring');
const fetch = require('node-fetch');
const Mustache = require('mustache');
const moment = require('moment-timezone');
const fsUtils = require("nodejs-fs-utils");
const lineReader = require('line-reader');

function isDebug() {
    return process.env.RUN_MODE && process.env.RUN_MODE !== 'prod'
}

/**
 * default setting at here
 */
let DATA = {
    branch: 'main',
    lang: 'en',
    i18n_name: 'en-US',
    time_zone: 'Asia/Shanghai',
    units: 'metric',
    wind_speed_units: 'meter/sec',
    git_action_main_publish_name: 'build-README.md',
    readme_cache: {
        waka: [],
    },
    show_travis: false,
    code_with_list: []
};

/**
 * DATA is the object that contains all
 * the data to be provided to Mustache.
 */
const MUSTACHE_MAIN_DIR = './main.mustache';

async function mergeConfig() {
    let code_with_badge_info = JSON.parse(fs.readFileSync('./badge_info.json'));
    let index_config = JSON.parse(fs.readFileSync('./index.json'));
    extend(DATA, index_config);
    DATA.code_with_badge = code_with_badge_info;
    DATA.date = new Date().toLocaleDateString(DATA.i18n_name, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
        timeZone: DATA.time_zone
    })

    if (process.env.GITHUB_ACTOR) {
        DATA.name = process.env.GITHUB_ACTOR
    }

    if (process.env.CITY_NAME) {
        DATA.city = process.env.CITY_NAME
    }

    if (isDebug()) {
        console.log('merge DATA: ', JSON.stringify(DATA));
    }

    if (!DATA.name) {
        console.log(new Error('error: index.json not set name, or not set env GITHUB_ACTOR, this env will auto include when run as github action.'));
        process.exit(128);
    }

    if (!DATA.city) {
        console.log(new Error('error: index.json not set city, or not set env CITY_NAME'));
        process.exit(128);
    }
    if (!process.env.OPEN_WEATHER_MAP_KEY) {
        console.log('Warning not set env OPEN_WEATHER_MAP_KEY , please add as https://home.openweathermap.org/api_keys');
    }
}

/**
 * https://img.shields.io/ get image of badge
 * @param {*.bg_color} icon background
 * @param {*.logo} logo https://simpleicons.org/?q={name}
 */
function urlShieldBadge(info) {
    let defaultInfo = {
        label: 'Go',
        bg_color: '00ACD7',
        logo: 'go',
        logoColor: 'white',
        style: 'flat-square'
    };
    extend(defaultInfo, info);
    info.bg_color = info.bg_color.replace('#', '');
    info.logoColor = info.logoColor.replace('#', '');
    return `https://img.shields.io/badge/-${info.label}-${info.bg_color}?${querystring.stringify(
        {
            logo: info.logo,
            logoColor: info.logoColor,
            style: info.style
        }
    )}`
}

function shieldBadgeHtml(info) {
    let defaultHtmlInfo = {
        label: 'Go',
    };
    extend(defaultHtmlInfo, info);
    if (info.link) {
        return `<a href="${info.link}"><img alt="${info.label}" src="${urlShieldBadge(info)}"/></a>`
    }
    return `<img alt="${info.label}" src="${urlShieldBadge(info)}"/>`
}

/**
 * https://img.shields.io/ get image of static
 * @param {*.color} icon background
 * @param {*.logo} logo https://simpleicons.org/?q={name}
 * @param {*.logoColor} logo color
 */
function urlShieldStatic(info) {
    let defaultInfo = {
        label: 'Go',
        message: 'golang',
        color: '273238',
        logo: 'go',
        logoColor: '00ACD7',
        style: 'flat-square'
    };
    extend(defaultInfo, info);
    // delete info.link
    info.color = info.color.replace('#', '');
    info.logoColor = info.logoColor.replace('#', '');
    return `https://img.shields.io/static/v1?${querystring.stringify(info)}`
}

function shieldStaticHTML(info) {
    let defaultInfo = {
        label: 'Go',
    };
    extend(defaultInfo, info);
    if (info.link) {
        return `<a href="${info.link}"><img alt="${info.label}" src="${urlShieldStatic(info)}"/></a>`
    }
    return `<img alt="${info.label}" src="${urlShieldStatic(info)}"/>`
}


async function getImgShields() {
    if (DATA.code_with_badge) {
        for (let i in DATA.code_with_badge) {
            DATA.code_with_list.push(shieldBadgeHtml(DATA.code_with_badge[i]))
        }
    }
}

async function keepWakaOldData() {
    let nextCache = false;
    await lineReader.eachLine('README.md', (line, last) => {
        if (last) {
            console.log(`keepWakaOldData DATA.readme_cache.waka:\n${DATA.readme_cache.waka.join('\n')}`);
            let fullContent = []
            let writeCache = false;
            lineReader.eachLine('README.md', (line, last) => {
                fullContent.push(line);
                if (line.toString().indexOf(`<!--START_SECTION:waka-->`) !== -1) {
                    writeCache = true;
                }
                if (writeCache && DATA.readme_cache.waka.length > 0) {
                    fullContent.push(DATA.readme_cache.waka.join('\n'));
                    writeCache = false;
                }
                if (last) {
                    fs.writeFileSync('README.md', fullContent.join('\n'));
                }
            });
        } else {
            if (line.toString().indexOf(`<!--END_SECTION:waka-->`) !== -1) {
                nextCache = false;
            }
            if (nextCache) {
                DATA.readme_cache.waka.push(`${line}`);
            }
            if (line.toString().indexOf(`<!--START_SECTION:waka-->`) !== -1) {
                nextCache = true;
            }
        }
    });
}

async function keepReadMeData() {
    if (isDebug()) {
        console.log('keepReadMeData start');
    }
    await keepWakaOldData();
    if (isDebug()) {
        console.log('keepReadMeData end');
    }
}

/**
 * API from https://openweathermap.org/current
 * @param {*} city all by city name or city name, state code and country code. Please note that searching by states available only for the USA locations.
 * @param {*} appid see: https://home.openweathermap.org/api_keys
 * @param {*} lang see: https://openweathermap.org/current#multi
 * @param {*} units see: https://openweathermap.org/current#data
 */
async function setWeatherInformation(city, appid, lang, units) {
    if (!appid) {
        return
    }

    async function save_weather_data(data) {
        let date_f = moment().tz(DATA.time_zone);
        let saveDir = fs_path.resolve(fs_path.join('.', 'weather_data', date_f.format('yyyy'), date_f.format('MM'), date_f.format('DD')));
        if (!fs.existsSync(saveDir)) {
            // console.log(`saveDir ennd mkdir ${saveDir}`);
            fsUtils.mkdirsSync(saveDir);
        }
        let saveFile = fs_path.join(saveDir, `weather-data-${date_f.format('yyyy')}-${date_f.format('MM')}-${date_f.format('DD')}.json`);
        // console.log(saveFile);
        let saveData = [];
        if (fs.existsSync(saveFile)) {
            let old = JSON.parse(fs.readFileSync(saveFile));
            for (i in old) {
                saveData.push(old[i]);
            }
        }
        saveData.push({
            date: moment().format(),
            weather: data
        });
        fs.writeFileSync(saveFile, JSON.stringify(saveData, null, 2));
    }

    let openweathermap_url = `https://api.openweathermap.org/data/2.5/weather?${querystring.stringify({q: city})}&appid=${appid}&lang=${lang}&units=${units}`
    await fetch(openweathermap_url)
        .then(r => r.json())
        .then(r => {
            DATA.city_temperature = r.main.temp.toFixed(1);
            DATA.city_feels_like = r.main.feels_like.toFixed(1);
            DATA.city_humidity = r.main.humidity;
            DATA.city_weather_icon = `http://openweathermap.org/img/wn/${r.weather[0].icon}@2x.png`;
            DATA.city_weather = r.weather[0].description;
            DATA.wind_speed = r.wind.speed;
            DATA.sun_rise_timestamp = r.sys.sunrise * 1000;
            DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString(DATA.i18n_name, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: DATA.time_zone,
            });
            DATA.sun_set_timestamp = r.sys.sunset * 1000;
            DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString(DATA.i18n_name, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: DATA.time_zone,
            });
            save_weather_data(r);
        });
}

async function switchThemeByTime(timezone = "America/Los_Angeles", sun_rise_timestamp = 0, sun_set_timestamp = 0) {
    let sun_rise = 7;
    if (sun_rise_timestamp != 0) {
        sun_rise = Number(moment(sun_rise_timestamp).tz(timezone).format('H'));
    }
    let sun_set = 22;
    if (sun_set_timestamp != 0) {
        sun_set = Number(moment(sun_set_timestamp).tz(timezone).format('H'));
    }
    let currentHour = moment().tz(timezone).format('H');
    // console.log('sun_rise', sun_rise, 'sun_set', sun_set, 'currentHour', currentHour, currentHour >= sun_set, currentHour < sun_rise);
    let nightModeApplicable = (currentHour >= sun_set || currentHour < sun_rise) ? true : false;
    if (nightModeApplicable) {
        DATA.github_readme_stats_url = `https://github-readme-stats.vercel.app/api?username=${DATA.name}&show_icons=true&theme=dracula`
    } else {
        DATA.github_readme_stats_url = `https://github-readme-stats.vercel.app/api?username=${DATA.name}&show_icons=true&theme=buefy`
    }
}

// async function setInstagramPosts() {
//   const instagramImages = await puppeteerService.getLatestInstagramPostsFromAccount('visitstockholm', 3);
//   DATA.img1 = instagramImages[0];
//   DATA.img2 = instagramImages[1];
//   DATA.img3 = instagramImages[2];
// }

function generateReadMe() {
    if (isDebug()) {
        console.log('generateReadMe start');
    }
    fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
        if (err) throw err;
        const output = Mustache.render(data.toString(), DATA);
        fs.writeFileSync('README.md', output);
    });
    if (isDebug()) {
        console.log('generateReadMe finish');
    }
}


/**
 * do github action
 */
async function action() {

    /**
     * first merge config
     */
    await mergeConfig();

    await keepReadMeData();

    /** get image shields */
    await getImgShields();

    /**
     * Fetch Weather
     * must load env as OPEN_WEATHER_MAP_KEY
     */
    if (process.env.OPEN_WEATHER_MAP_KEY) {
        await setWeatherInformation(DATA.city, process.env.OPEN_WEATHER_MAP_KEY, DATA.lang, DATA.units);
    }

    /**
     * sit different theme of status
     */
    await switchThemeByTime(DATA.time_zone, DATA.sun_rise_timestamp, DATA.sun_set_timestamp);

    /**
     * Generate README
     */
    await generateReadMe();

    /**
     * future 👋
     */
    // await puppeteerService.close();
}

action().then(r => {

});