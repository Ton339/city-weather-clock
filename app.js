// ======================== ตัวแปรอ้างอิง DOM ========================
const input = document.getElementById('search'); // Input field ค้นหา
const label = document.querySelector('.floating-label'); // ป้ายชื่อลอย
const searchBox = document.querySelector('.search-input'); // ช่องค้นหา
const searchButton = document.querySelector('.search-button'); // ปุ่มค้นหา
const weatherIcon = document.querySelector('.weather-icon'); // ไอคอนสภาพอากาศ


// ======================== Floating Label Logic ========================
// เมื่อโฟกัสที่ input
input.addEventListener('focus', () => {
    label.textContent = 'City name'; // เปลี่ยนข้อความป้ายชื่อ
});

// เมื่อออกจาก input
input.addEventListener('blur', () => {
    if (!input.value.trim()) {
        label.textContent = 'City name ex. newyork'; // คืนค่าป้ายชื่อเดิมหากไม่มีค่า
    }
});
//รองรับ Enter key ใน input
input.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

// ======================== Time Functions ========================
/**
 * แปลง Unix Time เป็นรูปแบบเวลาท้องถิ่น
 * @param {number} unixTime - เวลา Unix (วินาที)
 * @param {number} timezoneOffsetSeconds - Offset timezone จาก UTC (วินาที)
 * @returns {string} เวลาในรูปแบบ HH:MM:SS
 */
function formatUnixTimeWithOffset(unixTime, timezoneOffsetSeconds) {
    const t = new Date((unixTime + timezoneOffsetSeconds) * 1000);
    const h = String(t.getUTCHours()).padStart(2, '0');
    const m = String(t.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

// ======================== TimeZoneDB API Functions ========================
/**
 * ดึงเวลาปัจจุบันจาก TimeZoneDB โดยใช้พิกัดเมือง
 * @param {number} lat - ละติจูด
 * @param {number} lon - ลองจิจูด
 * @returns {Promise<number>} Unix Timestamp (หน่วยวินาที)
 */
async function getTimeFromTimeZoneDB(lat, lon) {
    try {
        // ======================== timezonedb.com Api key  https://timezonedb.com/account========================
        const apikey = "your api"
        // สร้าง URL ด้วยพิกัดเมืองและ API Key
        const apiUrl = `https://api.timezonedb.com/v2.1/get-time-zone?key=${apikey}&format=json&by=position&lat=${lat}&lng=${lon}`;

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        console.log(data)
        return data.timestamp; // คืนค่า Unix Timestamp
    } catch (error) {
        console.error("Failed to fetch time:", error);
        return Math.floor(Date.now() / 1000); // Fallback ใช้เวลาปัจจุบัน
    }
}

// ======================== Weather Data Functions ========================
/**
 * ดึงข้อมูลสภาพอากาศจาก OpenWeather API
 * @param {string} city - ชื่อเมืองที่ต้องการค้นหา
 * @returns {Promise<number|null>} timezone offset หรือ null หากผิดพลาด
 */
// ฟังก์ชันแปลงเวลาปัจจุบันเป็น local time
async function getWeatherData(city) {
    try {
        // เรียกข้อมูลอากาศจาก OpenWeather
        const params = new URLSearchParams({
            units: "metric",
            // ======================== openweathermap.org Api key https://home.openweathermap.org/api_keys========================
            appid: "your api",
            q: city
        });

        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`);
        const data = await response.json();
        console.log(data)
        // ดึงพิกัดเมือง
        const lat = data.coord.lat;
        const lon = data.coord.lon;

        // เรียก API เวลาจาก TimeZoneDB
        const apiTimestamp = await getTimeFromTimeZoneDB(lat, lon);

        // อัปเดตข้อมูลใน DOM
        document.getElementById('city').textContent = data.name; // ชื่อเมือง
        document.getElementById('temp').textContent = `${data.main.temp}°C`; // อุณหภูมิ
        document.getElementById('description').textContent = data.weather[0].description;
        // แปลงหน่วยความเร็วลมจาก m/s เป็น km/h
        const windSpeedKm = (data.wind.speed * 3.6).toFixed(2);
        document.getElementById('wind-speed').textContent = `${windSpeedKm} km/h`;

        document.getElementById('humidity').textContent = `${data.main.humidity} %`;
        const timezoneOffsetSeconds = data.timezone;
        // แสดงผลเวลาพระอาทิตย์ขึ้น-ตก
        const sunriseTime = formatUnixTimeWithOffset(data.sys.sunrise, timezoneOffsetSeconds);
        const sunsetTime = formatUnixTimeWithOffset(data.sys.sunset, timezoneOffsetSeconds);
        document.getElementById('sunrise').textContent = sunriseTime;
        document.getElementById('sunset').textContent = sunsetTime;

        // อัปเดตไอคอนสภาพอากาศตามรหัสสภาพอากาศ
        const weatherId = data.weather[0].id;
        if (weatherId === 201) {
            weatherIcon.src = "assets/Thunderstorm with rain.png";
        } else if (weatherId >= 200 && weatherId <= 232) {
            weatherIcon.src = "assets/Thunderstorm.png";
        } else if (weatherId >= 300 && weatherId <= 321) {
            weatherIcon.src = "assets/Drizzle.png";
        } else if (weatherId >= 500 && weatherId <= 531) {
            weatherIcon.src = "assets/Rain.png";
        } else if (weatherId >= 600 && weatherId <= 622) {
            weatherIcon.src = "assets/Snow.png";
        } else if (weatherId >= 701 && weatherId <= 781) {
            weatherIcon.src = "assets/Mist.png"
        } else if (weatherId === 800) {
            weatherIcon.src = "assets/Clear sky.png";
        } else if (weatherId >= 801 && weatherId <= 802) {
            weatherIcon.src = "assets/Few clouds.png";
        } else if (weatherId >= 803 && weatherId <= 804) {
            weatherIcon.src = "assets/Broken clouds.png";
        } else {
            weatherIcon.src = "assets/Clear sky.png";
        }

        // ส่งคืน Timestamp และ Offset
        return {
            timestamp: apiTimestamp,
            offset: data.timezone
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// ======================== Time Updater ========================
let timeInterval = null;

/**
 * อัปเดตเวลาตาม Timestamp จาก API
 * @param {number} initialTimestamp - เวลาเริ่มต้นจาก API
 * @param {number} offset - Timezone offset จาก OpenWeather
 */
function startLocalTimeUpdater(initialTimestamp, offset) {
    console.log(initialTimestamp)
    console.log(offset)
    const timeElement = document.getElementById('local-time');
    if (!timeElement) return;

    if (timeInterval) clearInterval(timeInterval);

    // คำนวณเวลาท้องถิ่นเริ่มต้น
    const initialTime = new Date((initialTimestamp + offset) * 1000);
    let currentTime = initialTime.getTime();

    const updateTime = () => {
        currentTime += 1000; // เพิ่ม 1 วินาทีทุกครั้งที่เรียก
        const date = new Date(currentTime);
        // จัดรูปแบบเวลา HH:MM:SS
        timeElement.textContent = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    updateTime(); // เรียกครั้งแรก
    timeInterval = setInterval(updateTime, 1000); // อัปเดตทุกวินาที
}

// ======================== Event Listeners ========================
// เมื่อโหลดหน้าเว็บครั้งแรก
window.addEventListener('DOMContentLoaded', async () => {
    const defaultCity = "New York";
    searchBox.value = defaultCity;

    // เรียกข้อมูลเริ่มต้น
    const result = await getWeatherData(defaultCity);
    if (result) {
        startLocalTimeUpdater(result.timestamp, result.offset);
    }
});

// เมื่อคลิกปุ่มค้นหา
searchButton.addEventListener('click', async () => {
    const city = searchBox.value.trim();
    if (!city) return alert("กรุณากรอกชื่อเมือง");

    try {
        const result = await getWeatherData(city);
        if (!result) return alert("ไม่พบข้อมูลเมือง");

        startLocalTimeUpdater(result.timestamp, result.offset);
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการค้นหา");
    }
});