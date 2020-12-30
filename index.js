require('dotenv').config();

const fs = require('fs');
const extend = require('extend');
const querystring = require('querystring');
const fetch = require('node-fetch');
const Mustache = require('mustache');

/**
 * DATA is the object that contains all
 * the data to be provided to Mustache.
 */
const MUSTACHE_MAIN_DIR = './main.mustache';

let code_with_badge_info = [{
    label: "Git",
    bg_color: '#F54D27',
    logo: 'Git',
    logoColor: 'white',
    link: "https://git-scm.com/"
  },
  {
    label: "Github Actions",
    bg_color: '#2088FF',
    logo: 'github-actions',
    logoColor: 'white',
    link: "https://docs.github.com/free-pro-team@latest/actions"
  },
  {
    label: "travis",
    bg_color: '#2DB459',
    logo: 'travis ci',
    logoColor: 'white',
    link: "https://travis-ci.com/github/sinlov"
  },
  {
    label: "C",
    bg_color: '#A8BACC',
    logo: 'C',
    logoColor: 'white',
    link: "https://www.tutorialspoint.com/cprogramming/"
  },
  {
    label: "Cplusplus",
    bg_color: '#00599C',
    logo: 'C++',
    logoColor: 'white',
    link: "https://www.cplusplus.com/"
  },
  {
    label: "CMake",
    bg_color: '#064F8C',
    logo: 'CMake',
    logoColor: 'white',
    link: "https://cmake.org/"
  },
  {
    label: "Shell",
    bg_color: '#FFD500',
    logo: 'Shell',
    logoColor: 'white',
    link: "https://www.shellscript.sh/"
  },
  {
    label: "Java",
    bg_color: '#007396',
    logo: 'Java',
    logoColor: 'white',
    link: "https://www.java.com/"
  },
  {
    label: "Kotlin",
    bg_color: '#27282C',
    logo: 'Kotlin',
    logoColor: 'white',
    link: "https://kotlinlang.org/"
  },
  {
    label: "Groovy",
    bg_color: '#4198B8',
    logo: 'Apache Groovy',
    logoColor: 'white',
    link: "https://groovy-lang.org/"
  },
  {
    label: "Gradle",
    bg_color: '#02303A',
    logo: 'Gradle',
    logoColor: 'white',
    link: "https://gradle.org/"
  },
  {
    label: "Android",
    bg_color: '#3DDC84',
    logo: 'Android',
    logoColor: 'white',
    link: "https://developer.android.com/"
  },
  {
    label: "iOS",
    bg_color: '#000000',
    logo: 'iOS',
    logoColor: 'white',
    link: "https://developer.apple.com/ios/"
  },
  {
    label: "Python",
    bg_color: '#3776AB',
    logo: 'Python',
    logoColor: 'white',
    link: "https://www.python.org/"
  },
  {
    label: "Go",
    bg_color: '#00ACD7',
    logo: 'go',
    logoColor: 'white',
    link: "https://golang.org/"
  },
  {
    label: "Dart",
    bg_color: '#0175C2',
    logo: 'Dart',
    logoColor: 'white',
    link: "https://dart.dev/"
  },
  {
    label: "Ruby",
    bg_color: '#CC342D',
    logo: 'Ruby',
    logoColor: 'white',
    link: "https://www.ruby-lang.org/"
  },
  {
    label: "html5",
    bg_color: '#E44D26',
    logo: 'html5',
    logoColor: 'white',
    link: "https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5"
  },
  {
    label: "CSS",
    bg_color: '#1672B6',
    logo: 'CSS3',
    logoColor: 'white',
    link: "https://developer.mozilla.org/docs/Archive/CSS3"
  },
  {
    label: "JavaScript",
    bg_color: '#F7DF1E',
    logo: 'JavaScript',
    logoColor: 'white',
    link: "https://developer.mozilla.org/docs/Web/JavaScript"
  },
  {
    label: "TypeScript",
    bg_color: '#017ACC',
    logo: 'TypeScript',
    logoColor: 'white',
    link: "https://www.typescriptlang.org/"
  },
  {
    label: "CoffeeScript",
    bg_color: '#2F2625',
    logo: 'CoffeeScript',
    logoColor: 'white',
    link: "https://coffeescript.org/"
  },
  {
    label: "Nodejs",
    bg_color: '#43853D',
    logo: 'Node.js',
    logoColor: 'white',
    link: "https://nodejs.org/"
  },
  {
    label: "npm",
    bg_color: '#CB3837',
    logo: 'npm',
    logoColor: 'white',
    link: "https://www.npmjs.com/"
  },
  {
    label: "Webpack",
    bg_color: '#8ED6FB',
    logo: 'Webpack',
    logoColor: 'white',
    link: "https://webpack.js.org/"
  },
  {
    label: "Vue",
    bg_color: '#42B983',
    logo: 'Vue.js',
    logoColor: 'white',
    link: "https://vuejs.org/"
  },
  {
    label: "React",
    bg_color: '#45b8d7',
    logo: 'React',
    logoColor: 'white',
    link: "https://reactjs.org/"
  },
  {
    label: "MongoDB",
    bg_color: '#14AA52',
    logo: 'mongodb',
    logoColor: 'white',
    link: "https://www.mongodb.com/"
  },
  {
    label: "MySQL",
    bg_color: '#4579A1',
    logo: 'MySQL',
    logoColor: 'white',
    link: "https://dev.mysql.com/"
  },
  {
    label: "Flutter",
    bg_color: '#02569B',
    logo: 'Flutter',
    logoColor: 'white',
    link: "https://flutter.dev/"
  },
  {
    label: "Csharp",
    bg_color: '#239120',
    logo: 'C sharp',
    logoColor: 'white',
    link: "https://docs.microsoft.com/dotnet/csharp/"
  },
  {
    label: "Unity",
    bg_color: '#000000',
    logo: 'Unity',
    logoColor: 'white',
    link: "https://unity.com/"
  }
]

let DATA = {
  name: 'sinlov',
  code_with_badge: code_with_badge_info,
  code_with_list: [],
  lang: 'en',
  i18n_name: 'en-US',
  city: 'Chengdu, CN',
  units: 'metric',
  wind_speed_units: 'meter/sec',
  date: new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'Asia/Shanghai',
  })
};

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
  let openweathermap_url = `https://api.openweathermap.org/data/2.5/weather?${querystring.stringify({q:city})}&appid=${appid}&lang=${lang}&units=${units}`
  await fetch(openweathermap_url)
    .then(r => r.json())
    .then(r => {
      DATA.city_temperature = Math.round(r.main.temp);
      DATA.city_weather_icon = `http://openweathermap.org/img/wn/${r.weather[0].icon}@2x.png`;
      DATA.city_weather = r.weather[0].description;
      DATA.wind_speed = r.wind.speed;
      DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai',
      });
      DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai',
      });
    });
}

// async function setInstagramPosts() {
//   const instagramImages = await puppeteerService.getLatestInstagramPostsFromAccount('visitstockholm', 3);
//   DATA.img1 = instagramImages[0];
//   DATA.img2 = instagramImages[1];
//   DATA.img3 = instagramImages[2];
// }

function generateReadMe() {
  fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}


async function action() {

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
   * Generate README
   */
  await generateReadMe();

  /**
   * future 👋
   */
  // await puppeteerService.close();
}

action();